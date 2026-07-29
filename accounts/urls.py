# accounts/urls.py
from django.urls import path
from .views import (
    RegisterView,
    MeView,
    ChangePasswordView,
    send_code,
    verify_code,
    set_password,
    check_phone,
    MyTokenView
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),  
    path("me/", MeView.as_view()),
    path("change-password/", ChangePasswordView.as_view()),
        # OTP
    path("send-code/", send_code, name="send_code"),
    path("verify-code/", verify_code, name="verify_code"),
    path("set-password/", set_password, name="set_password"),
    path("check-phone/",   check_phone),
    path("auth/token/", MyTokenView.as_view(), name="token_obtain_pair"),

]