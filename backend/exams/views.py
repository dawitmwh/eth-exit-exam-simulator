from rest_framework import viewsets, status
from users.models import User
from .serializers import (
    CompetencyAreaSerializer, QuestionSerializer, QuestionCreateSerializer, 
    StudentQuestionSerializer, ExamResponseSerializer,
    ExamAttemptSerializer, QuestionSyncSerializer, ExamBookSerializer
)
from users.models import User
from .models import (
    CompetencyArea, Question, 
    ExamAttempt, ExamResponse, 
    QuestionOption
)
from core.models import ExamBook
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from django.db.models import Avg, Count, Q, Sum
from django.utils.dateparse import parse_datetime
from core.models import UniversityBookSubscription
from django.db import transaction
from django.utils import timezone

import csv
import io
from rest_framework.parsers import MultiPartParser
from datetime import timedelta
from rest_framework.permissions import IsAdminUser
import csv
import logging

logger = logging.getLogger(__name__)

# We have two serializers for questions: One for teachers/admins with all details, and one for students that hides the correct answer and explanation.
class CompetencyAreaViewSet(viewsets.ModelViewSet):
    serializer_class = CompetencyAreaSerializer

    def get_queryset(self):
        user = self.request.user
        tenant = self.request.tenant

        print(f"User, tenant {user} {tenant}")

        
        # 1. Safety Check: Ensure the user has a department
        if not user.department:
            return CompetencyArea.objects.none()

        # 2. Find which books this specific University has unlocked
        unlocked_book_ids = UniversityBookSubscription.objects.filter(
            university=tenant
        ).values_list('book_id', flat=True)

       
        compt_area = CompetencyArea.objects.filter(
            book_id__in=unlocked_book_ids,
            book__category=user.department.category
        ).annotate(
            annotated_question_count=Count('questions')
        ).select_related('book')  

        print(f"DEBUG CA: {compt_area}")

       

        return compt_area

 
# This is the main viewset for questions. It dynamically chooses which serializer to use based on the user's role. Admins and teachers get the full details, while students get a simplified version that hides the correct answer and explanation.
class QuestionViewSet(viewsets.ModelViewSet):
    queryset = Question.objects.all()
    
    def get_serializer_class(self):
        # use write serializer for create / update, read serializer otherwise
        if self.action in ('create', 'update', 'partial_update'):
            return QuestionCreateSerializer
        return QuestionSerializer
        
        mode = self.request.query_params.get('mode')

        if self.request.user.role in ['ADMIN', 'TEACHER'] or mode == 'practice':
            return QuestionSerializer

    # optional: restrict queryset or order, include related prefetches
    def get_queryset(self):
        user = self.request.user
        tenant = self.request.tenant

        # 1. Safety Guard
        if not user.is_authenticated or not user.department:
            return Question.objects.none()

        # 2. Identify unlocked books
        unlocked_book_ids = UniversityBookSubscription.objects.filter(
            university=tenant
        ).values_list('book_id', flat=True)

        # 3. Base isolated queryset
        queryset = Question.objects.filter(
            competency_area__book_id__in=unlocked_book_ids,
            competency_area__book__category__iexact=user.department.category
        )

        # 4. THE FIX: Defensive filtering
        comp_id = self.request.query_params.get('competency_area')
        
        # Only apply the filter if comp_id is a valid number string (e.g., "1", "42")
        # If it is "full-mock", .isdigit() is False, so it skips the crash!
        if comp_id and comp_id.isdigit():
            queryset = queryset.filter(competency_area_id=comp_id)
        
        # Note: If comp_id is "full-mock", the frontend should be calling 
        # the specific FullMockQuestionView anyway, but this guard prevents 
        # a 500 error if they hit this endpoint by mistake.

        return queryset.select_related('competency_area').prefetch_related('options').order_by('-id')

        
