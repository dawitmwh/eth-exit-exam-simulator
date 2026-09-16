"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.utils import timezone
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from requests import Response
from rest_framework.routers import DefaultRouter
from exams.views import (
     CompetencyAreaViewSet, QuestionViewSet,
      ExamAttemptViewSet, StudentDashboardView
)

from rest_framework_simplejwt.views import (
    # TokenObtainPairView,
    TokenRefreshView,
)
from users.views import (
    MyTokenObtainPairView, 
    RegisterWithVoucher,
    CreateTeacherView, 
    JoinClassroomView
)

from exams.views import (
    QuestionSyncView, StudentDashboardView, 
    CompetencyAreaViewSet, QuestionViewSet, 
    ExamAttemptViewSet,
    BulkQuestionUploadView, 
    StudentAnalyticsView,
    FullMockQuestionView,
    GlobalBookViewSet, 
    GlobalCompetencyViewSet,
    ExportStudentResultsView,
    InstitutionalReportPDFView
)
from core.views import (
    RegisterUniversityView, CheckSlugView,
    DepartmentViewSet, VoucherViewSet,
    DepartmentCompetencyAreasView,   
    TransactionHistoryView,
    InitializePaymentView,
    SaaSGlobalStatsView,
    SaasOwnerDashboardView,
    SaaSUniversityManagerViewSet,
    ClassroomViewSet,
    TeacherClassroomViewSet,
    TenantConfigView
)
from core.webhook import ChapaWebhookView
 

router = DefaultRouter()

router.register(r'competency-areas', CompetencyAreaViewSet, basename='competencyarea')
router.register(r'questions', QuestionViewSet, basename='question')
router.register(r'exam-attempts', ExamAttemptViewSet, basename='examattempt')
router.register(r'departments', DepartmentViewSet, basename='department')
router.register(r'vouchers', VoucherViewSet, basename='voucher')
router.register(r'owner/institutions', SaaSUniversityManagerViewSet, basename='owner-institutions')
router.register(r'join-classrooms', ClassroomViewSet, basename='join-classrooms')
router.register(r'teacher/classrooms', TeacherClassroomViewSet, basename='teacher-classrooms')
router.register(r'curriculum-analysis', TeacherClassroomViewSet, basename='curriculum-analysis')
router.register(r'owner/books', GlobalBookViewSet, basename='owner-books')
router.register(r'owner/master-competencies', GlobalCompetencyViewSet, basename='owner-competencies')

def test_func():
    return Response({"message": f"API is working {timezone.now()}"}, status=200)

urlpatterns = [
    path('admin-a1b2c3d4e5f6g7h8/', admin.site.urls),
    path('api/', include(router.urls)),
    # path('core/', include('core.urls')),
    path('api/dashboard/', StudentDashboardView.as_view(), name='student-dashboard'),
    path('api/core/owner/register-university/', RegisterUniversityView.as_view(), name='uni-onboard'),
    path('api/token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('questions/sync/', QuestionSyncView.as_view(), name='question-sync'),
    path(('api/users/register/'), RegisterWithVoucher.as_view(), name='register'),
    path('api/check-slug/', CheckSlugView.as_view(), name='check-slug'),
    # Single endpoint for all methods on competency areas by department
    path(
        'api/departments/<int:dept_id>/competency-areas/',
          DepartmentCompetencyAreasView.as_view(),
        name='department-competency-areas'
    ),
    path('api/payments/webhook/', ChapaWebhookView.as_view(), name='webhook'),
    path('api/billing/history/', TransactionHistoryView.as_view(), name='billing-history'),
    path('api/payments/initialize/', InitializePaymentView.as_view(), name='initialize-payment'),
    path('api/exams/questions/upload-csv/', BulkQuestionUploadView.as_view(), name ='upload-csv'),
    path('faculty/create-teacher/', CreateTeacherView.as_view(), name='create-teacher'),
    path('api/exams/analytics/student/', StudentAnalyticsView.as_view(), name='student-analytics'),
    path('api/exams/questions/full-mock/', FullMockQuestionView.as_view(), name='full-mock'),
    path('api/saas/stats/', SaaSGlobalStatsView.as_view(), name='saas-global-stats'), 
    path('api/owner/dashboard/', SaasOwnerDashboardView.as_view(), name='saas-owner-dashboard'),
    path('api/join-classroom/', JoinClassroomView.as_view(), name='join-classroom'),
    path('api/core/tenant-config/', TenantConfigView.as_view(), name='tenant-config'),
    path('api/exams/results/export/', ExportStudentResultsView.as_view(), name='export-student-results'),
    path('api/exams/reports/institutional-pdf/', InstitutionalReportPDFView.as_view(), name='institutional-pdf'),
    path('api/test', test_func),

]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)