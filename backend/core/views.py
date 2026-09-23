import string
from django.shortcuts import render
from rest_framework.views import APIView
from .models import (
    University, 
    Department, 
    VoucherCode,
    Transaction,
    ExamBook, 
    UniversityBookSubscription
)
from rest_framework.response import Response
from rest_framework import status

from .serializers import (
    UniversityRegistrationSerializer, 
    DepartmentSerializer, 
    VoucherCodeSerializer
)
from django.db import transaction
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
import random

from exams.serializers import (
    CompetencyAreaSerializer, 
    CompetencyAreaCreateSerializer 
)
from exams.models import CompetencyArea
from django.db import transaction

from .serializers import (
    TransactionSerializer, 
    ExamBookSerializer, 
    SaaSUniversitySerializer, 
    ClassroomSerializer
)
import uuid
import requests
from django.db.models import Count, Sum, Avg

from .models import (
    University, 
    Transaction, 
    ExamBook,
    UniversityBookSubscription, 
    Classroom
)
from users.models import User
from django.db import models
from rest_framework.decorators import action
from .services import initialize_chapa_payment
from django.conf import settings
import traceback  
 


CHAPA_SECRET_KEY = settings.CHAPA_SECRET_KEY
CHAPA_URL = 'https://api.chapa.co/v1/transaction/initialize'

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
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UniversityRegistrationSerializer(data=request.data)
         
        if serializer.is_valid():
            try:
                with transaction.atomic():
                    # 1. Capture the chosen package from request
                    package_type = request.data.get('package')
                    admin_email = request.data.get('admin_email') # Needed for Chapa
                    
                    # 2. Save University and User
                    uni = serializer.save()

                    checkout_url = None
                    
                    # 3. Handle Payment if package selected
                    if package_type:
                        pricing = {
                            'starter': {'amt': 1000, 'creds': 50},
                            'standard': {'amt': 4500, 'creds': 250},
                            'university': {'amt': 15000, 'creds': 1000},
                        }
                        pkg = pricing.get(package_type)
                        
                        if pkg:
                            # IMPORTANT: res_data and tx_ref must be unpacked correctly
                            res_data, tx_ref = initialize_chapa_payment(
                                uni, 
                                pkg['amt'], 
                                pkg['creds'], 
                                admin_email # Ensure this variable exists!
                            )
                            
                            if res_data and res_data.get('status') == 'success':
                                Transaction.objects.create(
                                    university=uni,
                                    tx_ref=tx_ref,
                                    amount=pkg['amt'],
                                    credits_purchased=pkg['creds'],
                                    status='PENDING'
                                )
                                checkout_url = res_data['data']['checkout_url']
                            else:
                                # Log Chapa rejection but don't crash the whole signup
                                print(f"⚠️ Chapa Rejection: {res_data}")
                    
                    protocol = 'https' if request.is_secure() else 'http'
                    base_domain = getattr(settings, 'FRONTEND_BASE_DOMAIN', None)
                    if not base_domain:
                        # Fallback using host header if setting is missing
                        host_parts = request.get_host().split(':')
                        domain_name = host_parts[0]
                        
                        # If running on local dev server host
                        if 'localhost' in domain_name or '127.0.0.1' in domain_name:
                            base_domain = 'localhost:5173'
                        else:
                            base_domain = domain_name
                    portal_url = f"{protocol}://{uni.slug}.{base_domain}/login"



                    return Response({
                        "message": "University created successfully",
                        "portal_url": portal_url,
                        "checkout_url": checkout_url
                    }, status=201)

            except Exception as e:
                # THIS IS THE CRITICAL PART: Print the real error to your terminal
                print("🔥 REGISTRATION CRASHED!")
                print(traceback.format_exc()) 
                return Response({"error": f"Internal Server Error: {str(e)}"}, status=500)
        
        return Response(serializer.errors, status=400)
        
class DepartmentViewSet(viewsets.ModelViewSet):
    serializer_class = DepartmentSerializer

    def get_queryset(self):
        # Only show departments for the current detected university
        return Department.objects.filter(university=self.request.tenant)

    def perform_create(self, serializer):
        # Automatically associate the new department with the current university
        serializer.save(university=self.request.tenant)

