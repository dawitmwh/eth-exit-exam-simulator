from django.db import models
from core.models import ExamBook, University, UniversityTenantModel
from django.conf import settings


class CompetencyArea(models.Model):
    book = models.ForeignKey(ExamBook, on_delete=models.CASCADE, related_name='competencies')
    name = models.CharField(max_length=255, default="Mock Exit Exam")
    duration_minutes = models.IntegerField(default=60)

    def __str__(self):
        return f"{self.name} ({self.book.title})"


class Question(models.Model):
    class Difficulty(models.TextChoices):
        EASY = 'EASY', 'Easy'
        MEDIUM = 'MEDIUM', 'Medium'
        HARD = 'HARD', 'Hard'

    competency_area = models.ForeignKey(CompetencyArea, on_delete=models.CASCADE, related_name='questions')
    text = models.TextField()
    explanation = models.TextField(help_text="Shown in practice mode and after simulated-exam review")
    difficulty = models.CharField(max_length=10, choices=Difficulty.choices, default=Difficulty.MEDIUM)
    university = models.ForeignKey(University, on_delete=models.SET_NULL, null=True, blank=True)
    is_global = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.text[:50]


class QuestionOption(models.Model):
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='options')
    option_text = models.CharField(max_length=255)
    is_correct = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.question.text[:20]} - {self.option_text}"


class ExamAttempt(UniversityTenantModel):
    class Status(models.TextChoices):
        STARTED = 'STARTED', 'Started'
        COMPLETED = 'COMPLETED', 'Completed'
        TIMED_OUT = 'TIMED_OUT', 'Timed Out'

    class Mode(models.TextChoices):
        PRACTICE = 'PRACTICE', 'Practice'
        SIMULATED = 'SIMULATED', 'Simulated'

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    competency_area = models.ForeignKey(CompetencyArea, on_delete=models.CASCADE, null=True, blank=True)
    mode = models.CharField(max_length=10, choices=Mode.choices, default=Mode.SIMULATED)
    start_time = models.DateTimeField(auto_now_add=True)
    end_time = models.DateTimeField(null=True, blank=True)
    correct_answers = models.PositiveIntegerField(default=0)
    total_questions = models.PositiveIntegerField(default=0)
    score = models.FloatField(default=0.0)
    status = models.CharField(max_length=15, choices=Status.choices, default=Status.STARTED)

    def __str__(self):
        return f"{self.user.email} - ({self.status})"


class ExamResponse(models.Model):
    attempt = models.ForeignKey(ExamAttempt, on_delete=models.CASCADE, related_name='responses')
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    selected_option = models.ForeignKey(QuestionOption, on_delete=models.CASCADE)
    is_correct = models.BooleanField()
    time_spent_seconds = models.IntegerField(default=0)

    def __str__(self):
        return f"Response to {self.question.id} in Attempt {self.attempt.id}"
