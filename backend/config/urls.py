from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.utils import timezone

from rest_framework_simplejwt.views import TokenRefreshView

from users.views import MyTokenObtainPairView, RegisterWithVoucher, CreateTeacherView, JoinClassroomView
from exams.views import (
    CompetencyAreaViewSet, QuestionViewSet, ExamAttemptViewSet, StudentDashboardView,
    BulkQuestionUploadView, GlobalBookViewSet, GlobalCompetencyViewSet,
)
from exams.student_insights import (
    StartExamView, SessionQuestionsView, SubmitExamView, ReviewExamView, StudentAnalyticsView,
)
from core.views import (
    RegisterUniversityView, CheckSlugView, DepartmentViewSet, VoucherViewSet,
    DepartmentCompetencyAreasView, TransactionHistoryView, InitializePaymentView,
    SaaSGlobalStatsView, SaasOwnerDashboardView, SaaSUniversityManagerViewSet,
    ClassroomViewSet, TeacherClassroomViewSet, TenantConfigView,
)
from core.webhook import ChapaWebhookView


class TestFunc(APIView):
    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        return Response({'message': f'API is working {timezone.now()}'})


router = DefaultRouter()
router.register(r'competency-areas', CompetencyAreaViewSet, basename='competencyarea')
router.register(r'questions', QuestionViewSet, basename='question')
router.register(r'exam-attempts', ExamAttemptViewSet, basename='examattempt')
router.register(r'departments', DepartmentViewSet, basename='department')
router.register(r'vouchers', VoucherViewSet, basename='voucher')
router.register(r'owner/institutions', SaaSUniversityManagerViewSet, basename='owner-institutions')
router.register(r'join-classrooms', ClassroomViewSet, basename='join-classrooms')
router.register(r'teacher/classrooms', TeacherClassroomViewSet, basename='teacher-classrooms')
router.register(r'owner/books', GlobalBookViewSet, basename='owner-books')
router.register(r'owner/master-competencies', GlobalCompetencyViewSet, basename='owner-competencies')

urlpatterns = [
    path('admin-a1b2c3d4e5f6g7h8/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api/dashboard/', StudentDashboardView.as_view(), name='student-dashboard'),
    path('api/core/owner/register-university/', RegisterUniversityView.as_view(), name='uni-onboard'),
    path('api/token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/users/register/', RegisterWithVoucher.as_view(), name='register'),
    path('api/check-slug/', CheckSlugView.as_view(), name='check-slug'),
    path('api/departments/<int:dept_id>/competency-areas/', DepartmentCompetencyAreasView.as_view(), name='department-competency-areas'),
    path('api/payments/webhook/', ChapaWebhookView.as_view(), name='webhook'),
    path('api/billing/history/', TransactionHistoryView.as_view(), name='billing-history'),
    path('api/payments/initialize/', InitializePaymentView.as_view(), name='initialize-payment'),
    path('api/exams/questions/upload-csv/', BulkQuestionUploadView.as_view(), name='upload-csv'),
    path('api/faculty/create-teacher/', CreateTeacherView.as_view(), name='create-teacher'),
    path('api/exams/analytics/student/', StudentAnalyticsView.as_view(), name='student-analytics'),
    path('api/exams/attempts/start/', StartExamView.as_view(), name='exam-start'),
    path('api/exams/questions/session/', SessionQuestionsView.as_view(), name='exam-session-questions'),
    path('api/exams/attempts/<int:attempt_id>/submit/', SubmitExamView.as_view(), name='exam-submit'),
    path('api/exams/attempts/<int:attempt_id>/review/', ReviewExamView.as_view(), name='exam-review'),
    path('api/saas/stats/', SaaSGlobalStatsView.as_view(), name='saas-global-stats'),
    path('api/owner/dashboard/', SaasOwnerDashboardView.as_view(), name='saas-owner-dashboard'),
    path('api/join-classroom/', JoinClassroomView.as_view(), name='join-classroom'),
    path('api/core/tenant-config/', TenantConfigView.as_view(), name='tenant-config'),
    path('api/test', TestFunc.as_view(), name='test_api'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
