# accounts/admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth import get_user_model

User = get_user_model()

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    """
    نمایش مدل User در ادمین با فیلدهای سفارشی
    """
    list_display = ('username', 'email', 'company', 'plan', 'is_staff', 'date_joined')
    list_filter = ('plan', 'is_staff', 'is_superuser', 'is_active')
    search_fields = ('username', 'email', 'company')
    ordering = ('-date_joined',)
    
    fieldsets = UserAdmin.fieldsets + (
        ('اطلاعات اضافی', {
            'fields': ('company', 'plan', 'avatar'),
            'classes': ('wide',),
        }),
    )
    
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('اطلاعات اضافی', {
            'fields': ('company', 'plan', 'avatar'),
        }),
    )