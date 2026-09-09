from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import MyTokenObtainPairSerializer
from rest_framework import status, views
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from core.models import VoucherCode, Classroom
from .models import User
from django.utils import timezone

 


class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer


class RegisterWithVoucher(views.APIView):
    permission_classes = [] 

    def post(self, request):
        email = request.data.get('email')
        full_name = request.data.get('full_name', '')
        password = request.data.get('password')
        voucher_str = request.data.get('voucher_code', '').strip()

        if not request.tenant:
            return Response({"error": "No valid university workspace detected from subdomain."}, status=400)

        try:
            # UniversityManager automatically scopes this query to the current request subdomain!

            voucher = VoucherCode.objects.get(
                code__iexact=voucher_str,
                is_redeemed=False
            )
        except VoucherCode.DoesNotExist:
            print(f"FAILED: No valid unredeemed voucher '{voucher_str}' for tenant '{request.tenant}'")
            return Response({"error": "Invalid voucher code for this institution."}, status=400)

        if User.objects.filter(email=email).exists():
            return Response({"error": "Email already registered."}, status=status.HTTP_400_BAD_REQUEST)

        # Create user linked directly to the validated voucher details
        user = User.objects.create_user(
            email=email,
            password=password, 
            username=email,
            first_name=full_name.split(' ')[0] if full_name else '',
            last_name=' '.join(full_name.split(' ')[1:]) if full_name else '',
            university=voucher.university,
            department=voucher.department,
            role=User.Role.STUDENT
        )

        # Mark voucher as redeemed securely
        voucher.is_redeemed = True
        voucher.redeemed_by = user
        voucher.redeemed_at = timezone.now()
        voucher.save()

        return Response({"message": "Registration successful. You can now log in."}, status=status.HTTP_201_CREATED)


class CreateTeacherView(APIView):
    def post(self, request):
        # 1. Security Check: Only the Dean can create teachers
        if request.user.role != 'ADMIN':
            return Response({"error": "Unauthorized. Only Deans can create faculty accounts."}, status=403)

        email = request.data.get('email')
        password = request.data.get('password')
        full_name = request.data.get('full_name')
        dept_id = request.data.get('department_id')

        # 2. Validation
        if User.objects.filter(email=email).exists():
            return Response({"error": "A user with this email already exists."}, status=400)

        # 3. Create the Teacher
        teacher = User.objects.create_user(
            email=email,
            username=email,
            password=password,
            first_name=full_name,
            role='TEACHER', # Set role to Teacher
            university=request.tenant, # Automatically link to the Dean's Uni
            department_id=dept_id # Link to their specific faculty
        )

        return Response({
            "message": f"Teacher account created for {full_name}.",
            "email": email
        }, status=status.HTTP_201_CREATED)


class JoinClassroomView(APIView):
    def post(self, request):
        # 1. Get the code from the JSON body
        code = request.data.get('code', '').strip().upper()
        

        try:
            # 3. Precise Lookup
            classroom = Classroom.objects.get(
                code__iexact=code, 
                university=request.tenant
            )
            
            user = request.user
            user.classroom = classroom
            user.save()
            
            return Response({
                "message": f"Successfully joined {classroom.name}",
                "teacher": classroom.teacher.first_name + " " + classroom.teacher.last_name,
            })
            
        except Classroom.DoesNotExist:
            # 4. Senior Debugging: Is the code in the DB at all?
            exists_anywhere = Classroom.objects.filter(code=code).exists()
            if exists_anywhere:
                error_msg = f"Code {code} exists, but belongs to a different university portal."
            else:
                error_msg = f"Classroom code {code} not found in our system."
            
            return Response({"error": error_msg}, status=400)