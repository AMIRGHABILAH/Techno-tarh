from django.contrib.auth.models import AbstractUser
from django.db import models
from django.contrib.auth import get_user_model
import random

class User(AbstractUser):
    company = models.CharField(max_length=100, blank=True)
    plan = models.CharField(max_length=50, default='free')
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    phone_number = models.CharField(max_length=20, null=True)  # ← تغییر از 11 به 20

    def __str__(self):
        return self.username

class OTPCode(models.Model):
    phone_number = models.CharField(max_length=20)  # ← تغییر از 11 به 20
    code = models.CharField(max_length=4)
    created_at = models.DateTimeField(auto_now_add=True)
    is_used = models.BooleanField(default=False)

    def generate_code(self):
        self.code = str(random.randint(1000, 9999))
