from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt

@method_decorator(csrf_exempt, name='dispatch')
class ChapaWebhookView(APIView):
    permission_classes = [AllowAny] # Chapa calls this, no user token

    def post(self, request):
        # In production, verify the Chapa signature here for security!
        tx_ref = request.data.get('tx_ref')
        
        try:
            transaction_obj = Transaction.objects.get(tx_ref=tx_ref, status='PENDING')
            
            # 1. Mark transaction as success
            transaction_obj.status = 'SUCCESS'
            transaction_obj.save()

            # 2. REFILL THE BANK ACCOUNT
            university = transaction_obj.university
            university.voucher_balance += transaction_obj.credits_purchased
            university.save()

            return Response(status=200)
        except Transaction.DoesNotExist:
            return Response(status=400)