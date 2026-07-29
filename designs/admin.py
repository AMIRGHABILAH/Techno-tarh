# designs/admin.py
from django.contrib import admin
from .models import Design

@admin.register(Design)
class DesignAdmin(admin.ModelAdmin):
    """
    نمایش مدل Design در ادمین
    """
    list_display = ('name', 'owner', 'is_template', 'created_at', 'updated_at', 'short_id')
    list_filter = ('is_template', 'created_at', 'owner')
    search_fields = ('name', 'owner__username', 'owner__email')
    readonly_fields = ('id', 'created_at', 'updated_at', 'preview_thumbnail')
    ordering = ('-updated_at',)
    raw_id_fields = ('owner',)
    list_per_page = 20
    
    fieldsets = (
        ('اطلاعات اصلی', {
            'fields': ('name', 'owner', 'is_template'),
            'classes': ('wide',),
        }),
        ('محتوای طراحی', {
            'fields': ('data',),
            'classes': ('wide', 'collapse'),
        }),
        ('تصویر', {
            'fields': ('thumbnail', 'preview_thumbnail'),
            'classes': ('wide',),
        }),
        ('تاریخ‌ها', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('wide', 'collapse'),
        }),
        ('شناسه', {
            'fields': ('id',),
            'classes': ('wide', 'collapse'),
        }),
    )
    
    def short_id(self, obj):
        """نمایش خلاصه UUID"""
        return str(obj.id)[:8] + '...'
    short_id.short_description = 'شناسه'
    
    def preview_thumbnail(self, obj):
        """پیش‌نمایش تصویر بندانگشتی"""
        if obj.thumbnail:
            return f'<img src="{obj.thumbnail.url}" style="max-height: 100px; max-width: 200px;" />'
        return 'بدون تصویر'
    preview_thumbnail.allow_tags = True
    preview_thumbnail.short_description = 'پیش‌نمایش'
    
    def get_queryset(self, request):
        """بهینه‌سازی کوئری با select_related"""
        return super().get_queryset(request).select_related('owner')