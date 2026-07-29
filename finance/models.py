from django.db import models
from django.conf import settings

class Wallet(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="wallet"
    )
    balance = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    def __str__(self):
        return f"{self.user.username} Wallet - {self.balance}"


class Transaction(models.Model):
    TYPES = (
        ("charge", "Charge Wallet"),
        ("usage", "Use for Design"),
        ("refund", "Refund"),
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="transactions"
    )
    type = models.CharField(max_length=20, choices=TYPES)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    description = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    authority = models.CharField(max_length=64, null=True, blank=True)
    status = models.CharField(max_length=20, default="pending")  # pending | paid | failed


    def __str__(self):
        return f"{self.user.username} - {self.type} - {self.amount}"
