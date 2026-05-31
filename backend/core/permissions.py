from rest_framework.permissions import BasePermission
from core.thread_local import get_current_university

class IsWorkspaceMember(BasePermission):
    """
    Ensures that a logged-in user can only interact with endpoints
    matching the university they are actually assigned to.
    """
    def has_permission(self, request, view):
        # 1. Let public endpoints handle their own security (like login or register)
        if not request.user or not request.user.is_authenticated:
            return False
        
        current_uni = get_current_university()
        
        # 2. If the request is hit on a global system route (e.g., central landing page), allow access
        if not current_uni:
            return True
            
        # 3. Superusers/Staff bypass multi-tenant restrictions
        if request.user.is_staff:
            return True
            
        # 4. Enforce strict match: Does the user's assigned university match the current subdomain?
        return request.user.university == current_uni