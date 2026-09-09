from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsSuperUser # You'll need to create this permission
from django.db.models import Sum, Count
from .models import University, Transaction
from users.models import User

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