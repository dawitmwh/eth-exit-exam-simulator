from rest_framework import serializers
from .models import University
from users.models import User, Department
from .models import VoucherCode


class UniversityRegistrationSerializer(serializers.ModelSerializer):
    # These fields are for the Admin User, not the University model
    admin_email = serializers.EmailField(write_only=True)
    admin_password = serializers.CharField(write_only=True)
    admin_name = serializers.CharField(write_only=True)

    class Meta:
        model = University
        fields = ['name', 'slug', 'admin_email', 'admin_password', 'admin_name']

    def create(self, validated_data):
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
            university=university, # Link them!
            role='ADMIN', # Ensure your User model has this role
            is_staff=True
        )

        return university

class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = ['id', 'name']     



class VoucherCodeSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)
    redeemed_by_email = serializers.CharField(source='redeemed_by.email', read_only=True)

    class Meta:
        model = VoucherCode
        fields = ['id', 'code', 'department', 'department_name', 'is_redeemed', 'redeemed_by_email', 'redeemed_at', 'created_at']

        