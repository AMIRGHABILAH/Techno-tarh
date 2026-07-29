# designs/serializers.py
import base64
import uuid
from django.core.files.base import ContentFile
from rest_framework import serializers
from .models import Design

# class DesignSerializer(serializers.ModelSerializer):
#     owner = serializers.HiddenField(
#         default=serializers.CurrentUserDefault()
#     )

#     class Meta:
#         model = Design
#         fields = [
#             'id',
#             'owner',
#             'name',
#             'data',
#             'thumbnail',
#             'is_template',
#             'created_at',
#             'updated_at',
#         ]
#         read_only_fields = ('id', 'created_at', 'updated_at')


# User = get_user_model()

class DashboardStatsSerializer(serializers.Serializer):
    """آمار کلی داشبرد"""
    total_designs = serializers.IntegerField()
    templates_count = serializers.IntegerField()
    recent_designs_count = serializers.IntegerField()
    used_storage = serializers.FloatField()  # به مگابایت
    plan_type = serializers.CharField()
    
    
# class RecentDesignSerializer(serializers.ModelSerializer):
#     """طراحی‌های اخیر برای نمایش در داشبرد"""
#     owner_name = serializers.CharField(source='owner.username', read_only=True)
    
#     class Meta:
#         model = Design
#         fields = ['id', 'name', 'thumbnail', 'is_template', 'updated_at', 'owner_name']




class DesignSerializer(serializers.ModelSerializer):
    owner = serializers.HiddenField(default=serializers.CurrentUserDefault())

    # دریافت Base64 از فرانت
    thumbnail_base64 = serializers.CharField(write_only=True, required=False)

    # ارسال URL کامل به فرانت
    thumbnail_url = serializers.SerializerMethodField()

    
    class Meta:
        model = Design
        fields = [
            'id',
            'owner',
            'name',
            'data',
            'thumbnail',
            'thumbnail_base64',  # فیلد جدید
            'thumbnail_url',
            'is_template',
            'created_at',
            'updated_at',
        ]

        read_only_fields = ('id', 'created_at', 'updated_at')

    def get_thumbnail_url(self, obj):
        request = self.context.get('request')

        if obj.thumbnail:
            return request.build_absolute_uri(obj.thumbnail.url) if request else obj.thumbnail.url

        return None

    def save_thumbnail(self, instance, base64_data):
        """تبدیل Base64 به فایل تصویر"""
        if not base64_data:
            return

        if ';base64,' not in base64_data:
            return

        format, imgstr = base64_data.split(';base64,')
        ext = format.split('/')[-1]

        file_name = f"thumb_{instance.id}_{uuid.uuid4().hex[:6]}.{ext}"

        file = ContentFile(base64.b64decode(imgstr), name=file_name)

        instance.thumbnail.save(file_name, file, save=False)

    def create(self, validated_data):
        thumbnail_base64 = validated_data.pop('thumbnail_base64', None)

        instance = super().create(validated_data)

        if thumbnail_base64:
            self.save_thumbnail(instance, thumbnail_base64)
            instance.save()

        return instance

    def update(self, instance, validated_data):
        thumbnail_base64 = validated_data.pop('thumbnail_base64', None)

        instance = super().update(instance, validated_data)

        if thumbnail_base64:
            self.save_thumbnail(instance, thumbnail_base64)
            instance.save()

        return instance
    
# class DesignSerializer(serializers.ModelSerializer):
#     owner = serializers.HiddenField(default=serializers.CurrentUserDefault())

#     # فرانت این را می‌فرستد → لازم
#     template = serializers.CharField(write_only=True, required=False)

#     # مدل require می‌کند → باید optional شود
#     data = serializers.JSONField(required=False)

#     thumbnail_base64 = serializers.CharField(write_only=True, required=False)
#     thumbnail_url = serializers.SerializerMethodField()

#     class Meta:
#         model = Design
#         fields = [
#             'id',
#             'owner',
#             'name',
#             'data',
#             'template',
#             'thumbnail',
#             'thumbnail_base64',
#             'thumbnail_url',
#             'is_template',
#             'created_at',
#             'updated_at',
#         ]
#         read_only_fields = ('id', 'created_at', 'updated_at')

#     # ---
#     def get_thumbnail_url(self, obj):
#         request = self.context.get('request')
#         if obj.thumbnail:
#             return request.build_absolute_uri(obj.thumbnail.url) if request else obj.thumbnail.url
#         return None

#     # ---
#     def save_thumbnail(self, instance, base64_data):
#         if not base64_data or ';base64,' not in base64_data:
#             return
#         format, imgstr = base64_data.split(';base64,')
#         ext = format.split('/')[-1]
#         file_name = f"thumb_{instance.id}_{uuid.uuid4().hex[:6]}.{ext}"
#         file = ContentFile(base64.b64decode(imgstr), name=file_name)
#         instance.thumbnail.save(file_name, file, save=False)

#     # ---
#     def create(self, validated_data):
#         validated_data.setdefault('data', {})         # ← حیاتی
#         validated_data.pop('template', None)          # ← برای perform_create
#         thumbnail_base64 = validated_data.pop('thumbnail_base64', None)

#         instance = super().create(validated_data)

#         if thumbnail_base64:
#             self.save_thumbnail(instance, thumbnail_base64)
#             instance.save()

#         return instance

#     # ---
#     def update(self, instance, validated_data):
#         validated_data.pop('template', None)
#         thumbnail_base64 = validated_data.pop('thumbnail_base64', None)

#         instance = super().update(instance, validated_data)

#         if thumbnail_base64:
#             self.save_thumbnail(instance, thumbnail_base64)
#             instance.save()

#         return instance

    
# عیناً همین منطق برای RecentDesignSerializer
class RecentDesignSerializer(serializers.ModelSerializer):
    owner_name = serializers.CharField(source='owner.username', read_only=True)
    thumbnail_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Design
        fields = ['id', 'name', 'thumbnail_url', 'is_template', 'updated_at', 'owner_name']

    def get_thumbnail_url(self, obj):
        request = self.context.get('request')
        if obj.thumbnail:
            return request.build_absolute_uri(obj.thumbnail.url) if request else obj.thumbnail.url
        return None
