from django.db import transaction
from django.db.models import Avg, Count, Sum
from django.utils import timezone
from rest_framework import serializers, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import CompetencyArea, ExamAttempt, ExamResponse, Question, QuestionOption
from core.models import UniversityBookSubscription


class StartExamView(APIView):
    def post(self, request):
        mode = str(request.data.get('mode', 'SIMULATED')).upper()
        if mode not in (ExamAttempt.Mode.PRACTICE, ExamAttempt.Mode.SIMULATED):
            return Response({'error': 'Invalid exam mode.'}, status=status.HTTP_400_BAD_REQUEST)

        competency_id = request.data.get('competency_area')
        competency = None
        if competency_id:
            try:
                competency_id = int(competency_id)
            except (TypeError, ValueError):
                return Response({'error': 'Invalid competency area.'}, status=status.HTTP_400_BAD_REQUEST)
            competency = CompetencyArea.objects.filter(id=competency_id).first()
            if not competency:
                return Response({'error': 'Competency area not found.'}, status=status.HTTP_404_NOT_FOUND)

        attempt = ExamAttempt.objects.create(
            user=request.user,
            university=request.tenant,
            competency_area=competency,
            mode=mode,
            status=ExamAttempt.Status.STARTED,
        )
        return Response({'id': attempt.id, 'mode': attempt.mode, 'status': attempt.status}, status=status.HTTP_201_CREATED)


class SessionQuestionsView(APIView):
    def get(self, request):
        mode = str(request.query_params.get('mode', 'SIMULATED')).upper()
        if mode not in (ExamAttempt.Mode.PRACTICE, ExamAttempt.Mode.SIMULATED):
            return Response({'error': 'Invalid exam mode.'}, status=status.HTTP_400_BAD_REQUEST)
        if not request.user.department:
            return Response([], status=status.HTTP_200_OK)

        tenant = request.tenant
        unlocked_ids = UniversityBookSubscription.objects.filter(university=tenant).values_list('book_id', flat=True)
        queryset = Question.objects.filter(
            competency_area__book_id__in=unlocked_ids,
            competency_area__book__category__iexact=request.user.department.category,
        ).select_related('competency_area').prefetch_related('options')

        competency_id = request.query_params.get('competency_area')
        if competency_id and competency_id.isdigit():
            queryset = queryset.filter(competency_area_id=int(competency_id))

        if mode == ExamAttempt.Mode.SIMULATED:
            # The full 100-question mock is used only for true full-mock sessions.
            if request.query_params.get('full_mock') == 'true':
                queryset = queryset.order_by('?')[:100]
            # Subject exams return all configured questions.
        else:
            if request.query_params.get('full_mock') == 'true':
                queryset = queryset.order_by('?')[:100]

        data = []
        for question in queryset:
            options = [{'id': option.id, 'option_text': option.option_text} for option in question.options.all()]
            item = {
                'id': question.id,
                'competency_area': question.competency_area_id,
                'text': question.text,
                'duration_minutes': question.competency_area.duration_minutes,
                'options': options,
            }
            if mode == ExamAttempt.Mode.PRACTICE:
                item['explanation'] = question.explanation
                item['options'] = [
                    {
                        'id': option.id,
                        'option_text': option.option_text,
                        'is_correct': option.is_correct,
                    }
                    for option in question.options.all()
                ]
            data.append(item)
        return Response(data)


