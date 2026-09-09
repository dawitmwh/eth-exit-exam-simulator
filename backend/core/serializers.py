from rest_framework import serializers
from .models import University, Transaction, Classroom
from users.models import User, Department
from .models import VoucherCode, ExamBook
import re

class UniversityRegistrationSerializer(serializers.ModelSerializer):
    # These fields are for the Admin User, not the University model
    admin_email = serializers.EmailField(write_only=True)
    admin_password = serializers.CharField(write_only=True, style={'input_type': 'password'})
    admin_password_confirm = serializers.CharField(write_only=True, style={'input_type': 'password'})
    admin_name = serializers.CharField(write_only=True)
    package = serializers.CharField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = University
        fields = ['name', 'slug', 'admin_email', 'admin_password', 'admin_password_confirm', 'admin_name', 'package']

    def validate(self, data):
        if data['admin_password'] != data['admin_password_confirm']:
            raise serializers.ValidationError({
                "admin_password": "The two password fields didn't match."
            })
        return data

    def validate_slug(self, value):
        # 1. Standardize
        value = value.lower().strip().replace('_', '-').replace(' ', '-')
        
        # 2. Check for Reserved Keywords  
        reserved_names = ['www', 'admin', 'api', 'owner', 'portal', 'static', 'media']
        if value in reserved_names:
            raise serializers.ValidationError(f"The name '{value}' is reserved and cannot be used.")

        # 3. Regex Validation
        if not re.match(r'^[a-z0-9-]+$', value):
            raise serializers.ValidationError("Subdomain can only contain letters, numbers, and hyphens.")

        # 4. Manual Uniqueness Check (to provide a custom message)
        # We use .exists() because it's the fastest way to check the DB
        if University.objects.filter(slug=value).exists():
            raise serializers.ValidationError("This subdomain is already taken. Please choose another.")

        return value

    def validate_admin_email(self, value):
        from users.models import User
        if User.objects.filter(email=value.lower()).exists():
            raise serializers.ValidationError("An administrator with this email is already registered.")
        return value.lower()


    def create(self, validated_data):
        validated_data.pop('package', None) 
        validated_data.pop('admin_password_confirm')
        # 1. Peel off the Admin User data
        admin_email = validated_data.pop('admin_email')
        admin_password = validated_data.pop('admin_password')
        admin_name = validated_data.pop('admin_name')

        # 2. Create the University
        university = University.objects.create(**validated_data)

        
        
        # 3. Create the Admin User (The Dean) linked to this University
        User.objects.create_user(
            first_name=admin_name,
            email=admin_email,
            username=admin_email,
            password=admin_password,
            university=university,  
            role='ADMIN',  
            is_staff=True
        )

        return university


class DepartmentSerializer(serializers.ModelSerializer):
        competencies_count = serializers.IntegerField(source='competencies.count', read_only=True)
        class Meta:
            model = Department
            fields = ['id', 'name', 'category', 'competencies_count']
            extra_kwargs = {
                    'university': {'read_only': True}
           }
          

class VoucherCodeSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)
    redeemed_by_email = serializers.CharField(source='redeemed_by.email', read_only=True)

    class Meta:
        model = VoucherCode
        fields = ['id', 'code', 'department', 'department_name', 'is_redeemed', 'redeemed_by_email', 'redeemed_at', 'created_at']


class TransactionSerializer(serializers.ModelSerializer):
    # Format ETB with 2 decimal places
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    # Format date for humans: "22 May 2026, 02:30 PM"
    date = serializers.DateTimeField(source='created_at', format="%d %b %Y, %I:%M %p", read_only=True)

    class Meta:
        model = Transaction
        fields = ['tx_ref', 'amount', 'credits_purchased', 'status', 'date']    


class ExamBookSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExamBook
        fields = ['id', 'title', 'description', 'created_at', 'updated_at']


class SaaSUniversitySerializer(serializers.ModelSerializer):
    # Calculate stats on the fly
    student_count = serializers.IntegerField(source='user_set.count', read_only=True)
    
    class Meta:
        model = University
        fields = ['id', 'name', 'slug', 'is_active', 'voucher_balance', 'student_count', 'created_at']


class ClassroomSerializer(serializers.ModelSerializer):
    student_count = serializers.IntegerField(source='students.count', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)

    class Meta:
        model = Classroom
        fields = ['id', 'name', 'code', 'department', 'department_name', 'student_count', 'created_at']
        read_only_fields = ['code'] 

