from django.http import JsonResponse
from core.models import University
from core.thread_local import set_current_university, clear_current_university

class TenantMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        host = request.get_host().split(':')[0]
        parts = host.split('.')

        is_root = len(parts) == 1 or parts[0] in ['www', 'localhost', '127']

        if is_root:
            # Root domain is allowed to proceed without a tenant
            # This is where University Registration happens!
            request.tenant = None
        else:
            # 3. This is a Subdomain (e.g., 'adama.localhost')
            tenant_slug = parts[0]
            tenant = University.objects.filter(slug=tenant_slug, is_active=True).first()
            
            if tenant:
                request.tenant = tenant
            else:
                # If they type 'fake.localhost', block them
                return JsonResponse({
                    "error": "No valid university workspace detected from subdomain."
                }, status=404)

        return self.get_response(request)









        
        # if len(parts) > 1:
        #     tenant_slug = parts[0]
        #     if tenant_slug not in ['www', 'admin', 'api']:
        #         try:
        #             request.tenant = University.objects.get(slug=tenant_slug, is_active=True)
        #             set_current_university(request.tenant)
        #         except University.DoesNotExist:
        #             request.tenant = None
        #     else:
        #         request.tenant = None
        # else:
        #     request.tenant = None

        # try:
        #     if (request.tenant):
        #         response = self.get_response(request)
        #         return response
        #     elif request.path.startswith('/admin-a1b2c3d4e5f6g7h8/'):
        #         response = self.get_response(request)
        #         return response
        #     else:
        #         return JsonResponse({"error2": f"No valid university workspace detected from subdomain: {request.path}"}, status=400)
        # finally:
        #     clear_current_university()