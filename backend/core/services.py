import requests
import uuid
from django.conf import settings

CHAPA_SECRET_KEY = "your_chapa_secret_key" # Use environment variables!
CHAPA_URL = "https://api.chapa.co/v1/transaction/initialize"

def initialize_chapa_payment(university, amount, credits):
    tx_ref = f"TX-{uuid.uuid4().hex[:8].upper()}"
    
    payload = {
        "amount": str(amount),
        "currency": "ETB",
        "email": "dean@university.edu", # Pull from university admin
        "first_name": university.name,
        "last_name": "University",
        "tx_ref": tx_ref,
        "callback_url": "http://api.yoursite.com/api/payments/webhook/", # Chapa calls this
        "return_url": f"http://{university.slug}.localhost:5173/admin/vouchers/?status=success",
        "customization[title]": f"Purchase {credits} Credits",
        "customization[description]": "Exit Examiner Student Seats"
    }

    headers = {
        "Authorization": f"Bearer {CHAPA_SECRET_KEY}",
        "Content-Type": "application/json"
    }

    response = requests.post(CHAPA_URL, json=payload, headers=headers)
    return response.json(), tx_ref