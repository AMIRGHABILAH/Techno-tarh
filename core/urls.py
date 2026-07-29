"""
URL configuration for core project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
# core/urls.py
from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from designs.views import DesignViewSet
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenRefreshView
from accounts.views import MyTokenView
from designs.views import upload_psd



router = DefaultRouter()
router.register(r'designs', DesignViewSet, basename='designs')

urlpatterns = [
    path('admin/', admin.site.urls),

    # JWT Auth
    path('api/auth/token/', MyTokenView.as_view(), name='token_obtain_pair'),

    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # این خط رو اصلاح کن - از api/auth/register/ به api/auth/ تغییر بده
    path('api/auth/', include('accounts.urls')),  # 👈 این درسته
    path('api/designs/upload-psd/', upload_psd, name='upload-psd'),
    # API Apps
    path('api/', include(router.urls)),
    
    # wallet apps
    path("api/finance/", include("finance.urls")),
   

    
]+static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)