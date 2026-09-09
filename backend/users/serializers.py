from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework.exceptions import AuthenticationFailed
from core.thread_local import get_current_university
from .models import User
from django.conf import settings
 
class UserSerializer(serializers.ModelSerializer):
    university_name = serializers.CharField(source='university.name', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    full_name = serializers.SerializerMethodField()
    university_logo = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'full_name', 'first_name', 'last_name',
            'role', 'university', 'university_name','university_logo', 'department', 
            'department_name', 'is_staff', 'is_superuser'
        ]

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() or obj.username

    def get_university_logo(self, obj):
        if obj.university and obj.university.logo:
            # Get the path (e.g., /media/university_logos/logo.png)
            logo_url = obj.university.logo.url
            
            # If the URL already starts with http, it's already full (common in production)
            if logo_url.startswith('http'):
                return logo_url
            
            # For local development, manually attach the domain if request context is missing
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(logo_url)
            
            # Hardcoded fallback for localhost
            return f"http://127.0.0.1:8000{logo_url}"
            print(f"DEBUG: University logo URL for {obj.university.name} is {logo_url}")
        return None

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        current_uni = get_current_university()

        if current_uni:
            # Block authentication if the user is trying to log into a university they do not belong to
            if user.university != current_uni and not user.is_staff:
                raise AuthenticationFailed("Your account is not registered under this University.")
            
            # Inject security claims into JWT token payload
            token['university_id'] = current_uni.id
            token['role'] = user.role
            
        return token

    def validate(self, attrs):
        data = super().validate(attrs) 
        data['user'] = UserSerializer(self.user, context=self.context).data
        return data