# This viewset handles the exam attempts. It ensures that students can only see their own attempts, while teachers and admins can see all attempts. It also includes a custom action for submitting an exam, which processes the student's answers and calculates their score.
class ExamAttemptViewSet(viewsets.ModelViewSet):
    
    def get_queryset(self):
        user = self.request.user
        if user.role in ['ADMIN', 'TEACHER']:
            return ExamAttempt.objects.all()
        return ExamAttempt.objects.filter(user=user)


    def get_serializer_class(self):
        return ExamAttemptSerializer


    def perform_create(self, serializer):
        # Automatically tag the attempt with the University from the subdomain
        serializer.save(
            user=self.request.user, 
            university=self.request.tenant
        )

    @action(detail=True, methods=['post'])
    def submit_exam(self, request, pk=None):
        attempt = self.get_object() 
       
        now = timezone.now()
        if attempt.status == ExamAttempt.Status.COMPLETED:
            return Response({"error": "Exam already submitted"}, status=400)

        if attempt.competency_area:
            # Individual Subject Exam
            allowed_minutes = attempt.competency_area.duration_minutes
            # 1. Calculate REAL time taken
            time_delta = now - attempt.start_time
            minutes_taken = time_delta.total_seconds() / 60
            
            # 2. Compare with allowed time (plus a 1-minute grace period for network lag)
            
            is_overtime = False
            if minutes_taken > (allowed_minutes + 1):
                is_overtime = True
                
            
        else:
            # Full Mock Exam (Aggregate)
            # Default to 120 minutes or whatever your system standard is
            allowed_minutes = 120 


        answers = request.data.get('answers', [])  
        correct_count = 0
        total_questions = len(answers)


        for ans in answers:
            option = QuestionOption.objects.filter(id=ans['selected_option_id']).first()
            if not option:
                return Response({
                    "error": f"Option ID {ans['selected_option_id']} does not exist."
                }, status=400)
            
            question = Question.objects.filter(id=ans['question_id']).first()
            if not question:
                return Response({
                    "error": f"Question ID {ans['question_id']} does not exist."
                }, status=400)

            ExamResponse.objects.create(
                attempt=attempt,
                question_id=ans['question_id'],
                selected_option=option,
                is_correct=option.is_correct,
                time_spent_seconds=ans['time_spent']
            )

            if option.is_correct:
                correct_count += 1
        
        attempt.correct_answers = correct_count
        attempt.total_questions = total_questions
        attempt.score = (correct_count / total_questions) * 100 if total_questions > 0 else 0
        attempt.status = ExamAttempt.Status.COMPLETED
        attempt.end_time = now
        attempt.save()


        return Response({
            "score": attempt.score,
            "correct_answers": correct_count,
            "total_questions": total_questions
        })

 
class StudentDashboardView(APIView):
    def get(self, request):
        user = request.user
        tenant = request.tenant

        # 1. INITIALIZE STRUCTURE
        response_data = {
            "university": tenant.name if tenant else "N/A",
            "department": user.department.name if user.department else "N/A",
            "classroom_name": user.classroom.name if user.classroom else None,
            "mentor_name": f"{user.classroom.teacher.first_name} {user.classroom.teacher.last_name}" if user.classroom else None,
            "overall": {"total_exams": 0, "avg_score": 0, "ready_score": 0},
            "metrics": {
                "peer_count": 0,
                "total_questions": 0,
                "coverage_percent": 0,
                "study_time_minutes": 0
            },
            "by_competency": [],
            "history": []
        }

        # 2. SCOPE LOGIC
        if user.role == 'ADMIN':
            base_qs = ExamAttempt.objects.filter(university=tenant, status='COMPLETED')
            peer_qs = User.objects.filter(university=tenant, role='STUDENT')
        else:
            if not user.department: return Response({"error": "No department"}, status=400)
            base_qs = ExamAttempt.objects.filter(user=user, university=tenant, status='COMPLETED')
            peer_qs = User.objects.filter(university=tenant, department=user.department, role='STUDENT')

        # 3. CALCULATE SEPARATE SCORES
        # Practice/Simulated (Subject based)
        subject_stats = base_qs.filter(competency_area__isnull=False).aggregate(avg=Avg('score'), count=Count('id'))
        # Exit Mock Simulator (Full Syllabus)
        mock_stats = base_qs.filter(competency_area__isnull=True).aggregate(avg=Avg('score'))

        response_data["overall"].update({
            "total_exams": subject_stats['count'] or 0,
            "avg_score": round(subject_stats['avg'] or 0, 1),
            "ready_score": round(mock_stats['avg'] or 0, 1) # This is the "Exit Mock" Avg
        })

        # 4. METRICS (Students Only)
        response_data["metrics"]["peer_count"] = peer_qs.count()
        if user.role == 'STUDENT':
            total_qs = Question.objects.filter(
                Q(is_global=True) | Q(university=tenant),
                competency_area__book__category=user.department.category
            ).count()
            answered_unique = ExamResponse.objects.filter(attempt__user=user).values('question').distinct().count()
            time_data = ExamResponse.objects.filter(attempt__user=user).aggregate(total_sec=Sum('time_spent_seconds'))
            
            response_data["metrics"].update({
                "total_questions": total_qs,
                "coverage_percent": round((answered_unique / total_qs * 100), 1) if total_qs > 0 else 0,
                "study_time_minutes": round((time_data['total_sec'] or 0) / 60, 1)
            })

        # 5. BENCHMARKING
        # We exclude Full Mocks from "By Competency" because they cover all topics
        performance = base_qs.filter(competency_area__isnull=False).values(
            'competency_area_id', 'competency_area__name'
        ).annotate(my_avg=Avg('score'))
        
        for entry in performance:
            n_avg = ExamAttempt.objects.filter(
                competency_area_id=entry['competency_area_id'], status='COMPLETED'
            ).aggregate(avg=Avg('score'))['avg'] or 0

            response_data["by_competency"].append({
                "competency_area__name": entry['competency_area__name'],
                "average_score": round(entry['my_avg'], 1),
                "national_avg": round(n_avg, 1),
                "status": "Above National" if entry['my_avg'] >= n_avg else "Below National"
            })

        # 6. HISTORY WITH FRACTIONAL SCORE & MOCK FLAG
        history_qs = base_qs.values(
            'id', 'end_time', 'score', 'competency_area__name', 
            'correct_answers', 'total_questions'
        ).order_by('-end_time')[:5]
        
        for h in history_qs:
            h['is_mock'] = h['competency_area__name'] is None # If area name is null, it was a Full Mock
            response_data["history"].append(h)

        return Response(response_data)

 
