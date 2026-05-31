from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import MyTokenObtainPairSerializer
from rest_framework import status, views
from rest_framework.response import Response
from core.models import VoucherCode
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