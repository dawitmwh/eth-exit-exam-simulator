from django.shortcuts import render
from rest_framework.views import APIView
from .models import University, Department, VoucherCode
from rest_framework.response import Response
from rest_framework import status
from .serializers import UniversityRegistrationSerializer, DepartmentSerializer, VoucherCodeSerializer
from django.db import transaction
from rest_framework.permissions import AllowAny
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
import random
import string
from rest_framework.decorators import action


# Create your views here.

class CheckSlugView(APIView):
    permission_classes = [] 

    def get(self, request):
        slug = request.query_params.get('s', '').lower()
        if not slug:
            return Response({"error": "No slug provided"}, status=400)
            
        exists = University.objects.filter(slug=slug).exists()
        return Response({
            "available": not exists,
            "message": "Available" if not exists else "This subdomain is already taken."
        })


class RegisterUniversityView(APIView):
    # This must be public so new Deans can sign up
    permission_classes = [AllowAny] 

    def post(self, request):
        serializer = UniversityRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            try:
                with transaction.atomic():
                    uni = serializer.save()
                    return Response({
                        "message": "University and Admin account created!",
                        "slug": uni.slug,
                        "portal_url": f"http://{uni.slug}.localhost:5173/login"
                    }, status=status.HTTP_201_CREATED)
            except Exception as e:
                return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
 

class DepartmentViewSet(viewsets.ModelViewSet):
    serializer_class = DepartmentSerializer

    def get_queryset(self):
        # SECURITY: A Dean only sees departments in their own University
        return Department.objects.filter(university=self.request.tenant)

    def perform_create(self, serializer):
        # AUTOMATION: When a Dean creates a department, 
        # automatically link it to their University
        serializer.save(university=self.request.tenant)


class VoucherViewSet(viewsets.ModelViewSet):
    serializer_class = VoucherCodeSerializer


    def get_queryset(self):
        # SECURITY: Only see vouchers for the current university detected by middleware
        return VoucherCode.objects.filter(university=self.request.tenant).order_by('-created_at')


    @action(detail=False, methods=['post'], url_path='generate')
    def generate(self, request):
        # 1. Validation
        if request.user.role != 'ADMIN':
            return Response({"error": "Unauthorized"}, status=403)

        count = int(request.data.get('count', 0))
        dept_id = request.data.get('department_id')

        if count <= 0 or count > 100: # Limit batch to 100 for safety
            return Response({"error": "Select a count between 1 and 100"}, status=400)

        # 2. Ensure department belongs to this university
        try:
            dept = Department.objects.get(id=dept_id, university=request.tenant)
        except Department.DoesNotExist:
            return Response({"error": "Invalid department"}, status=400)

        # 3. Batch Generation
        new_vouchers = []
        for _ in range(count):
            # Format: UNISLUG-RANDOM
            random_suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
            code = f"{request.tenant.slug.upper()}-{random_suffix}"
            
            voucher = VoucherCode.objects.create(
                university=request.tenant,
                department=dept,
                code=code
            )
            new_vouchers.append(VoucherCodeSerializer(voucher).data)

        return Response(new_vouchers, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['get'], url_path='analytics')
    def analytics(self, request):
        # 1. Calculate the numbers
        total = VoucherCode.objects.filter(university=request.tenant).count()
        redeemed = VoucherCode.objects.filter(university=request.tenant, is_redeemed=True).count()
        
        # 2. Use the Serializer we discussed
        data = {
            "total": total,
            "redeemed": redeemed,
            "available": total - redeemed,
            "usage_rate": (redeemed / total * 100) if total > 0 else 0,
            "departments": [] # You can add dept breakdown here later
        }
        
        # You can use the serializer here or return raw data for a quick test
        return Response(data)

 