from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework.exceptions import AuthenticationFailed
from core.thread_local import get_current_university
from .models import User
 
class UserSerializer(serializers.ModelSerializer):
    university_name = serializers.CharField(source='university.name', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'full_name', 'first_name', 'last_name',
            'role', 'university', 'university_name', 'department', 
            'department_name', 'is_staff'
        ]

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() or obj.username


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
        data['user'] = UserSerializer(self.user).data
        return data