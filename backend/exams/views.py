from rest_framework import viewsets
from .serializers import (
    CompetencyAreaSerializer, QuestionSerializer, 
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


# We have two serializers for questions: One for teachers/admins with all details, and one for students that hides the correct answer and explanation.
class CompetencyAreaViewSet(viewsets.ModelViewSet):
    queryset = CompetencyArea.objects.all()
    serializer_class = CompetencyAreaSerializer

    def get_queryset(self):
        user = self.request.user
        # Use .annotate() to calculate the count in one single SQL query
        return CompetencyArea.objects.filter(department=user.department).annotate(
            annotated_question_count=Count('questions')
        )
 
# This is the main viewset for questions. It dynamically chooses which serializer to use based on the user's role. Admins and teachers get the full details, while students get a simplified version that hides the correct answer and explanation.
class QuestionViewSet(viewsets.ModelViewSet):
    queryset = Question.objects.all() 

    def get_queryset(self):
        user = self.request.user
        tenant = self.request.tenant
        # Only questions for ABC University + Department (http://ABC.localhost:8000/api/questions/)
        queryset = Question.objects.filter(Q(competency_area__department__university=tenant) & Q(competency_area__department=user.department))

        if user.role == 'STUDENT':
                queryset = queryset.filter(competency_area__department=user.department)
        
        return queryset.select_related('competency_area').prefetch_related('options')

    def get_serializer_class(self):
        if self.request.user.role == 'ADMIN' or self.request.user.role == 'TEACHER':
            print("CHOICE: Picking FULL QuestionSerializer")
            return QuestionSerializer
    
        print("CHOICE: Picking STUDENT StudentQuestionSerializer")
        return StudentQuestionSerializer

# This viewset handles the exam attempts. It ensures that students can only see their own attempts, while teachers and admins can see all attempts. It also includes a custom action for submitting an exam, which processes the student's answers and calculates their score.
class ExamAttemptViewSet(viewsets.ModelViewSet):
    
    def get_queryset(self):
        user = self.request.user
        if user.role in ['ADMIN', 'TEACHER']:
            return ExamAttempt.objects.all()
        return ExamAttempt.objects.filter(user=user)

    def get_serializer_class(self):
        return ExamAttemptSerializer

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
        user = request.user
        tenant = request.tenant

        base_queryset = ExamAttempt.objects.filter(
            user=user, 
            competency_area__department__university=tenant,
            status='COMPLETED'
        ) 

        stats = base_queryset.aggregate(
            avg_score=Avg('score'),
            total_exams=Count('id')
        )
 

        competency_performance = base_queryset \
            .values('competency_area__name') \
            .annotate(average_score=Avg('score')) \
            .order_by('-average_score')
         
        history = base_queryset.values(
            'id', 
            'end_time', 
            'score', 
            'competency_area__name'  
        ).order_by('-end_time')[:5]  

        return Response({
            "overall": stats,
            "by_competency": competency_performance,
            "history": history,
            "department": user.department.name if user.department else 'N/A',
            "university": tenant.name if tenant else 'N/A'
        })


class QuestionSyncView(APIView):
    def get(self, request):
        user = request.user
        last_sync_str = request.query_params.get('last_sync')
        
        # 1. Base Query: Only questions for this University + Department
        queryset = Question.objects.filter(
            competency_area__department=user.department,
            competency_area__department__university=request.tenant
        )

        # 2. Delta Logic: Only fetch what's new
        if last_sync_str:
            last_sync_date = parse_datetime(last_sync_str)
            if last_sync_date:
                queryset = queryset.filter(updated_at__gt(last_sync_date))

        # 3. Optimization: Use select_related to prevent N+1 queries
        queryset = queryset.select_related('competency_area').prefetch_related('options')

        serializer = QuestionSyncSerializer(queryset, many=True)

        return Response({
            "sync_time": timezone.now(), # Frontend saves this for the next call
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