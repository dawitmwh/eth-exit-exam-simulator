from django.db import models
from core.models import Department
from django.conf import settings # Use the Custom User Model

# CompetencyArea is like a "subject" or "topic" that questions belong to, e.g., "Pharmacology" or "Structural Engineering"
class CompetencyArea(models.Model):
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='competencies')
    name = models.CharField(max_length=255) # e.g., "Pharmacology" or "Structural Engineering"
    duration_minutes = models.IntegerField(default=60)

    def __str__(self):
        return f"{self.name} ({self.department.name})"

# Question is the core model representing each exam question. It links to a CompetencyArea and has multiple options.    
class Question(models.Model):
    class Difficulty(models.TextChoices):
        EASY = 'EASY', 'Easy'
        MEDIUM = 'MEDIUM', 'Medium'
        HARD = 'HARD', 'Hard'

    competency_area = models.ForeignKey(CompetencyArea, on_delete=models.CASCADE, related_name='questions')
    text = models.TextField()
    explanation = models.TextField(help_text="Shown after the exam for learning")
    difficulty = models.CharField(max_length=10, choices=Difficulty.choices, default=Difficulty.MEDIUM)
    updated_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.text[:50]

# Each Question can have multiple options, but only one is correct. This model represents those options.
class QuestionOption(models.Model):
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='options')
    option_text = models.CharField(max_length=255)
    is_correct = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.question.text[:20]} - {self.option_text}"

# ExamAttempt represents a user's attempt at taking an exam for a specific competency area. It tracks the start/end time, score, and status.
class ExamAttempt(models.Model):
    class Status(models.TextChoices):
        STARTED = 'STARTED', 'Started'
        COMPLETED = 'COMPLETED', 'Completed'
        TIMED_OUT = 'TIMED_OUT', 'Timed Out'

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    competency_area = models.ForeignKey(CompetencyArea, on_delete=models.CASCADE) # Or link to an "Exam" model if you have one
    start_time = models.DateTimeField(auto_now_add=True)
    end_time = models.DateTimeField(null=True, blank=True)
    score = models.FloatField(default=0.0)
    status = models.CharField(max_length=15, choices=Status.choices, default=Status.STARTED)

    def __str__(self):
        return f"{self.user.email} - {self.competency_area.name} ({self.status})"

# ExamResponse represents the user's answer to each question in an attempt. It links to the selected option and whether it was correct.
class ExamResponse(models.Model):
    attempt = models.ForeignKey(ExamAttempt, on_delete=models.CASCADE, related_name='responses')
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    selected_option = models.ForeignKey(QuestionOption, on_delete=models.CASCADE)
    is_correct = models.BooleanField() # We store this here to make analytics faster
    time_spent_seconds = models.IntegerField(default=0)

    def __str__(self):
        return f"Response to {self.question.id} in Attempt {self.attempt.id}"