class VoucherViewSet(viewsets.ModelViewSet):
    serializer_class = VoucherCodeSerializer

    def get_queryset(self):
        # Only show vouchers for the current detected university
        return VoucherCode.objects.filter(university=self.request.tenant).order_by('-created_at')

    @action(detail=False, methods=['post'], url_path='generate')
    @transaction.atomic
    def generate(self, request):
        # 1. AUTHENTICATION CHECK
        if request.user.role != 'ADMIN':
            return Response({"error": "Only university administrators can generate vouchers."}, status=403)

        # 2. DATA EXTRACTION
        try:
            count = int(request.data.get('count', 0))
            dept_id = request.data.get('department_id')
            dept = get_object_or_404(Department, id=dept_id, university=request.tenant)
            matching_book = ExamBook.objects.filter(category=dept.category).first()
        
            if matching_book:
                # Grant the university access to this book if they don't have it
                UniversityBookSubscription.objects.get_or_create(
                    university=request.tenant,
                    book=matching_book
                )

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
        # 1. SECURITY: Find the department belonging to the CURRENT tenant (University)
        # This prevents someone from AAU from viewing Damat's departments
        department = get_object_or_404(
            Department, 
            id=dept_id, 
            university=request.tenant
        )

        # 2. THE BRIDGE LOGIC: 
        # Find all CompetencyAreas that belong to Books matching this department's category
        competency_areas = CompetencyArea.objects.filter(
            book__category=department.category
        ).annotate(
            # Re-including the question count for the React cards
            annotated_question_count=Count('questions')
        )

        # 3. Serialize and Return
        serializer = CompetencyAreaSerializer(competency_areas, many=True)
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
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            credits = int(request.data.get('credits', 0))
            amount = credits * 20 # 20 ETB per seat
            
            # --- THE CRITICAL UNPACKING FIX ---
            # We must use two variables here to unpack the tuple
            res_data, tx_ref = initialize_chapa_payment(
                request.tenant,
                amount,
                credits,
                request.user.email
            )

            # Now res_data is the DICTIONARY, so .get() will work!
            if res_data.get('status') == 'success':
                Transaction.objects.create(
                    university=request.tenant,
                    tx_ref=tx_ref,
                    amount=amount,
                    credits_purchased=credits,
                    status='PENDING'
                )
                return Response({"checkout_url": res_data['data']['checkout_url']})

            # If Chapa says no
            print(f"❌ CHAPA REJECTED: {res_data}")
            return Response({"error": res_data.get('message', 'Initialization failed')}, status=400)

        except Exception as e:
            print(f"🔥 SYSTEM ERROR: {str(e)}")
            return Response({"error": "Internal server error during payment init."}, status=500)

class TransactionHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # 1. Role Check
        if request.user.role != 'ADMIN':
            return Response({"error": "Access denied. Admins only."}, status=403)

        # 2. Filter by current University (Tenant)
        transactions = Transaction.objects.filter(
            university=request.tenant
        ).order_by('-created_at')

        # 3. Serialize and Return
        serializer = TransactionSerializer(transactions, many=True)
        return Response(serializer.data)

class SaaSGlobalStatsView(APIView):
    # Only you (The SaaS Owner) can see this
    permission_classes = [IsAuthenticated] # We will add a SuperUser check next

    def get(self, request):
        if not request.user.is_superuser:
            return Response({"error": "SaaS Owner access required."}, status=403)

        # 1. Financial Stats
        total_revenue = Transaction.objects.filter(status='SUCCESS').aggregate(Sum('amount'))['amount__sum'] or 0
        
        # 2. Institutional Stats
        total_unis = University.objects.count()
        active_unis = University.objects.filter(is_active=True).count()

        # 3. User Stats
        total_students = User.objects.filter(role='STUDENT').count()

        return Response({
            "revenue": float(total_revenue),
            "institutions": {
                "total": total_unis,
                "active": active_unis
            },
            "users": {
                "total_students": total_students
            }
        })

class SaaSUniversityListView(APIView):
    def get(self, request):
        if not request.user.is_superuser:
            return Response(status=403)

        # We want to see: Name, Slug, Student Count, Total Revenue per Uni
        unis = University.objects.annotate(
            student_count=Count('user', filter=models.Q(user__role='STUDENT')),
            total_revenue=Sum('transaction__amount', filter=models.Q(transaction__status='SUCCESS'))
        ).order_by('-created_at')

        data = [{
            "id": u.id,
            "name": u.name,
            "slug": u.slug,
            "is_active": u.is_active,
            "balance": u.voucher_balance,
            "students": u.student_count,
            "revenue": float(u.total_revenue or 0)
        } for u in unis]

        return Response(data)

class MasterExamBookViewSet(viewsets.ModelViewSet):
    # Only you can touch this
    queryset = ExamBook.objects.all().order_by('-created_at')
    serializer_class = ExamBookSerializer

class SaasOwnerDashboardView(APIView):
    # Only you (the Superuser) can access this
    def get(self, request):
        if not request.user.is_superuser:
            return Response({"error": "SaaS Owner access restricted."}, status=403)

        # 1. Total platform revenue
        total_revenue = Transaction.objects.filter(status='SUCCESS').aggregate(Sum('amount'))['amount__sum'] or 0

        # 2. Institutional Health
        universities = University.objects.annotate(
            student_count=Count('user', filter=models.Q(user__role='STUDENT'))
        ).order_by('-created_at')
        
        uni_data = SaaSUniversitySerializer(universities, many=True).data

        return Response({
            "platform_stats": {
                "total_revenue": float(total_revenue),
                "total_institutions": universities.count(),
                "total_students": User.objects.filter(role='STUDENT').count(),
                "active_vouchers": VoucherCode.objects.filter(is_redeemed=False).count()
            },
            "institutions": uni_data
        })

