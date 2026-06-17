from rest_framework import viewsets, status

from .serializers import (
    CompetencyAreaSerializer, QuestionSerializer, QuestionCreateSerializer, 
    StudentQuestionSerializer, ExamResponseSerializer,
    ExamAttemptSerializer, QuestionSyncSerializer
)
from .models import (
    CompetencyArea, Question, 
    ExamAttempt, ExamResponse, 
    QuestionOption
)
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from django.db.models import Avg, Count, Q
from django.utils.dateparse import parse_datetime
from core.models import UniversityBookSubscription

# We have two serializers for questions: One for teachers/admins with all details, and one for students that hides the correct answer and explanation.
class CompetencyAreaViewSet(viewsets.ModelViewSet):
    serializer_class = CompetencyAreaSerializer

    def get_queryset(self):
        user = self.request.user
        tenant = self.request.tenant

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



        return compt_area

 
# This is the main viewset for questions. It dynamically chooses which serializer to use based on the user's role. Admins and teachers get the full details, while students get a simplified version that hides the correct answer and explanation.
class QuestionViewSet(viewsets.ModelViewSet):
    queryset = Question.objects.all()

    def get_serializer_class(self):
        # use write serializer for create / update, read serializer otherwise
        if self.action in ('create', 'update', 'partial_update'):
            return QuestionCreateSerializer
        return QuestionSerializer

    # optional: restrict queryset or order, include related prefetches
    def get_queryset(self):
        return Question.objects.select_related('competency_area').prefetch_related('options').order_by('-id')


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
        if attempt.status == ExamAttempt.Status.COMPLETED:
            return Response({"error": "Exam already submitted"}, status=400)
            

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

        attempt.score = (correct_count / total_questions) * 100 if total_questions > 0 else 0
        attempt.status = ExamAttempt.Status.COMPLETED
        attempt.end_time = timezone.now()
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

        if user.role == 'ADMIN':
            base_queryset = ExamAttempt.objects.filter(university=tenant, status='COMPLETED')
        else:
            if not user.department:
                 return Response({"error": "Your account is not linked to a department."}, status=400)
            base_queryset = ExamAttempt.objects.filter(user=user, university=tenant, status='COMPLETED')


        # 1. SAFETY GUARD
        if not user.department:
            return Response({"error": "Department assignment required for analytics."}, status=400)

        # 2. BASE LOCK: Define the user's private data
        # We filter by User AND Tenant for total isolation
        base_queryset = ExamAttempt.objects.filter(
            user=user, 
            university=tenant,
            status='COMPLETED'
        )

        # 3. OVERALL STATS (Personal)
        stats = base_queryset.aggregate(
            avg_score=Avg('score'),
            total_exams=Count('id')
        )

        # 4. SUBJECT MASTERY & NATIONAL BENCHMARKING
        # We want to show: "Your Avg" vs "Everyone's Avg" for each topic
        performance_data = []
        
        # Get the subjects this student has actually attempted
        user_subjects = base_queryset.values(
            'competency_area_id', 
            'competency_area__name'
        ).annotate(my_avg=Avg('score'))

        for entry in user_subjects:
            comp_id = entry['competency_area_id']
            comp_name = entry['competency_area__name']

            # Calculate the Platform-wide (National) average for THIS specific subject
            # Notice we DON'T filter by tenant here, to get the global benchmark
            national_avg = ExamAttempt.objects.filter(
                competency_area_id=comp_id,
                status='COMPLETED'
            ).aggregate(Avg('score'))['score__avg'] or 0

            performance_data.append({
                "competency_area__name": comp_name,
                "average_score": round(entry['my_avg'], 1),
                "national_avg": round(national_avg, 1), # THE MAGIC NUMBER
                "status": "Above National" if entry['my_avg'] >= national_avg else "Below National"
            })

        # 5. RECENT HISTORY
        history = base_queryset.values(
            'id', 
            'end_time', 
            'score', 
            'competency_area__name'  
        ).order_by('-end_time')[:5]  

        return Response({
            "university": tenant.name,
            "department": user.department.name,
            "department_category": user.department.category,
            "overall": stats,
            "by_competency": performance_data,
            "history": history
        })


class QuestionSyncView(APIView):
    # def get(self, request):
    #     user = request.user
    #     last_sync_str = request.query_params.get('last_sync')
        
    #     # 1. Base Query: Only questions for this University + Department
    #     queryset = Question.objects.filter(
    #         competency_area__department=user.department,
    #         competency_area__department__university=request.tenant
    #     )

    #     # 2. Delta Logic: Only fetch what's new
    #     if last_sync_str:
    #         last_sync_date = parse_datetime(last_sync_str)
    #         if last_sync_date:
    #             queryset = queryset.filter(updated_at__gt(last_sync_date))

    #     # 3. Optimization: Use select_related to prevent N+1 queries
    #     queryset = queryset.select_related('competency_area').prefetch_related('options')

    #     serializer = QuestionSyncSerializer(queryset, many=True)

    #     return Response({
    #         "sync_time": timezone.now(), # Frontend saves this for the next call
    #         "count": queryset.count(),
    #         "questions": serializer.data
    #     })

    def get(self, request):
            user = request.user
            tenant = request.tenant

            # DEBUG PRINTS
            unlocked_ids = UniversityBookSubscription.objects.filter(university=tenant).values_list('book_id', flat=True)
            print(f"DEBUG: Tenant {tenant.slug} has access to Book IDs: {list(unlocked_ids)}")
            print(f"DEBUG: Student Dept Category is: {user.department.category}")

            queryset = Question.objects.filter(
                competency_area__book_id__in=unlocked_ids,
                competency_area__book__category=user.department.category
            )
            
            print(f"DEBUG: Found {queryset.count()} questions matching these rules.")

            serializer = QuestionSyncSerializer(queryset, many=True)
            return Response({
                "sync_time": timezone.now(),
                "count": queryset.count(),
                "questions": serializer.data
            })



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


import csv
import io
from rest_framework.parsers import MultiPartParser
from django.db import transaction
from django.shortcuts import get_object_or_404
from .models import Question, QuestionOption, CompetencyArea


class BulkQuestionUploadView(APIView):
    parser_classes = [MultiPartParser] # Allows processing files

    def post(self, request):
        # 1. Security Check: Only Deans or Teachers can upload
        if request.user.role not in ['ADMIN', 'TEACHER']:
            return Response({"error": "Unauthorized"}, status=403)

        file = request.FILES.get('file')
        competency_area_id = request.data.get('competency_area_id')

        if not file or not competency_area_id:
            return Response({"error": "File and Competency Area ID are required."}, status=400)

        # 2. Verify Competency Area belongs to this University or is Global
        competency = get_object_or_404(CompetencyArea, id=competency_area_id)

        try:
            # 3. Process the CSV
            decoded_file = file.read().decode('utf-8')
            io_string = io.StringIO(decoded_file)
            reader = csv.DictReader(io_string)

            questions_created = 0
            
            with transaction.atomic():
                for row in reader:
                    # Create the Question
                    q = Question.objects.create(
                        university=request.tenant,
                        competency_area=competency,
                        text=row['text'],
                        explanation=row.get('explanation', ''),
                        is_global=False # This is university-specific content
                    )
                    
                    # Create the 4 Options
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

            return Response({"message": f"Successfully imported {questions_created} questions to {competency.name}."}, status=201)

        except Exception as e:
            return Response({"error": f"Error parsing CSV: {str(e)}"}, status=400)