class SubmitExamView(APIView):
    @transaction.atomic
    def post(self, request, attempt_id):
        try:
            attempt = ExamAttempt.objects.select_for_update().get(
                id=attempt_id,
                user=request.user,
                university=request.tenant,
            )
        except ExamAttempt.DoesNotExist:
            return Response({'error': 'Exam attempt not found.'}, status=status.HTTP_404_NOT_FOUND)

        if attempt.status == ExamAttempt.Status.COMPLETED:
            return Response({'error': 'Exam already submitted.'}, status=status.HTTP_400_BAD_REQUEST)

        answers = request.data.get('answers', [])
        if not isinstance(answers, list):
            return Response({'error': 'Answers must be a list.'}, status=status.HTTP_400_BAD_REQUEST)

        seen_questions = set()
        correct_count = 0
        created_responses = []

        allowed_minutes = attempt.competency_area.duration_minutes if attempt.competency_area else 120
        if timezone.now() > attempt.start_time + timezone.timedelta(minutes=allowed_minutes):
            attempt.status = ExamAttempt.Status.TIMED_OUT

        for answer in answers:
            try:
                question_id = int(answer['question_id'])
                option_id = int(answer['selected_option_id'])
                time_spent = max(0, int(answer.get('time_spent', 0)))
            except (KeyError, TypeError, ValueError):
                return Response({'error': 'Invalid answer format.'}, status=status.HTTP_400_BAD_REQUEST)

            if question_id in seen_questions:
                return Response({'error': 'A question can only be answered once.'}, status=status.HTTP_400_BAD_REQUEST)
            seen_questions.add(question_id)

            question = Question.objects.filter(id=question_id).first()
            if not question:
                return Response({'error': f'Question {question_id} does not exist.'}, status=status.HTTP_400_BAD_REQUEST)

            if attempt.competency_area and question.competency_area_id != attempt.competency_area_id:
                return Response({'error': 'Question is outside this exam.'}, status=status.HTTP_400_BAD_REQUEST)

            option = QuestionOption.objects.filter(id=option_id, question_id=question_id).first()
            if not option:
                return Response({'error': 'Selected option is invalid for this question.'}, status=status.HTTP_400_BAD_REQUEST)

            is_correct = option.is_correct
            correct_count += 1 if is_correct else 0
            created_responses.append(ExamResponse(
                attempt=attempt,
                question=question,
                selected_option=option,
                is_correct=is_correct,
                time_spent_seconds=time_spent,
            ))

        ExamResponse.objects.bulk_create(created_responses)
        total_questions = len(created_responses)
        attempt.correct_answers = correct_count
        attempt.total_questions = total_questions
        attempt.score = (correct_count / total_questions * 100) if total_questions else 0
        if attempt.status != ExamAttempt.Status.TIMED_OUT:
            attempt.status = ExamAttempt.Status.COMPLETED
        attempt.end_time = timezone.now()
        attempt.save(update_fields=['correct_answers', 'total_questions', 'score', 'status', 'end_time'])

        return Response({
            'score': round(attempt.score, 1),
            'correct_answers': correct_count,
            'total_questions': total_questions,
            'status': attempt.status,
            'mode': attempt.mode,
        })


class ReviewExamView(APIView):
    def get(self, request, attempt_id):
        try:
            attempt = ExamAttempt.objects.select_related('competency_area').get(
                id=attempt_id,
                user=request.user,
                university=request.tenant,
            )
        except ExamAttempt.DoesNotExist:
            return Response({'error': 'Exam attempt not found.'}, status=status.HTTP_404_NOT_FOUND)

        if attempt.status == ExamAttempt.Status.STARTED:
            return Response({'error': 'This exam has not been submitted.'}, status=status.HTTP_400_BAD_REQUEST)

        responses = attempt.responses.select_related('question', 'selected_option').prefetch_related('question__options')
        review = []
        for response in responses:
            correct_option = response.question.options.filter(is_correct=True).first()
            review.append({
                'question_id': response.question_id,
                'question': response.question.text,
                'selected_option': response.selected_option.option_text,
                'correct_option': correct_option.option_text if correct_option else None,
                'explanation': response.question.explanation,
                'is_correct': response.is_correct,
            })
        return Response({'attempt_id': attempt.id, 'score': round(attempt.score, 1), 'review': review})


class StudentAnalyticsView(APIView):
    def get(self, request):
        completed_attempts = ExamAttempt.objects.filter(
            user=request.user,
            university=request.tenant,
            status__in=[ExamAttempt.Status.COMPLETED, ExamAttempt.Status.TIMED_OUT],
        ).select_related('competency_area')

        if not completed_attempts.exists():
            return Response({
                'summary': {
                    'average_score': 0,
                    'latest_score': None,
                    'attempt_count': 0,
                    'change_from_previous': None,
                    'mastered_topics': 0,
                },
                'progress': [],
                'topics': [],
                'practice_next': [],
            })

        latest_attempts = list(completed_attempts.order_by('-end_time')[:10])
        progress = [{
            'exam': f'T-{attempt.id}',
            'score': round(attempt.score, 1),
            'date': attempt.end_time.strftime('%d/%m') if attempt.end_time else '',
            'mode': attempt.mode,
        } for attempt in reversed(latest_attempts)]

        average_score = completed_attempts.aggregate(value=Avg('score'))['value'] or 0

        chronological = list(completed_attempts.filter(end_time__isnull=False).order_by('-end_time')[:2])
        change = None
        if len(chronological) == 2:
            change = round(chronological[0].score - chronological[1].score, 1)

        topic_stats = completed_attempts.filter(competency_area__isnull=False).values(
            'competency_area_id', 'competency_area__name'
        ).annotate(score=Avg('score'), attempts=Count('id')).order_by('score')

        topics = [{
            'id': item['competency_area_id'],
            'name': item['competency_area__name'],
            'score': round(item['score'] or 0, 1),
            'attempts': item['attempts'],
        } for item in topic_stats]

        practice_next = topics[:3]
        mastered_topics = sum(1 for topic in topics if topic['score'] >= 75 and topic['attempts'] >= 2)

        return Response({
            'summary': {
                'average_score': round(average_score, 1),
                'latest_score': round(latest_attempts[0].score, 1),
                'attempt_count': completed_attempts.count(),
                'change_from_previous': change,
                'mastered_topics': mastered_topics,
            },
            'progress': progress,
            'topics': topics,
            'practice_next': practice_next,
        })
