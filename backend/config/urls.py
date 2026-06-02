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

from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from exams.views import (
     CompetencyAreaViewSet, QuestionViewSet,
      ExamAttemptViewSet, StudentDashboardView
)

from rest_framework_simplejwt.views import (
    # TokenObtainPairView,
    TokenRefreshView,
)
from users.views import MyTokenObtainPairView, RegisterWithVoucher
from exams.views import (
    QuestionSyncView, StudentDashboardView, 
    CompetencyAreaViewSet, QuestionViewSet, 
    ExamAttemptViewSet
)

from core.views import (
    RegisterUniversityView, CheckSlugView,
    DepartmentViewSet, VoucherViewSet,
    DepartmentCompetencyAreasView,  # add this import
)

router = DefaultRouter()

router.register(r'competency-areas', CompetencyAreaViewSet, basename='competencyarea')
router.register(r'questions', QuestionViewSet, basename='question')
router.register(r'exam-attempts', ExamAttemptViewSet, basename='examattempt')
router.register(r'departments', DepartmentViewSet, basename='department')
router.register(r'vouchers', VoucherViewSet, basename='voucher')

urlpatterns = [
    path('admin-a1b2c3d4e5f6g7h8/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api/dashboard/', StudentDashboardView.as_view(), name='student-dashboard'),
    path('api/core/register-university/', RegisterUniversityView.as_view(), name='uni-onboard'),
    path('api/token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('questions/sync/', QuestionSyncView.as_view(), name='question-sync'),
    path(('api/users/register/'), RegisterWithVoucher.as_view(), name='register'),
    path('api/check-slug/', CheckSlugView.as_view(), name='check-slug'),
    # Single endpoint for all methods on competency areas by department
    path(
        'api/departments/<int:dept_id>/competency-areas/',
        DepartmentCompetencyAreasView.as_view(),
        name='dept-competency-areas'
    ),
]