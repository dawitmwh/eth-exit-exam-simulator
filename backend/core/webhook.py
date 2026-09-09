from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from core.models import Transaction
from django.db import transaction 


from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.db import transaction
from core.models import Transaction, University
import hmac, hashlib, json


class ChapaWebhookView(APIView):
    permission_classes = [AllowAny]

    def get(self, request): # Chapa sometimes "pings" with GET
        return self.handle_webhook(request)

    def post(self, request): # Chapa usually sends POST
        return self.handle_webhook(request)

    def handle_webhook(self, request):
        # 1. Look for BOTH names in BOTH places (Query Params and JSON Body)
        tx_ref = (
            request.query_params.get('trx_ref') or 
            request.query_params.get('tx_ref') or 
            request.data.get('tx_ref') or 
            request.data.get('trx_ref')
        )
        
        print(f"🔔 WEBHOOK SIGNAL RECEIVED: {tx_ref}")

        if tx_ref:
            # 2. Use unscoped_objects to bypass the 'university=None' filter
            transaction_obj = Transaction.unscoped_objects.filter(tx_ref=tx_ref).first()
            
            if transaction_obj and transaction_obj.status == 'PENDING':
                with transaction.atomic():
                    transaction_obj.status = 'SUCCESS'
                    transaction_obj.save()

                    university = transaction_obj.university
                    university.voucher_balance += transaction_obj.credits_purchased
                    university.save()
                    print(f"💰 SUCCESS: {university.name} balance is now {university.voucher_balance}")
                
                return Response({"status": "success"}, status=200)

        return Response({"status": "acknowledged"}, status=200)
        

# @method_decorator(csrf_exempt, name='dispatch')
# class ChapaWebhookView(APIView):
#     permission_classes = [AllowAny] 

#     def post(self, request):
#         # 1. Chapa sends 'tx_ref' and 'status'
#         tx_ref = request.data.get('tx_ref')
#         status = request.data.get('status')
#         chapa_signature = request.headers.get('x-chapa-signature')

#         secret = settings.CHAPA_SECRET_KEY.replace("'", "").strip()

#         generated_signature = hmac.new(
#             secret.encode('utf-8'),
#             request.body,
#             hashlib.sha256
#         ).hexdigest()

#         if chapa_signature != generated_signature:
#             print("🛑 SECURITY ALERT: Invalid Webhook Signature!")
#             return Response({"error": "Invalid signature"}, status=401)

#         tx_ref = request.data.get('tx_ref')
#         status = request.data.get('status')
        
#         if status == 'success':
#             try:
#                 # 2. Find the pending transaction
#                 transaction_obj = Transaction.objects.get(tx_ref=tx_ref, status='PENDING')
                
#                 with transaction.atomic():
#                     # 3. Mark success
#                     transaction_obj.status = 'SUCCESS'
#                     transaction_obj.save()

#                     # 4. REFILL UNIVERSITY BALANCE
#                     university = transaction_obj.university
#                     university.voucher_balance += transaction_obj.credits_purchased
#                     university.save()

#                 print(f"💰 SUCCESS: Refilled {university.name} with {transaction_obj.credits_purchased} credits.")
#                 return Response(status=200)
#             except Transaction.DoesNotExist:
#                 return Response({"error": "Transaction not found"}, status=404)

#         return Response(status=200)


# @method_decorator(csrf_exempt, name='dispatch')
# class ChapaWebhookView(APIView):
#     permission_classes = [AllowAny]

#     def post(self, request):
#         print("--- 🔔 WEBHOOK RECEIVED FROM CHAPA ---")
        
#         # 1. Get the data
#         tx_ref = request.data.get('tx_ref')
#         status = request.data.get('status')
#         print(f"DEBUG: Processing Reference: {tx_ref} | Status: {status}")

#         tx_ref = request.data.get('tx_ref')
#         status = request.data.get('status')
#         chapa_signature = request.headers.get('x-chapa-signature')

#         secret = settings.CHAPA_SECRET_KEY.replace("'", "").strip()

#         generated_signature = hmac.new(
#             secret.encode('utf-8'),
#             request.body,
#             hashlib.sha256
#         ).hexdigest()

#         if chapa_signature != generated_signature:
#             print("🛑 SECURITY ALERT: Invalid Webhook Signature!")
#             return Response({"error": "Invalid signature"}, status=401)

#         if status == 'success':
#             try:
#                 # 2. Find the transaction
#                 transaction_obj = Transaction.objects.get(tx_ref=tx_ref)
#                 print(f"DEBUG: Found Transaction for {transaction_obj.university.name}")

#                 if transaction_obj.status == 'SUCCESS':
#                     print("DEBUG: This transaction was already processed. Skipping.")
#                     return Response(status=200)

#                 with transaction.atomic():
#                     # 3. Update Transaction
#                     transaction_obj.status = 'SUCCESS'
#                     transaction_obj.save()

#                     # 4. Refill Balance
#                     uni = transaction_obj.university
#                     uni.voucher_balance += transaction_obj.credits_purchased
#                     uni.save()
#                     print(f"💰 SUCCESS: New Balance for {uni.name} is {uni.voucher_balance}")

#                 return Response(status=200)

#             except Transaction.DoesNotExist:
#                 print(f"❌ ERROR: Transaction {tx_ref} not found in DB!")
#                 return Response({"error": "Not found"}, status=404)
        
#         print(f"⚠️ WEBHOOK NOTICE: Received status {status}")
#         return Response(status=200)

# @method_decorator(csrf_exempt, name='dispatch')
# class ChapaWebhookView(APIView):
#     permission_classes = [AllowAny]

#     def post(self, request):
#         print("--- 🔔 RAW WEBHOOK START ---")
#         # 1. Print exactly what Chapa sent
#         print(f"BODY: {request.data}") 
#         print("--- 🔔 RAW WEBHOOK END ---")

#         try:
#             # 2. Extract data carefully
#             # Some Chapa webhooks send data inside a 'data' key or use different names
#             tx_ref = request.data.get('tx_ref') or request.data.get('trx_ref')
#             status = request.data.get('status')
            
#             # SENIOR LOGIC: If Chapa sends an 'event' type, handle it
#             if not tx_ref and 'data' in request.data:
#                 tx_ref = request.data['data'].get('tx_ref')
#                 status = request.data['data'].get('status')

#             print(f"DEBUG: Extracted Ref: {tx_ref} | Status: {status}")

#             if status == 'success' and tx_ref:
#                 # Use the 'unscoped' logic from our previous step 
#                 # (Ignoring the university filter)
#                 transaction_obj = Transaction.objects.filter(tx_ref=tx_ref).first()

#                 if transaction_obj and transaction_obj.status == 'PENDING':
#                     with transaction.atomic():
#                         transaction_obj.status = 'SUCCESS'
#                         transaction_obj.save()

#                         university = transaction_obj.university
#                         university.voucher_balance = (university.voucher_balance or 0) + transaction_obj.credits_purchased
#                         university.save()
#                         print(f"💰 SUCCESS: {university.name} refilled via real Chapa call!")
                
#                 return Response(status=200)

#         except Exception as e:
#             print(f"🔥 WEBHOOK ERROR: {str(e)}")
#             return Response(status=500)

#         return Response(status=200)