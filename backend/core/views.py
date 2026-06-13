import string
from django.shortcuts import render
from rest_framework.views import APIView
from .models import University, Department, VoucherCode
from rest_framework.response import Response
from rest_framework import status
from .serializers import UniversityRegistrationSerializer, DepartmentSerializer, VoucherCodeSerializer
from django.db import transaction
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
import random

from exams.serializers import CompetencyAreaSerializer, CompetencyAreaCreateSerializer
from exams.models import CompetencyArea
from .models import Department


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


import random
import string
from django.db import transaction
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import VoucherCode, Department
from .serializers import VoucherCodeSerializer

class VoucherViewSet(viewsets.ModelViewSet):
    serializer_class = VoucherCodeSerializer

    def get_queryset(self):
        # Only show vouchers for the current detected university
        return VoucherCode.objects.filter(university=self.request.tenant).order_by('-created_at')

    @action(detail=False, methods=['post'], url_path='generate')
    def generate(self, request):
        # 1. AUTHENTICATION CHECK
        if request.user.role != 'ADMIN':
            return Response({"error": "Only university administrators can generate vouchers."}, status=403)

        # 2. DATA EXTRACTION
        try:
            count = int(request.data.get('count', 0))
            dept_id = request.data.get('department_id')
        except (ValueError, TypeError):
            return Response({"error": "Invalid count or department ID format."}, status=400)

        university = request.tenant

        # 3. VALIDATION: Check Batch Size
        if count <= 0 or count > 100:
            return Response({"error": "You can generate between 1 and 100 vouchers per batch."}, status=400)

        # 4. VALIDATION: Check Available Credits (The Paid Model)
        if count > university.voucher_balance:
            return Response({
                "error": "Insufficient credits.",
                "voucher_balance": university.voucher_balance,
                "requested": count,
                "message": "Please contact system administration to purchase more student seats."
            }, status=status.HTTP_402_PAYMENT_REQUIRED)

        # 5. VALIDATION: Check Department Ownership
        try:
            dept = Department.objects.get(id=dept_id, university=university)
        except Department.DoesNotExist:
            return Response({"error": "Selected department not found in your university portal."}, status=400)

        # 6. ATOMIC EXECUTION: Balance deduction + Voucher creation
        try:
            with transaction.atomic():
                # A. Deduct the credits first
                university.voucher_balance -= count
                university.save()

                # B. Generate the random codes
                new_vouchers = []
                for _ in range(count):
                    # Generate a clean code: SLUG-RANDOM (e.g., ARSI-XJ92L1)
                    random_suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
                    code_str = f"{university.slug.upper()}-{random_suffix}"
                    
                    voucher = VoucherCode.objects.create(
                        university=university,
                        department=dept,
                        code=code_str
                    )
                    new_vouchers.append(voucher)

                # C. Serialize the newly created vouchers to return to React
                serialized_data = VoucherCodeSerializer(new_vouchers, many=True).data

                return Response({
                    "message": f"Successfully generated {count} vouchers for {dept.name}.",
                    "new_balance": university.voucher_balance,
                    "vouchers": serialized_data
                }, status=status.HTTP_201_CREATED)

        except Exception as e:
            # If anything goes wrong inside the 'with' block, the balance deduction is cancelled
            print(f"DATABASE ERROR: {str(e)}")
            return Response({"error": "A system error occurred. Credits were not deducted."}, status=500)
   
    @action(detail=False, methods=['get'], url_path='analytics')
    def analytics(self, request):
        # 1. Calculate the numbers
        vouchers_queryset = VoucherCode.objects.filter(university=request.tenant)
        total = vouchers_queryset.count()
        redeemed = vouchers_queryset.filter(is_redeemed=True).count()

        # 2. Get the university's remaining "Bank Balance"
        # This is what the Dean has paid for but NOT yet generated
        remaining_credits = request.tenant.voucher_balance 
        
        
        data = {
            "total_generated": total,
            "redeemed": redeemed,
            "available_to_redeem": total - redeemed,
            "usage_rate": (redeemed / total * 100) if total > 0 else 0,
            "voucher_balance": remaining_credits,  
            "departments": [] 
        }
        
       
        return Response(data)