class StudentAnalyticsView(APIView):
    def get(self, request):
        user = request.user
        
        # 1. Base Query
        completed_attempts = ExamAttempt.objects.filter(user=user, status='COMPLETED')
        
        if not completed_attempts.exists():
            return Response({
                "metrics": {"overall_progress": 0, "avg_time_minutes": 0, "mastery_ratio": "0/0"},
                "progress_data": [],
                "category_performance": [],
                "weak_areas": []
            })

        # 2. Aggregations
        # Use 'responses__time_spent_seconds' ONLY if you have a related_name='responses' 
        # in your ExamResponse model pointing to ExamAttempt.
        category_stats = completed_attempts.values('competency_area__name').annotate(
            avg_score=Avg('score'),
            avg_time=Avg('responses__time_spent_seconds'), 
            attempt_count=Count('id')
        )

        category_performance = [
            {
                "category": item['competency_area__name'] if item['competency_area__name'] else "Comprehensive Exit Mock",
                "score": round(item['avg_score'], 1),
                "avgTime": round((item['avg_time'] or 0) / 60, 2),
            } for item in category_stats
        ]

        # 3. Mastery Ratio Calculation
        total_categories = len(category_performance)
        mastered_categories = len([c for c in category_performance if c['score'] >= 75])
        mastery_ratio = f"{mastered_categories}/{total_categories}"

        
        # 4. Meta Metrics
        overall_avg = completed_attempts.aggregate(Avg('score'))['score__avg'] or 0
        
        # Calculate avg time per question across ALL responses
        avg_time_per_q = ExamResponse.objects.filter(
            attempt__user=user, 
            attempt__status='COMPLETED'
        ).aggregate(Avg('time_spent_seconds'))['time_spent_seconds__avg'] or 0


        return Response({
            "metrics": {
                "overall_progress": round(overall_avg, 1),
                "avg_time_minutes": round(avg_time_per_q / 60, 2),
                "mastery_ratio": mastery_ratio
            },
            "progress_data": [
                {
                    "exam": f"T-{a.id}", 
                    "score": a.score, 
                    "date": a.end_time.strftime("%d/%m")
                } for a in completed_attempts.order_by('end_time')[:10]
            ],
            "category_performance": category_performance,
            "weak_areas": [c for c in category_performance if c['score'] < 60][:3],
             
        })



class QuestionSyncView(APIView):
    def get(self, request):
            user = request.user
            tenant = request.tenant

            unlocked_ids = UniversityBookSubscription.objects.filter(university=tenant).values_list('book_id', flat=True)

            queryset = Question.objects.filter(
                competency_area__book_id__in=unlocked_ids,
                competency_area__book__category=user.department.category
            )

            serializer = QuestionSyncSerializer(queryset, many=True)
            return Response({
                "sync_time": timezone.now(),
                "count": queryset.count(),
                "questions": serializer.data
            })