class SaaSUniversityManagerViewSet(viewsets.ModelViewSet):
    # Only the Superuser can access this!
    queryset = University.objects.annotate(
        student_count=Count('user', filter=models.Q(user__role='STUDENT'))
    ).order_by('-created_at')
    serializer_class = SaaSUniversitySerializer

    @action(detail=True, methods=['post'])
    def toggle_status(self, request, pk=None):
        uni = self.get_object()
        uni.is_active = not uni.is_active
        uni.save()
        return Response({"status": "active" if uni.is_active else "suspended"})

    @action(detail=True, methods=['post'])
    def add_credits(self, request, pk=None):
        uni = self.get_object()
        amount = int(request.data.get('amount', 0))
        uni.voucher_balance += amount
        uni.save()
        return Response({"new_balance": uni.voucher_balance})

    @action(detail=True, methods=['post'], url_path='toggle-status')
    def toggle_status(self, request, pk=None):
        uni = self.get_object()
        uni.is_active = not uni.is_active # Flip the switch
        uni.save()
        return Response({
            "status": "active" if uni.is_active else "suspended",
            "is_active": uni.is_active
        })

class ClassroomViewSet(viewsets.ModelViewSet):
    serializer_class = ClassroomSerializer  

    def get_queryset(self):
        # A teacher only sees classrooms THEY created
        return Classroom.objects.filter(
            university=self.request.tenant, 
            teacher=self.request.user
        )

    def perform_create(self, serializer):
        # Auto-link the teacher and university on creation
        serializer.save(
            teacher=self.request.user, 
            university=self.request.tenant
        )

class TeacherClassroomViewSet(viewsets.ModelViewSet):
    serializer_class = ClassroomSerializer

    def get_queryset(self):
        return Classroom.objects.filter(
            university=self.request.tenant,
            teacher=self.request.user
        )

    # SENIOR FIX: Add explicit url_path and ensure the method is correct
    @action(detail=True, methods=['get'], url_path='student_performance')
    def student_performance(self, request, pk=None):
        classroom = self.get_object()
        students = classroom.students.all()

        exists_in_db = Classroom.objects.filter(pk=pk).exists()
        print(f"DEBUG: Does Classroom {pk} exist at all? {exists_in_db}")
        
        # DEBUG: See if the classroom belongs to the current user
        try:
            classroom = self.get_object()
        except Exception as e:
            print(f"DEBUG: Permission Denied. Classroom {pk} does not belong to {request.user.email}")
            return Response({"error": "Classroom not found or access denied"}, status=404)


        performance_data = []
        for student in students:
            # We look at completed attempts for THIS student
            from exams.models import ExamAttempt
            stats = ExamAttempt.objects.filter(user=student, status='COMPLETED').aggregate(
                avg_score=Avg('score'),
                total=Count('id')
            )
            performance_data.append({
                "student_name": student.first_name + " " + student.last_name,
                "email": student.email,
                "avg_score": round(stats['avg_score'] or 0, 1),
                "exams_completed": stats['total']
            })

        return Response(performance_data)

    @action(detail=True, methods=['get'], url_path='curriculum_analysis')
    def curriculum_analysis(self, request, pk=None):
        classroom = self.get_object()
        
        # 1. Get the average score of the whole class per Competency Area
        from exams.models import ExamAttempt
        analysis = ExamAttempt.objects.filter(
            user__classroom=classroom,
            status='COMPLETED'
        ).values('competency_area__name').annotate(
            class_avg=Avg('score')
        ).order_by('class_avg') # Lowest score first

        return Response(analysis)

class TenantConfigView(APIView):
    permission_classes = [AllowAny] 

    def get(self, request):
        tenant = request.tenant
        
        if not tenant:
            return Response({"error": "No university workspace detected"}, status=404)
         
        logo_url = None
        if tenant.logo:
            try:
                # 1. Standard DRF way (includes domain + media prefix)
                logo_url = request.build_absolute_uri(tenant.logo.url)
                print(f"DEBUG: Logo URL via build_absolute_uri: {logo_url}")
            except Exception:
                # 2. Fallback: Manually construct the URL
                host = request.get_host() # e.g., dmt.localhost:8000
                protocol = 'https' if request.is_secure() else 'http'
                logo_url = f"{protocol}://{host}{tenant.logo.url}"
                print(f"DEBUG: Logo URL via manual construction: {logo_url}")

        return Response({
            "name": tenant.name,
            "slug": tenant.slug,
            "logo": logo_url,
            "primary_color": tenant.primary_color or "#4f46e5",
            "branding": {
                "primary": tenant.primary_color,
                "is_active": tenant.is_active
            }
        })


