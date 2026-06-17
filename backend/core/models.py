from django.db import models
import uuid
from .thread_local import get_current_university
from django.core.exceptions import ImproperlyConfigured
from contextvars import ContextVar


# This stores the tenant in the current thread/async task
_current_university = ContextVar('current_university', default=None)

def get_current_university():
    return _current_university.get()

def set_current_university(uni):
    _current_university.set(uni)


class University(models.Model):
    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True) 

    voucher_balance = models.PositiveIntegerField(
        default=0, 
        help_text="Number of student seats available to generate vouchers for."
    )
    logo = models.ImageField(upload_to='university_logos/', null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} (Balance: {self.voucher_balance})"


class UniversityManager(models.Manager):
    def get_queryset(self):
        uni = get_current_university()
        if not uni:
            return super().get_queryset()
        # Filter rows automatically based on the foreign key pointing to University
        return super().get_queryset().filter(university=uni)


class UniversityTenantModel(models.Model):
    """Abstract model to automate row-level multitenancy isolation."""
    university = models.ForeignKey(University, on_delete=models.CASCADE)

    objects = UniversityManager()
    unscoped_objects = models.Manager() # Backup to bypass filters when needed (e.g., custom scripts)

    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        if not self.university_id:
            current_uni = get_current_university()
            if current_uni:
                self.university = current_uni
        super().save(*args, **kwargs)


class Department(UniversityTenantModel):
    class Category(models.TextChoices):
        MANAGEMENT = 'MGMT', 'Management'
        MARKETING = 'MMGMT', 'Marketing'
        ACCOUNTING = 'ACC', 'Accounting and Finance'
    name = models.CharField(max_length=255)

    # Use the Choices here to prevent typos identifiers of departments across the system
    category = models.CharField(
        max_length=50, 
        choices=Category.choices,
        db_index=True 
    ) 

    class Meta:
        # Crucial for index performance across a single schema
        indexes = [models.Index(fields=['university', 'name'])]

    def __str__(self):
        return f"{self.name} - {self.university.name}"


def generate_voucher_code():
    return uuid.uuid4().hex[:12].upper()


class ExamBook(models.Model):
    """The Master Library: A collection of subjects for a specific field."""
    title = models.CharField(max_length=255) # e.g., "National Nursing Mock 2026"
    
    # This category links the Book to a Department (e.g., 'NURSING')
    category = models.CharField(max_length=100, db_index=True) 
    
    description = models.TextField(blank=True)
    is_premium = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class UniversityBookSubscription(models.Model):
    """The link table between a University and an Exam Book."""
    university = models.ForeignKey('University', on_delete=models.CASCADE)
    book = models.ForeignKey(ExamBook, on_delete=models.CASCADE)
    unlocked_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('university', 'book')
        verbose_name_plural = "University Book Subscriptions"

    
class VoucherCode(UniversityTenantModel):
    code = models.CharField(max_length=12, default=generate_voucher_code)
    # Department must be under the same university context
    department = models.ForeignKey(Department, on_delete=models.CASCADE)
    is_redeemed = models.BooleanField(default=False)
    
    redeemed_by = models.OneToOneField(
        'users.User', 
        null=True, 
        blank=True, 
        on_delete=models.SET_NULL,
        related_name='voucher'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    redeemed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [models.Index(fields=['university', 'code'])]

    def __str__(self):
        return f"{self.code} ({self.university.slug})"


class Transaction(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        SUCCESS = 'SUCCESS', 'Successful'
        FAILED = 'FAILED', 'Failed'

    university = models.ForeignKey(University, on_delete=models.CASCADE)
    # Chapa's reference ID (generate this)
    tx_ref = models.CharField(max_length=100, unique=True) 
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    credits_purchased = models.PositiveIntegerField()
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.tx_ref} - {self.status}"