class FullMockQuestionView(APIView):
    def get(self, request):
        user = request.user
        tenant = request.tenant

        # 1. Find unlocked books for this university
        unlocked_books = UniversityBookSubscription.objects.filter(
            university=tenant
        ).values_list('book_id', flat=True)

        # 2. Get ALL questions for the student's department category
        queryset = Question.objects.filter(
            competency_area__book_id__in=unlocked_books,
            competency_area__book__category=user.department.category
        ).order_by('?')[:100] # '?' Shuffles the questions, limited to 100

        serializer = QuestionSerializer(queryset, many=True)
        return Response(serializer.data)


class DeanAnalyticsView(APIView):
    def get(self, request):
        # 1. Ensure only the Dean can access this
        if request.user.role != 'ADMIN':
            return Response({"error": "Unauthorized"}, status=403)

        # 2. Get all completed attempts for THIS university
        base_queryset = ExamAttempt.objects.filter(
            university=request.tenant,
            status='COMPLETED'
        )

        # 3. Aggregate Performance by Department
        department_stats = base_queryset.values('user__department__name').annotate(
            average_score=Avg('score'),
            total_students=Count('user', distinct=True),
            total_exams=Count('id')
        ).order_by('-average_score')

        # 4. Top Performing Students (The 'Wall of Fame')
        top_students = base_queryset.values('user__first_name', 'user__email').annotate(
            avg_student_score=Avg('score')
        ).order_by('-avg_student_score')[:10]

        return Response({
            "university_name": request.tenant.name,
            "department_breakdown": department_stats,
            "top_performers": top_students,
        })



class DepartmentComparisonView(APIView):
    def get(self, request):
        if request.user.role != 'ADMIN':
            return Response(status=403)

        # Calculate average score for every department in THIS university
        comparison = Department.objects.filter(university=request.tenant).annotate(
            avg_score=Avg('examattempt__score'),
            student_count=Count('user', distinct=True)
        ).values('name', 'avg_score', 'student_count').order_by('-avg_score')

        return Response(comparison)



