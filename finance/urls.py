from django.urls import path
from .views import charge_wallet, my_wallet, my_transactions

urlpatterns = [
    path("wallet/", my_wallet, name="wallet"),
    path("wallet/charge/", charge_wallet, name="charge_wallet"),
    path("wallet/transactions/", my_transactions, name="my_transactions"),
]
