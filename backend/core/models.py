from django.db import models
import uuid
from .thread_local import get_current_university

class University(models.Model):
    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True) 
    logo = models.ImageField(upload_to='university_logos/', null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


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
    # Overriding related_name explicitly
    name = models.CharField(max_length=255)

    class Meta:
        # Crucial for index performance across a single schema
        indexes = [models.Index(fields=['university', 'name'])]

    def __str__(self):
        return f"{self.name} - {self.university.name}"


def generate_voucher_code():
    return uuid.uuid4().hex[:12].upper()

    
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