class BulkQuestionUploadView(APIView):
    parser_classes = [MultiPartParser]

    def post(self, request):
        # 1. AUTHENTICATION & ROLE CHECK
        # Must be either a Superuser (SaaS Owner) or an Admin/Teacher (Client)
        if not request.user.is_superuser and request.user.role not in ['ADMIN', 'TEACHER']:
            return Response({"error": "Unauthorized access to content factory."}, status=403)

        file = request.FILES.get('file')
        competency_area_id = request.data.get('competency_area_id')

        if not file or not competency_area_id:
            return Response({"error": "CSV file and Target Area are required."}, status=400)

        # 2. TARGET VALIDATION
        competency = get_object_or_404(CompetencyArea, id=competency_area_id)

        # 3. OWNERSHIP LOGIC (The SaaS Master Switch)
        is_owner = request.user.is_superuser
        
        if is_owner:
            # Questions uploaded by the Owner are Global and have no single university owner
            target_university = None
            is_global = True
            content_type = "MASTER (NATIONAL STANDARD)"
        else:
            # Questions uploaded by a Dean/Teacher are Private to their university
            target_university = request.tenant
            is_global = False
            content_type = "INSTITUTIONAL (PRIVATE)"

        try:
            # 4. CSV PROCESSING
            decoded_file = file.read().decode('utf-8-sig')
            io_string = io.StringIO(decoded_file)
            reader = csv.DictReader(io_string)

            questions_created = 0
            
            with transaction.atomic():
                for row in reader:
                    # Create the Question
                    q = Question.objects.create(
                        university=target_university,
                        competency_area=competency,
                        text=row['text'],
                        explanation=row.get('explanation', ''),
                        is_global=is_global
                    )
                    
                    # Create Options (A, B, C, D)
                    options_map = [
                        ('A', row['option_a']),
                        ('B', row['option_b']),
                        ('C', row['option_c']),
                        ('D', row['option_d']),
                    ]
                    
                    correct_letter = row['correct_option'].strip().upper()

                    for letter, text in options_map:
                        QuestionOption.objects.create(
                            question=q,
                            option_text=text,
                            is_correct=(letter == correct_letter)
                        )
                    questions_created += 1

            # 5. RESPONSE
            return Response({
                "message": f"Successfully imported {questions_created} questions.",
                "type": content_type,
                "target_area": competency.name,
                "tenant_scope": target_university.name if target_university else "PLATFORM-WIDE"
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({"error": f"CSV structure error: {str(e)}"}, status=400)


class GlobalBookViewSet(viewsets.ModelViewSet):
    # Only you (SaaS Owner) have the key to this library
    permission_classes = [IsAdminUser] 
    serializer_class = ExamBookSerializer
    queryset = ExamBook.objects.all().order_by('-created_at')

    def get_queryset(self):
        # Prefetch competencies to make the 'count' calculation fast
        return ExamBook.objects.all().prefetch_related('competencies').order_by('-created_at')

    def perform_create(self, serializer):
        # Global books don't belong to a university, they are system-wide
        serializer.save()

 
class GlobalCompetencyViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminUser]
    queryset = CompetencyArea.objects.all().select_related('book')
    serializer_class = CompetencyAreaSerializer
    
    

class ExportStudentResultsView(APIView):
    def get(self, request):
        # 1. Role Security Check
        if not request.user.is_authenticated or request.user.role != 'ADMIN':
            return Response({"error": "Unauthorized"}, status=403)

        try:
            # 2. Setup CSV Response
            response = HttpResponse(content_type='text/csv')
            # Clean university name for filename
            filename = f"{request.tenant.slug}_results.csv"
            response['Content-Disposition'] = f'attachment; filename="{filename}"'

            writer = csv.writer(response)
            writer.writerow(['Student Name', 'Email', 'Exam Title', 'Score (%)', 'Date Completed'])

            # 3. Fetch Data with Prefetching
            attempts = ExamAttempt.objects.filter(
                university=request.tenant, 
                status='COMPLETED'
            ).select_related('user', 'competency_area')

            # 4. Defensive Writing
            for a in attempts:
                # Handle possible Nulls gracefully
                name = a.user.full_name if hasattr(a.user, 'full_name') else f"{a.user.first_name} {a.user.last_name}"
                email = a.user.email
                subject = a.competency_area.name if a.competency_area else 'Full Mock Simulator'
                score = f"{a.score}%"
                
                # CRITICAL FIX: Only call strftime if end_time exists
                date = a.end_time.strftime("%Y-%m-%d") if a.end_time else "N/A"

                writer.writerow([name, email, subject, score, date])

            return response

        except Exception as e:
            # This will show the real error in your Linux terminal
            print(f"❌ EXPORT ERROR: {str(e)}")
            return Response({"error": "Failed to generate CSV. Check server logs."}, status=500)

from django.template.loader import get_template
from xhtml2pdf import pisa
from django.http import HttpResponse
from django.db.models import Avg, Count
from datetime import datetime

class InstitutionalReportPDFView(APIView):
    def get(self, request):
        if request.user.role != 'ADMIN':
            return Response({"error": "Unauthorized"}, status=403)

        tenant = request.tenant
        
        # 1. Aggregate Data
        attempts = ExamAttempt.objects.filter(university=tenant, status='COMPLETED')
        stats = attempts.aggregate(avg=Avg('score'), total=Count('id'))
        
        breakdown = attempts.values('competency_area__name').annotate(
            avg_score=Avg('score'),
            total=Count('id')
        ).order_by('-avg_score')

        # 2. Prepare Context
        context = {
            "university_name": tenant.name,
            "primary_color": tenant.primary_color or "#4f46e5",
            "avg_score": round(stats['avg'] or 0, 1),
            "total_exams": stats['total'],
            "total_students": User.objects.filter(university=tenant, role='STUDENT').count(),
            "report_date": datetime.now().strftime("%B %d, %Y"),
            "breakdown": breakdown,
            # For PDF, local file paths work better than URLs
            "logo_path": tenant.logo.path if tenant.logo else None 
        }

        # 3. Render PDF
        template = get_template('reports/institutional_report.html')
        html = template.render(context)
        
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{tenant.slug}_readiness_report.pdf"'
        
        # Create PDF
        pisa_status = pisa.CreatePDF(html, dest=response)
        
        if pisa_status.err:
            return Response({"error": "PDF Generation Error"}, status=500)
        return response