from django.http import JsonResponse
from core.models import University
from core.thread_local import set_current_university, clear_current_university



class TenantMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
        print(f"Tenant Middleware is running...")

    def __call__(self, request):

        # Get hostname without port
        host = request.get_host().split(":")[0].lower()

        path = request.path
        parts = host.split('.')

        # ---------------------------------------------------------
        # YOUR ROOT / BASE HOSTS
        # ---------------------------------------------------------

        ROOT_HOSTS = {
            "localhost",
            "127.0.0.1",
            "ec2-51-20-150-131.eu-north-1.compute.amazonaws.com",
            "ethioexitexamprep.xyz",
        }

        # ---------------------------------------------------------
        # WEBHOOKS
        # ---------------------------------------------------------

        is_webhook = "webhook" in path.lower()
        is_tunnel = 'amazonaws' in host or 'piggy' in host or 'ngrok' in host
        is_root = len(parts) == 1 or parts[0] in ['www', 'localhost', '127']

        if is_root or is_tunnel or is_webhook:
            request.tenant = None
            return self.get_response(request)

        # ---------------------------------------------------------
        # ROOT DOMAIN
        # ---------------------------------------------------------

        if host in ROOT_HOSTS:
            request.tenant = None
            return self.get_response(request)

        # ---------------------------------------------------------
        # LOCAL DEVELOPMENT
        # Example:
        # universal-college.localhost
        # ---------------------------------------------------------

        if host.endswith(".localhost"):
            tenant_slug = host.split(".")[0]

        # ---------------------------------------------------------
        # AWS EC2 TENANT
        #
        # Example:
        # universal-college.ec2-51-20-150-131.eu-north-1.compute.amazonaws.com
        #
        # ---------------------------------------------------------

        elif host.endswith(
            ".ec2-51-20-150-131.eu-north-1.compute.amazonaws.com"
        ):
            tenant_slug = host.split(".")[0]

        # ---------------------------------------------------------
        # UNKNOWN HOST
        # ---------------------------------------------------------

        else:
            request.tenant = None
            return self.get_response(request)

        # ---------------------------------------------------------
        # FIND UNIVERSITY
        # ---------------------------------------------------------

        tenant = University.objects.filter(
            slug=tenant_slug,
            is_active=True
        ).first()

        if tenant:
            request.tenant = tenant
        else:
            return JsonResponse(
                {
                    "error": "Portal not found",
                    "slug": tenant_slug,
                    "host": host,
                },
                status=404
            )

        return self.get_response(request)
