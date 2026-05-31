from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    # This tells Django Admin how to display and edit your custom user
    model = User
    list_display = ['email', 'first_name', 'role', 'university', 'is_staff']
    
    # These fields are required for UserAdmin to handle hashing
    fieldsets = UserAdmin.fieldsets + (
        ('SaaS Info', {'fields': ('role', 'university', 'department')}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('SaaS Info', {'fields': ('role', 'university', 'department')}),
    )

