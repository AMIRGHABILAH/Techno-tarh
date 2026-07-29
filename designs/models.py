from django.db import models
from django.conf import settings
import uuid

class Design(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='designs')
    name = models.CharField(max_length=120)
    data = models.JSONField()  # JSON خروجی Fabric.js (objects, layers, fonts, ...)
    thumbnail = models.ImageField(upload_to='thumbnails/', null=True, blank=True)
    is_template = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return f"{self.name} ({'Template' if self.is_template else 'User Design'})"
