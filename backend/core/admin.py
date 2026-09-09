from django.contrib import admin
from .models import University, Department, VoucherCode, Transaction, ExamBook, UniversityBookSubscription, Classroom
from django.contrib.admin import site


@admin.register(University)
class UniversityAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'is_active', 'created_at')
    prepopulated_fields = {'slug': ('name',)}  # auto-generate slug from name   

@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ('name', 'university')
    list_filter = ('university',)   
 


@admin.register(VoucherCode)
class VoucherCodeAdmin(admin.ModelAdmin):
    list_display = ['code', 'university', 'department', 'is_redeemed', 'redeemed_by']
    list_filter = ['is_redeemed', 'university']
    search_fields = ['code']
    
    # SENIOR MOVE: Custom Action to reset vouchers in bulk
    actions = ['reset_vouchers']

    def reset_vouchers(self, request, queryset):
        queryset.update(is_redeemed=False, redeemed_by=None, redeemed_at=None)
        self.message_user(request, "Selected vouchers have been reset for testing!")
    
    reset_vouchers.short_description = "Reset selected vouchers for testing"


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ['university', 'tx_ref', 'amount', 'credits_purchased', 'status']
    list_filter = ['status', 'university']
    search_fields = ['tx_ref']


@admin.register(ExamBook)
class ExamBookAdmin(admin.ModelAdmin):
    list_display = ['title', 'category', 'is_premium', 'created_at']
    list_filter = ['is_premium', 'category']
    search_fields = ['title']


@admin.register(UniversityBookSubscription)
class UniversityBookSubscriptionAdmin(admin.ModelAdmin):
    list_display = ['university', 'book', 'unlocked_at']
    list_filter = ['university', 'book']
    search_fields = ['university__name', 'book__title']

@admin.register(Classroom)
class ClassroomAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'department', 'student_count', 'created_at']
    list_filter = ['department__university', 'department']
    search_fields = ['name', 'code']
    readonly_fields = ['code']  # Code is auto-generated and should not be editable

    def student_count(self, obj):
        return obj.students.count()
    student_count.short_description = 'Number of Students'