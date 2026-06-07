from rest_framework import serializers
from .models import (
    CompetencyArea, Question, 
    QuestionOption, ExamAttempt, 
    ExamResponse
)
from django.db import transaction


# We have two serializers for questions: One for teachers/admins with all details, and one for students that hides the correct answer and explanation.
class StudentQuestionOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuestionOption
        fields = ['id', 'option_text']  


# Serializer for students: Hides the "explanation" and "is_correct" fields, and only shows option text.
class StudentQuestionSerializer(serializers.ModelSerializer):
    options = StudentQuestionOptionSerializer(many=True, read_only=True)

    class Meta:
        model = Question
        fields = ['id', 'competency_area', 'text', 'options'] 


# Serializer for teachers/admins: Shows all fields including the correct answer and explanation.
class CompetencyAreaSerializer(serializers.ModelSerializer):
    question_count = serializers.IntegerField(source='annotated_question_count', read_only=True)    
    department_name = serializers.CharField(source='department.name', read_only=True)

    class Meta:
        model = CompetencyArea
        fields = ['id', 'name', 'department', 'duration_minutes', 'question_count', 'department_name']

    def get_question_count(self, obj):
        return obj.questions.count()


# Serializer for teachers/admins: Shows all fields including the correct answer and explanation.
class QuestionOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuestionOption
        fields = ['id', 'option_text', 'is_correct']


# Serializer for teachers/admins: Shows all fields including the correct answer and explanation.
class QuestionSerializer(serializers.ModelSerializer):
    options = QuestionOptionSerializer(many=True, read_only=True)
    competency_area_name = serializers.ReadOnlyField(source='competency_area.name')

    class Meta:
        model = Question
        fields = [
            'id', 'competency_area', 'competency_area_name', 
            'text', 'explanation', 'difficulty', 'options'
        ]


# Serializer for students: Hides the "explanation" and "is_correct" fields, and only shows option text.
class ExamResponseSerializer(serializers.ModelSerializer):
    question_text = serializers.ReadOnlyField(source='question.text')
    selected_option_text = serializers.ReadOnlyField(source='selected_option.option_text')
    correct_option_text = serializers.SerializerMethodField()

    class Meta:
        model = ExamResponse
        fields = [
            'id', 'question', 'question_text', 
            'selected_option', 'selected_option_text', 
            'correct_option_text', 'is_correct', 'time_spent_seconds'
        ]

    def get_correct_option_text(self, obj):
        # This finds the correct option for the question to show the student during review
        correct_option = obj.question.options.filter(is_correct=True).first()
        return correct_option.option_text if correct_option else None


class ExamAttemptSerializer(serializers.ModelSerializer):
    # Nested responses: When we GET an attempt, we see all the answers inside it
    responses = ExamResponseSerializer(many=True, read_only=True)
    user_email = serializers.ReadOnlyField(source='user.email')
    competency_area_name = serializers.ReadOnlyField(source='competency_area.name')

    class Meta:
        model = ExamAttempt
        fields = [
            'id', 'user', 'user_email', 'competency_area', 
            'competency_area_name', 'score', 'status', 
            'start_time', 'end_time', 'responses'
        ]
        # These fields should NEVER be editable by the frontend
        read_only_fields = ['user', 'score', 'status', 'start_time', 'end_time']

    def create(self, validated_data):
        # Automatically set the user to the currently authenticated user when creating an attempt
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class AnswerSubmissionSerializer(serializers.Serializer):
    question_id = serializers.IntegerField()
    selected_option_id = serializers.IntegerField()
    time_spent = serializers.IntegerField()


class SyncOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuestionOption
        fields = ['id', 'option_text', 'is_correct']
        

class QuestionSyncSerializer(serializers.ModelSerializer):
    options = SyncOptionSerializer(many=True, read_only=True)
    subject_name = serializers.CharField(source='competency_area.name', read_only=True)

    class Meta:
        model = Question
        fields = ['id', 'subject_name', 'text', 'explanation', 'difficulty', 'options', 'updated_at']


class CompetencyAreaCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating a CompetencyArea when department is provided via context.
    - Accepts: { name, duration_minutes }
    - Department must be passed in serializer context: {'department': <Department instance>}
    """
    class Meta:
        model = CompetencyArea
        fields = ['id', 'name', 'duration_minutes']

    def validate_name(self, value):
        name = (value or "").strip()
        dept = self.context.get('department')
        if dept and CompetencyArea.objects.filter(department=dept, name__iexact=name).exists():
            raise serializers.ValidationError("A competency area with this name already exists in this department.")
        return name

    def create(self, validated_data):
        dept = self.context.get('department')
        if dept is None:
            raise serializers.ValidationError({'department': 'Department context is required for creation.'})
        return CompetencyArea.objects.create(department=dept, **validated_data)


class QuestionOptionWriteSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False)  # optional for updates
    class Meta:
        model = QuestionOption
        fields = ['id', 'option_text', 'is_correct']


class QuestionCreateSerializer(serializers.ModelSerializer):
    # Accept nested options when creating/updating
    options = QuestionOptionWriteSerializer(many=True, required=False)

    class Meta:
        model = Question
        fields = [
            'id', 'competency_area', 'text', 'explanation', 'difficulty', 'options'
        ]

    def validate(self, attrs):
        options = attrs.get('options', [])
        # ensure at least one correct option when options provided
        if options:
            if not any(o.get('is_correct') for o in options):
                raise serializers.ValidationError("At least one option must be marked as correct.")
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        options_data = validated_data.pop('options', [])
        question = super().create(validated_data)
        # create options
        opts = []
        for o in options_data:
            opts.append(QuestionOption(question=question, option_text=o.get('option_text',''), is_correct=bool(o.get('is_correct'))))
        if opts:
            QuestionOption.objects.bulk_create(opts)
        return question

    @transaction.atomic
    def update(self, instance, validated_data):
        options_data = validated_data.pop('options', None)
        # update question fields
        question = super().update(instance, validated_data)
        if options_data is not None:
            # simple strategy: remove existing options and recreate
            # (alternatively could diff by id to update/insert/delete)
            instance.options.all().delete()
            opts = []
            for o in options_data:
                opts.append(QuestionOption(question=question, option_text=o.get('option_text',''), is_correct=bool(o.get('is_correct'))))
            if opts:
                QuestionOption.objects.bulk_create(opts)
        return question