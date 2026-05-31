from django.contrib import admin
from .models import CompetencyArea, Question, QuestionOption, ExamAttempt, ExamResponse

class QuestionOptionInline(admin.TabularInline):
    model = QuestionOption
    extra = 4  # This shows 4 empty slots for options by default

@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    inlines = [QuestionOptionInline]
    list_display = ['text', 'competency_area', 'difficulty']
    list_filter = ['competency_area', 'difficulty', 'updated_at']
    search_fields = ['text']

admin.site.register(CompetencyArea)
admin.site.register(ExamAttempt)
admin.site.register(ExamResponse)