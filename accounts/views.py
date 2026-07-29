# accounts/views.py
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from .serializers import RegisterSerializer, UserSerializer
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
import random
from rest_framework.decorators import api_view,permission_classes
from rest_framework.permissions import AllowAny
from .models import OTPCode

User = get_user_model()

class RegisterView(generics.CreateAPIView):
    """
    API برای ثبت‌نام کاربر جدید
    """
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]  # همه می‌تونن ثبت‌نام کنن

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # ذخیره کاربر
        user = serializer.save()
        
        # ساخت توکن JWT برای لاگین خودکار
        refresh = RefreshToken.for_user(user)
        
        # پاسخ با اطلاعات کاربر و توکن
        return Response({
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'company': user.company,
            },
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'message': 'ثبت‌نام با موفقیت انجام شد'
        }, status=status.HTTP_201_CREATED)
        
        
        
class MeView(generics.RetrieveUpdateAPIView):
    """
    دریافت و ویرایش اطلاعات کاربر فعلی
    """
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user





class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):

        user = request.user

        current_password = request.data.get("current_password")
        new_password = request.data.get("new_password")

        if not user.check_password(current_password):
            return Response(
                {"error": "رمز فعلی اشتباه است"},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.set_password(new_password)
        user.save()

        return Response({"message": "password updated"})




@api_view(['POST'])
@permission_classes([AllowAny])
def send_code(request):

    phone = request.data.get("phone_number")

    code = str(random.randint(1000,9999))

    OTPCode.objects.create(
        phone_number=phone,
        code=code
    )

    return Response({
        "message":"code created",
        "debug_code":code
    })


import random
import requests
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.conf import settings
from .models import OTPCode


# @api_view(['POST'])
# @permission_classes([AllowAny])
# def send_code(request):
#     phone = request.data.get("phone_number")
    
#     if not phone:
#         return Response({"error": "شماره موبایل الزامی است"}, status=400)
    
#     # پاکسازی شماره موبایل (حذف 0 اول و اضافه کردن 98)
#     if phone.startswith('0'):
#         phone = '98' + phone[1:]
#     elif not phone.startswith('98'):
#         phone = '98' + phone
    
#     # تولید کد ۴ رقمی
#     code = str(random.randint(1000, 9999))
    
#     # ذخیره کد در دیتابیس
#     OTPCode.objects.create(
#         phone_number=phone,
#         code=code
#     )
    
#     # ارسال پیامک از طریق sms.ir با requests
#     # try:
#     #     url = "https://api.sms.ir/v1/send/verify"
        
#     #     payload = {
#     #         "mobile": phone,
#     #         "templateId": 283996,  # آی‌دی قالب پیامکی - باید از پنل sms.ir بگیرید
#     #         "parameters": [
#     #             {"name": "CODE", "value": code}
#     #         ]
#     #     }
        
#     #     headers = {
#     #         "Content-Type": "application/json",
#     #         "Accept": "text/plain",
#     #         "x-api-key": settings.SMSIR_API_KEY
#     #     }
        
#     #     response = requests.post(url, json=payload, headers=headers, timeout=10)
        
#     #     print(f"SMS Response Status: {response.status_code}")
#     #     print(f"SMS Response Body: {response.text}")
        
#     #     if response.status_code == 200:
#     #         return Response({
#     #             "message": "کد تأیید با موفقیت ارسال شد",
#     #             "debug_code": code if settings.DEBUG else None
#     #         })
#     #     else:
#     #         raise Exception(f"API Error: {response.text}")
            
#     # except Exception as e:
#     #     print(f"SMS Error: {e}")
        
#     #     # در حالت دیباگ، کد را برگردان
#     #     if settings.DEBUG:
#     #         return Response({
#     #             "message": "کد ایجاد شد اما ارسال پیامک با خطا مواجه شد",
#     #             "debug_code": code,
#     #             "error": str(e)
#     #         })
#     #     else:
#     #         return Response({
#     #             "error": "خطا در ارسال پیامک. لطفاً دوباره تلاش کنید."
#     #         }, status=500)


#     print(f'📱 کد تایید برای {phone}: {code}')
    
#     # برگرداندن کد در پاسخ (فقط برای توسعه)
#     return Response({
#         "message": "کد تایید ایجاد شد (SMS.ir غیرفعال است)",
#         "debug_code": code,
#         "phone_number": phone
#     })


User = get_user_model()

# @api_view(['POST'])
# @permission_classes([AllowAny])
# def verify_code(request):

#     phone = request.data.get("phone_number")
#     code = request.data.get("code")

#     otp = OTPCode.objects.filter(
#         phone_number=phone,
#         code=code,
#         is_used=False
#     ).last()

#     if not otp:
#         return Response({"error":"کد نامعتبر است"}, status=400)

#     otp.is_used = True
#     otp.save()

#     user, created = User.objects.get_or_create(
#         phone_number=phone,
#         defaults={
#             "username": "USR"+phone
#         }
#     )

#     if not user.password:
#         return Response({
#             "need_set_password": True
#         })

#     refresh = RefreshToken.for_user(user)

#     return Response({
#         "access": str(refresh.access_token),
#         "refresh": str(refresh)
#     })

@api_view(['POST'])
@permission_classes([AllowAny])
def set_password(request):

    phone = request.data.get("phone_number")
    password = request.data.get("password")

    user = User.objects.get(phone_number=phone)

    user.set_password(password)
    user.save()

    refresh = RefreshToken.for_user(user)

    return Response({
        "access": str(refresh.access_token),
        "refresh": str(refresh)
    })


# ایا کاربر وجود دارد یه نه 

@api_view(['POST'])
@permission_classes([AllowAny])
def check_phone(request):
    phone = request.data.get("phone_number")
    exists = User.objects.filter(phone_number=phone).exists()
    return Response({"exists": exists})

from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import MyTokenSerializer

class MyTokenView(TokenObtainPairView):
    serializer_class = MyTokenSerializer