class DepartmentCompetencyAreasView(APIView):
    """
    Single endpoint for competency areas scoped to a department:
    - GET    /api/departments/<dept_id>/competency-areas/        -> list
    - POST   /api/departments/<dept_id>/competency-areas/        -> create (body: { name, duration_minutes? })
    - PUT    /api/departments/<dept_id>/competency-areas/        -> update full (body must include id)
    - PATCH  /api/departments/<dept_id>/competency-areas/        -> partial update (body must include id)
    - DELETE /api/departments/<dept_id>/competency-areas/        -> delete (body or ?id= must include id)
    """
    permission_classes = [IsAuthenticated]

    def _get_department(self, request, dept_id):
        return get_object_or_404(Department, pk=dept_id, university=getattr(request, 'tenant', None))

    def _get_competency(self, dept, comp_id):
        return get_object_or_404(CompetencyArea, pk=comp_id, department=dept)

    def _mutable_payload(self, request):
        # Ensure we have a mutable dict regardless of request.data type
        try:
            return request.data.copy() if hasattr(request.data, "copy") else dict(request.data or {})
        except Exception:
            return dict(request.data or {})

    def get(self, request, dept_id):
        dept = self._get_department(request, dept_id)
        qs = CompetencyArea.objects.filter(department=dept).order_by('name')
        serializer = CompetencyAreaSerializer(qs, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request, dept_id):
        dept = self._get_department(request, dept_id)
        payload = self._mutable_payload(request)
        # Use create serializer which expects department via context
        serializer = CompetencyAreaCreateSerializer(data=payload, context={'request': request, 'department': dept})
        if serializer.is_valid():
            obj = serializer.save()
            out = CompetencyAreaSerializer(obj, context={'request': request})
            return Response(out.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, dept_id):
        dept = self._get_department(request, dept_id)
        payload = self._mutable_payload(request)
        comp_id = payload.get('id') or request.query_params.get('id')
        if not comp_id:
            return Response({'detail': 'Competency id required for update.'}, status=status.HTTP_400_BAD_REQUEST)
        competency = self._get_competency(dept, comp_id)

        # Prevent changing department via payload
        payload.pop('department', None)

        serializer = CompetencyAreaSerializer(competency, data=payload, partial=False, context={'request': request})
        if serializer.is_valid():
            obj = serializer.save()
            out = CompetencyAreaSerializer(obj, context={'request': request})
            return Response(out.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, dept_id):
        dept = self._get_department(request, dept_id)
        payload = self._mutable_payload(request)
        comp_id = payload.get('id') or request.query_params.get('id')
        if not comp_id:
            return Response({'detail': 'Competency id required for update.'}, status=status.HTTP_400_BAD_REQUEST)
        competency = self._get_competency(dept, comp_id)

        # Prevent changing department via payload
        payload.pop('department', None)

        serializer = CompetencyAreaSerializer(competency, data=payload, partial=True, context={'request': request})
        if serializer.is_valid():
            obj = serializer.save()
            out = CompetencyAreaSerializer(obj, context={'request': request})
            return Response(out.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, dept_id):
        dept = self._get_department(request, dept_id)
        # id can be sent in body (JSON) or as query param
        comp_id = None
        try:
            payload = self._mutable_payload(request)
            comp_id = payload.get('id')
        except Exception:
            comp_id = None
        comp_id = comp_id or request.query_params.get('id')
        if not comp_id:
            return Response({'detail': 'Competency id required for delete.'}, status=status.HTTP_400_BAD_REQUEST)
        competency = self._get_competency(dept, comp_id)
        competency.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class InitializePaymentView(APIView):
    def post(self, request):
        credits = int(request.data.get('credits', 0))
        # Example pricing: 10 ETB per student seat
        price_per_credit = 10 
        amount = credits * price_per_credit

        # 1. Initialize with Chapa
        res_data, tx_ref = initialize_chapa_payment(request.tenant, amount, credits)

        if res_data.get('status') == 'success':
            # 2. Record the pending transaction
            Transaction.objects.create(
                university=request.tenant,
                tx_ref=tx_ref,
                amount=amount,
                credits_purchased=credits
            )
            return Response({"checkout_url": res_data['data']['checkout_url']})
        
        return Response({"error": "Payment initialization failed"}, status=400)