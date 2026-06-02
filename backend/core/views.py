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

