from rest_framework import viewsets, status
from users.models import User
from .serializers import CompetencyAreaSerializer, QuestionSerializer, QuestionCreateSerializer, ExamAttemptSerializer, ExamBookSerializer
from .models import CompetencyArea, Question, ExamAttempt, ExamResponse, QuestionOption
from core.models import ExamBook, UniversityBookSubscription
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from django.db.models import Avg, Count, Q, Sum
from django.db import transaction
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import IsAdminUser
import csv
import io
import logging

logger = logging.getLogger(__name__)

class CompetencyAreaViewSet(viewsets.ModelViewSet):
    serializer_class = CompetencyAreaSerializer

    def get_queryset(self):
        user = self.request.user
        tenant = self.request.tenant
        if not user.department:
            return CompetencyArea.objects.none()
        unlocked_book_ids = UniversityBookSubscription.objects.filter(university=tenant).values_list('book_id', flat=True)
        return CompetencyArea.objects.filter(
            book_id__in=unlocked_book_ids,
            book__category=user.department.category,
        ).annotate(annotated_question_count=Count('questions')).select_related('book')


class QuestionViewSet(viewsets.ModelViewSet):
    queryset = Question.objects.all()

    def get_serializer_class(self):
        if self.action in ('create', 'update', 'partial_update'):
            return QuestionCreateSerializer
        return QuestionSerializer

    def get_queryset(self):
        user = self.request.user
        tenant = self.request.tenant
        if not user.is_authenticated or not user.department:
            return Question.objects.none()
        unlocked_book_ids = UniversityBookSubscription.objects.filter(university=tenant).values_list('book_id', flat=True)
        queryset = Question.objects.filter(
            competency_area__book_id__in=unlocked_book_ids,
            competency_area__book__category__iexact=user.department.category,
        )
        comp_id = self.request.query_params.get('competency_area')
        if comp_id and comp_id.isdigit():
            queryset = queryset.filter(competency_area_id=comp_id)
        return queryset.select_related('competency_area').prefetch_related('options').order_by('-id')


class ExamAttemptViewSet(viewsets.ModelViewSet):
    def get_queryset(self):
        user = self.request.user
        tenant = self.request.tenant
        if user.role in ['ADMIN', 'TEACHER']:
            return ExamAttempt.objects.filter(university=tenant)
        return ExamAttempt.objects.filter(user=user, university=tenant)

    def get_serializer_class(self):
        return ExamAttemptSerializer

    def perform_create(self, serializer):
        mode = str(self.request.data.get('mode', ExamAttempt.Mode.SIMULATED)).upper()
        if mode not in (ExamAttempt.Mode.PRACTICE, ExamAttempt.Mode.SIMULATED):
            mode = ExamAttempt.Mode.SIMULATED
        serializer.save(user=self.request.user, university=self.request.tenant, mode=mode)


