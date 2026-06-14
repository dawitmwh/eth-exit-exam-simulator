from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from core.models import Transaction
from django.db import transaction 
 

@method_decorator(csrf_exempt, name='dispatch')
class ChapaWebhookView(APIView):
    permission_classes = [AllowAny] 

    def post(self, request):
        # 1. Chapa sends 'tx_ref' and 'status'
        tx_ref = request.data.get('tx_ref')
        status = request.data.get('status')
        # chapa_signature = request.headers.get('x-chapa-signature')

        if status == 'success':
            try:
                # 2. Find the pending transaction
                transaction_obj = Transaction.objects.get(tx_ref=tx_ref, status='PENDING')
                
                with transaction.atomic():
                    # 3. Mark success
                    transaction_obj.status = 'SUCCESS'
                    transaction_obj.save()

                    # 4. REFILL UNIVERSITY BALANCE
                    university = transaction_obj.university
                    university.voucher_balance += transaction_obj.credits_purchased
                    university.save()

                print(f"💰 SUCCESS: Refilled {university.name} with {transaction_obj.credits_purchased} credits.")
                return Response(status=200)
            except Transaction.DoesNotExist:
                return Response({"error": "Transaction not found"}, status=404)

        return Response(status=200)