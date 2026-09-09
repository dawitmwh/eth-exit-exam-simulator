import requests
import uuid
from django.conf import settings

CHAPA_SECRET_KEY = settings.CHAPA_SECRET_KEY
CHAPA_URL = 'https://api.chapa.co/v1/transaction/initialize'   
 
 

def initialize_chapa_payment(university, amount, credits, email):
    # 1. Generate unique reference
    tx_ref = f"TX-{university.slug.upper()}-{uuid.uuid4().hex[:12].upper()}"
    
    # 2. Extract and CLEAN the secret key (Removes any accidental quotes)
    # We do the cleaning here to be 100% safe
    raw_key = getattr(settings, 'CHAPA_SECRET_KEY', '')
    clean_key = raw_key.replace("'", "").replace('"', "").strip()
    
    # callback = f"{settings.BASE_URL_DOMAIN}/api/payments/webhook/"

    callback = f"{settings.BASE_URL_DOMAIN}/api/payments/webhook/"
    
    payload = {
        "amount": str(amount),
        "currency": "ETB",
        "email": email,
        "first_name": university.name[:20],
        "last_name": "University",
        "tx_ref": tx_ref,
        "callback_url": callback,
        "return_url": f"http://{university.slug}.localhost:5173/admin/vouchers/?status=success",
    }

    print(f"DEBUG: Sending Chapa Payment Init for {university.slug} with payload: {payload}")

    headers = {
        "Authorization": f"Bearer {clean_key}", # Uses the cleaned key
        "Content-Type": "application/json"
    }

    try:
        response = requests.post(CHAPA_URL, json=payload, headers=headers)
        # Return the dictionary and the ref separately
        return response.json(), tx_ref
    except Exception as e:
        return {"status": "failed", "message": str(e)}, None
 
 