class StudentDashboardView(APIView):
    def get(self, request):
        user = request.user
        tenant = request.tenant
        response_data = {
            'university': tenant.name if tenant else 'N/A',
            'department': user.department.name if user.department else 'N/A',
            'classroom_name': user.classroom.name if user.classroom else None,
            'mentor_name': f"{user.classroom.teacher.first_name} {user.classroom.teacher.last_name}" if user.classroom else None,
            'overall': {'total_exams': 0, 'avg_score': 0, 'ready_score': 0},
            'metrics': {'peer_count': 0, 'total_questions': 0, 'coverage_percent': 0, 'study_time_minutes': 0},
            'by_competency': [],
            'history': [],
        }
        if user.role == 'ADMIN':
            base_qs = ExamAttempt.objects.filter(university=tenant, status='COMPLETED')
            peer_qs = User.objects.filter(university=tenant, role='STUDENT')
        else:
            if not user.department:
                return Response({'error': 'No department'}, status=400)
            base_qs = ExamAttempt.objects.filter(user=user, university=tenant, status='COMPLETED')
            peer_qs = User.objects.filter(university=tenant, department=user.department, role='STUDENT')

        subject_stats = base_qs.filter(competency_area__isnull=False).aggregate(avg=Avg('score'), count=Count('id'))
        mock_stats = base_qs.filter(competency_area__isnull=True).aggregate(avg=Avg('score'))
        response_data['overall'].update({'total_exams': subject_stats['count'] or 0, 'avg_score': round(subject_stats['avg'] or 0, 1), 'ready_score': round(mock_stats['avg'] or 0, 1)})
        response_data['metrics']['peer_count'] = peer_qs.count()
        if user.role == 'STUDENT':
            total_qs = Question.objects.filter(Q(is_global=True) | Q(university=tenant), competency_area__book__category=user.department.category).count()
            answered_unique = ExamResponse.objects.filter(attempt__user=user, attempt__university=tenant).values('question').distinct().count()
            time_data = ExamResponse.objects.filter(attempt__user=user, attempt__university=tenant).aggregate(total_sec=Sum('time_spent_seconds'))
            response_data['metrics'].update({'total_questions': total_qs, 'coverage_percent': round((answered_unique / total_qs * 100), 1) if total_qs else 0, 'study_time_minutes': round((time_data['total_sec'] or 0) / 60, 1)})

        performance = base_qs.filter(competency_area__isnull=False).values('competency_area_id', 'competency_area__name').annotate(my_avg=Avg('score'))
        for entry in performance:
            n_avg = ExamAttempt.objects.filter(university=tenant, competency_area_id=entry['competency_area_id'], status='COMPLETED').aggregate(avg=Avg('score'))['avg'] or 0
            response_data['by_competency'].append({'competency_area__name': entry['competency_area__name'], 'average_score': round(entry['my_avg'], 1), 'national_avg': round(n_avg, 1), 'status': 'Above National' if entry['my_avg'] >= n_avg else 'Below National'})

        history_qs = base_qs.values('id', 'end_time', 'score', 'competency_area__name', 'correct_answers', 'total_questions').order_by('-end_time')[:5]
        for item in history_qs:
            item['is_mock'] = item['competency_area__name'] is None
            response_data['history'].append(item)
        return Response(response_data)


class BulkQuestionUploadView(APIView):
    parser_classes = [MultiPartParser]

    def post(self, request):
        if not request.user.is_superuser and request.user.role not in ['ADMIN', 'TEACHER']:
            return Response({'error': 'Unauthorized access to content factory.'}, status=403)
        file = request.FILES.get('file')
        competency_area_id = request.data.get('competency_area_id')
        if not file or not competency_area_id:
            return Response({'error': 'CSV file and Target Area are required.'}, status=400)
        competency = get_object_or_404(CompetencyArea, id=competency_area_id)
        is_owner = request.user.is_superuser
        target_university = None if is_owner else request.tenant
        is_global = is_owner
        content_type = 'MASTER (NATIONAL STANDARD)' if is_owner else 'INSTITUTIONAL (PRIVATE)'
        try:
            reader = csv.DictReader(io.StringIO(file.read().decode('utf-8-sig')))
            questions_created = 0
            with transaction.atomic():
                for row in reader:
                    question = Question.objects.create(university=target_university, competency_area=competency, text=row['text'], explanation=row.get('explanation', ''), is_global=is_global)
                    correct_letter = row['correct_option'].strip().upper()
                    for letter, text in [('A', row['option_a']), ('B', row['option_b']), ('C', row['option_c']), ('D', row['option_d'])]:
                        QuestionOption.objects.create(question=question, option_text=text, is_correct=(letter == correct_letter))
                    questions_created += 1
            return Response({'message': f'Successfully imported {questions_created} questions.', 'type': content_type, 'target_area': competency.name}, status=201)
        except Exception as exc:
            logger.exception('Question upload failed')
            return Response({'error': f'CSV structure error: {str(exc)}'}, status=400)


class GlobalBookViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminUser]
    serializer_class = ExamBookSerializer
    queryset = ExamBook.objects.all().order_by('-created_at')


class GlobalCompetencyViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminUser]
    queryset = CompetencyArea.objects.all().select_related('book')
    serializer_class = CompetencyAreaSerializer


class StudentAnalyticsView(APIView):
    def get(self, request):
        from .student_insights import StudentAnalyticsView as NewStudentAnalyticsView
        return NewStudentAnalyticsView().get(request)
