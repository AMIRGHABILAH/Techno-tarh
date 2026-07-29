from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Wallet, Transaction
from .serializers import TransactionSerializer

import requests
from django.conf import settings

MERCHANT_ID = "XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX"
CALLBACK_URL = "http://localhost:8000/api/finance/zarinpal/verify"


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def zarinpal_request(request):
    """فرآیند درخواست پرداخت و ساخت تراکنش در حالت pending"""
    amount = request.data.get("amount")

    if not amount or int(amount) < 1000:
        return Response({"error": "مبلغ نامعتبر"}, status=400)

    amount = int(amount)

    # ساخت تراکنش (pending)
    transaction = Transaction.objects.create(
        user=request.user,
        type="charge",
        amount=amount,
        description="شارژ کیف پول",
        status="pending",
    )

    payload = {
        "merchant_id": MERCHANT_ID,
        "amount": amount,
        "callback_url": f"{CALLBACK_URL}?transaction_id={transaction.id}",
        "description": "شارژ کیف پول",
    }

    result = requests.post(
        "https://api.zarinpal.com/pg/v4/payment/request.json",
        json=payload
    ).json()

    # بررسی موفق بودن درخواست به زرین‌پال
    if result["data"]["code"] != 100:
        transaction.status = "failed"
        transaction.save()
        return Response({"error": "خطا در ارتباط با زرین‌پال"}, status=400)

    authority = result["data"]["authority"]
    transaction.authority = authority
    transaction.save()

    pay_url = f"https://www.zarinpal.com/pg/StartPay/{authority}"
    return Response({"url": pay_url})



@api_view(["GET"])
@permission_classes([])  # بدون احراز هویت
def zarinpal_verify(request):
    """تأیید پرداخت پس از بازگشت کاربر از زرین‌پال"""
    status = request.GET.get("Status")
    authority = request.GET.get("Authority")
    transaction_id = request.GET.get("transaction_id")

    if not transaction_id:
        return Response({"error": "شناسه تراکنش یافت نشد"}, status=400)

    try:
        transaction = Transaction.objects.get(id=transaction_id)
    except Transaction.DoesNotExist:
        return Response({"error": "تراکنش یافت نشد"}, status=404)

    # جلوگیری از دوباره تأیید شدن تراکنش
    if transaction.status == "paid":
        return Response({"message": "قبلاً پرداخت شده است"}, status=200)

    # امنیت: بررسی authority (جلوگیری از سواستفاده پارامتر Authority)
    if transaction.authority != authority:
        transaction.status = "failed"
        transaction.save()
        return Response({"error": "Authority نامعتبر"}, status=400)

    # اگر کاربر پرداخت را لغو کرد
    if status != "OK":
        transaction.status = "failed"
        transaction.save()
        return Response({"status": "failed", "message": "پرداخت لغو شد"})

    payload = {
        "merchant_id": MERCHANT_ID,
        "amount": int(transaction.amount),
        "authority": authority
    }

    result = requests.post(
        "https://api.zarinpal.com/pg/v4/payment/verify.json",
        json=payload
    ).json()

    # اعتبارسنجی موفقیت آمیز پرداخت با کد 100
    if result.get("data", {}).get("code") == 100:
        wallet = transaction.user.wallet
        wallet.balance += transaction.amount
        wallet.save()

        transaction.status = "paid"
        # می‌توانی: transaction.ref_id = result["data"]["ref_id"] را ذخیره کنی (اگر مدل را اینگونه تعریف کنی)
        transaction.save()

        return Response({
            "status": "success",
            "ref_id": result["data"]["ref_id"],
            "balance": wallet.balance
        }, status=200)

    # اگر پرداخت موفق نبود
    transaction.status = "failed"
    transaction.save()
    return Response({"status": "failed", "message": "پرداخت ناموفق"}, status=200)



@api_view(["POST"])
@permission_classes([IsAuthenticated])
def charge_wallet(request):
    amount = request.data.get("amount")

    if not amount or float(amount) <= 0:
        return Response({"error": "مبلغ نامعتبر"}, status=400)

    wallet = request.user.wallet
    wallet.balance += float(amount)
    wallet.save()

    Transaction.objects.create(
        user=request.user,
        type="charge",
        amount=amount,
        description="شارژ حساب"
    )

    return Response({"balance": wallet.balance})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_wallet(request):
    wallet = request.user.wallet
    return Response({"balance": wallet.balance})


# @api_view(["GET"])
# @permission_classes([IsAuthenticated])
# def my_transactions(request):
#     transactions = request.user.transactions.order_by("-created_at")
#     serializer = TransactionSerializer(transactions, many=True)
#     return Response(serializer.data)

from decimal import Decimal

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_transactions(request):

    transactions = list(
        request.user.transactions.order_by("-created_at")
    )

    # موجودی واقعی فعلی
    balance = request.user.wallet.balance

    for tx in transactions:

        # ثبت موجودی بعد از این تراکنش
        tx.balance_after = balance

        amount = tx.amount  # چون DecimalField است، نیازی به پاکسازی نیست

        # حالا برگرد به موجودی قبل از این تراکنش
        if tx.type == "charge":
            balance -= amount
        elif tx.type == "usage":
            balance += amount
        elif tx.type == "refund":
            balance -= amount

    serializer = TransactionSerializer(transactions, many=True)
    return Response(serializer.data)
