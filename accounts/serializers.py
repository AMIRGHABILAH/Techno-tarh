# accounts/serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password

User = get_user_model()

# class RegisterSerializer(serializers.ModelSerializer):
#     password = serializers.CharField(
#         write_only=True,
#         required=True,
#         validators=[validate_password],
#         style={'input_type': 'password'}
#     )
#     password2 = serializers.CharField(
#         write_only=True,
#         required=True,
#         label="تکرار رمز عبور",
#         style={'input_type': 'password'}
#     )
#     phone_number = serializers.CharField(required=True)
#     class Meta:
#         model = User
#         fields = [
#             'username', 
#             'email', 
#             'company', 
#             'phone_number',
#             'password', 
#             'password2'
#         ]
#         extra_kwargs = {
#             'email': {'required': True},
#             'company': {'required': False}
#         }

#     def validate(self, attrs):
#         if attrs['password'] != attrs['password2']:
#             raise serializers.ValidationError({
#                 "password": "رمز عبور و تکرار آن مطابقت ندارند."
#             })
#         return attrs

#     def create(self, validated_data):
#         # حذف password2 از داده‌ها
#         validated_data.pop('password2')
        
#         # ایجاد کاربر جدید
#         user = User.objects.create_user(
#             username=validated_data['username'],
#             email=validated_data['email'],
#             company=validated_data.get('company', ''),
#             phone_number=validated_data.get('phone_number'),
#             password=validated_data['password']
#         )
        
#         return user
    
class RegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('phone_number', 'password')
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        phone = validated_data['phone_number']
        username = f"USR{phone}"
        user = User(username=username, phone_number=phone)
        user.set_password(validated_data['password'])
        user.save()
        return user

  
# class UserSerializer(serializers.ModelSerializer):

#     avatar_url = serializers.SerializerMethodField()

#     class Meta:
#         model = User
#         fields = [
#             "id",
#             "username",
#             "email",
#             "first_name",
#             "last_name",
#             "company",
#             "avatar",      # ← varchar field
#             "avatar_url"
#         ]

#         read_only_fields = ["id", "username"]

#     def get_avatar_url(self, obj):
#         """تولید URL کامل آواتار—پشتیبانی از ImageField و رشته‌های URL"""
#         if not obj.avatar:
#             return None

#         request = self.context.get("request")

#         # اگر avatar یک فایل است (ImageFieldFile)
#         if hasattr(obj.avatar, 'url'):
#             return request.build_absolute_uri(obj.avatar.url)

#         # اگر avatar رشته است (مثل URL کامل)
#         if isinstance(obj.avatar, str):
#             if obj.avatar.startswith("http"):
#                 return obj.avatar
#             else:
#                 # فرض بر اینکه مسیر نسبی است
#                 return request.build_absolute_uri("/media/" + obj.avatar)

#         return None  # حالت نادرست
#     def update(self, instance, validated_data):
#         request = self.context.get("request")

#         # اگر درخواست حذف آواتار ارسال شده بود
#         if request.data.get("delete_avatar") == "1":
#             if instance.avatar:
#                 instance.avatar.delete(save=False)
#             instance.avatar = None

#         # آپلود فایل آواتار
#         avatar = request.FILES.get("avatar")
#         if avatar:
#             instance.avatar = avatar

#         instance.email = validated_data.get("email", instance.email)
#         instance.first_name = validated_data.get("first_name", instance.first_name)
#         instance.last_name = validated_data.get("last_name", instance.last_name)
#         instance.company = validated_data.get("company", instance.company)

#         instance.save()
#         return instance

class UserSerializer(serializers.ModelSerializer):

    avatar_url = serializers.SerializerMethodField()
    is_admin = serializers.BooleanField(source="is_superuser", read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "company",
            "phone_number",
            "avatar",
            "avatar_url",
            "is_admin"
        ]

        read_only_fields = ["id", "username", "is_admin"]

    def get_avatar_url(self, obj):
        """تولید URL کامل آواتار—پشتیبانی از ImageField و رشته‌های URL"""
        if not obj.avatar:
            return None

        request = self.context.get("request")

        if hasattr(obj.avatar, 'url'):
            return request.build_absolute_uri(obj.avatar.url)

        if isinstance(obj.avatar, str):
            if obj.avatar.startswith("http"):
                return obj.avatar
            else:
                return request.build_absolute_uri("/media/" + obj.avatar)

        return None

    def update(self, instance, validated_data):
        request = self.context.get("request")

        if request.data.get("delete_avatar") == "1":
            if instance.avatar:
                instance.avatar.delete(save=False)
            instance.avatar = None

        avatar = request.FILES.get("avatar")
        if avatar:
            instance.avatar = avatar

        instance.email = validated_data.get("email", instance.email)
        instance.first_name = validated_data.get("first_name", instance.first_name)
        instance.last_name = validated_data.get("last_name", instance.last_name)
        instance.company = validated_data.get("company", instance.company)
        instance.phone_number = validated_data.get("phone_number",instance.phone_number)

        instance.save()
        return instance


from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework.exceptions import AuthenticationFailed

class MyTokenSerializer(TokenObtainPairSerializer):

    default_error_messages = {
        "no_active_account": "شماره موبایل یا رمز عبور اشتباه است"
    }
