from rest_framework import serializers
from .models import Wallet, Transaction

class WalletSerializer(serializers.ModelSerializer):
    class Meta:
        model = Wallet
        fields = ["balance"]


# class TransactionSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = Transaction
#         fields = "__all__"
#         read_only_fields = ["user", "created_at"]

class TransactionSerializer(serializers.ModelSerializer):
    balance_after = serializers.FloatField()

    class Meta:
        model = Transaction
        fields = [
            "id",
            "created_at",
            "amount",
            "type",
            "description",
            "balance_after"
        ]

