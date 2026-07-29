
# from rest_framework import viewsets, permissions, status
# from rest_framework.decorators import action
# from rest_framework.response import Response
# from django.utils import timezone
# from datetime import timedelta

# from .models import Design
# from .serializers import (
#     DesignSerializer,
#     DashboardStatsSerializer,
#     RecentDesignSerializer
# )
# from .permissions import IsOwnerOrTemplateReadOnly
# from django.db.models import Q

# from finance.models import Wallet, Transaction
# from rest_framework.exceptions import ValidationError
# import logging
# from decimal import Decimal
# from finance.models import Wallet, Transaction
# from django.db import transaction
# from django.core.files.base import ContentFile
# import os
# finance_logger = logging.getLogger("finance")


# class DesignViewSet(viewsets.ModelViewSet):
#     serializer_class = DesignSerializer
#     permission_classes = [permissions.IsAuthenticated, IsOwnerOrTemplateReadOnly]

#     # -------------------------------------------------
#     # Queryset
#     # -------------------------------------------------


#     def get_queryset(self):
#         user = self.request.user
#         # نشان دادن همه طرح ها در پنل های ادمین
#         # if user.is_staff:
#         #     return Design.objects.all()

#         # برای duplicate باید template هم دیده شود
#         if self.action == "duplicate":
#             return Design.objects.filter(
#                 Q(owner=user) | Q(is_template=True)
#             )

#         # لیست طراحی‌های کاربر
#         if self.action in ["list", "retrieve"]:
#             return Design.objects.filter(owner=user)

#         return Design.objects.filter(owner=user)


#     # -------------------------------------------------
#     # Create Design
#     # -------------------------------------------------

#     def perform_create(self, serializer):
#         serializer.save(owner=self.request.user)



#     # =================================================
#     # Dashboard APIs
#     # =================================================

#     @action(detail=False, methods=['get'], url_path='dashboard/stats')
#     def dashboard_stats(self, request):
#         """آمار داشبرد کاربر"""

#         user = request.user

#         total_designs = Design.objects.filter(owner=user).count()

#         templates_count = Design.objects.filter(is_template=True).count()

#         week_ago = timezone.now() - timedelta(days=7)

#         recent_designs = Design.objects.filter(
#             owner=user,
#             updated_at__gte=week_ago
#         ).count()

#         # محاسبه حجم مصرفی
#         total_size = 0

#         for design in Design.objects.filter(owner=user):

#             if design.thumbnail:
#                 try:
#                     total_size += design.thumbnail.size
#                 except:
#                     pass

#         used_storage_mb = round(total_size / (1024 * 1024), 2)

#         plan_type = getattr(user, 'plan', 'free')

#         stats = {
#             "total_designs": total_designs,
#             "templates_count": templates_count,
#             "recent_designs_count": recent_designs,
#             "used_storage": used_storage_mb,
#             "plan_type": plan_type,
#         }

#         serializer = DashboardStatsSerializer(stats)

#         return Response(serializer.data)

#     # -------------------------------------------------

#     @action(detail=False, methods=['get'], url_path='dashboard/recent')
#     def recent_designs(self, request):
#         """۶ طراحی آخر کاربر"""

#         user = request.user

#         recent = Design.objects.filter(
#             owner=user
#         ).order_by('-updated_at')[:6]

#         serializer = RecentDesignSerializer(recent, many=True)

#         return Response(serializer.data)

#     # -------------------------------------------------

#     @action(detail=False, methods=['get'], url_path='dashboard/templates')
#     def popular_templates(self, request):
#         """قالب‌های محبوب"""

#         templates = Design.objects.filter(
#             is_template=True
#         ).order_by('-updated_at')[:4]

#         serializer = RecentDesignSerializer(templates, many=True)

#         return Response(serializer.data)

#     # -------------------------------------------------

#     @action(detail=False, methods=['get'], url_path='dashboard/activity')
#     def recent_activity(self, request):
#         """فعالیت‌های اخیر کاربر"""

#         user = request.user

#         recent = Design.objects.filter(
#             owner=user
#         ).order_by('-updated_at')[:5]

#         activity = []

#         for design in recent:

#             activity.append({
#                 "id": design.id,
#                 "type": "edit",
#                 "design_name": design.name,
#                 "timestamp": design.updated_at,
#                 "message": f'طراحی "{design.name}" را ویرایش کردید'
#             })

#         return Response(activity)

#     # =================================================
#     # Duplicate Template
#     # =================================================

 

#     @action(detail=True, methods=["post"], url_path="duplicate")
#     def duplicate(self, request, pk=None):

#         original = self.get_object()

#         if not original.is_template and original.owner != request.user:
#             return Response({"detail": "Not allowed"}, status=403)

#         # ----------------------------------------------------
#         # 1) کپی کردن فایل thumbnail (در صورت وجود)
#         # ----------------------------------------------------
#         new_thumbnail = None

#         if original.thumbnail:
#             # خواندن محتوا
#             original_thumb = original.thumbnail
#             original_thumb.open("rb")
#             file_data = original_thumb.read()
#             original_thumb.close()

#             # ساخت نام جدید
#             base, ext = os.path.splitext(original_thumb.name)
#             new_name = f"{base}_copy_{request.user.id}{ext}"

#             # ساخت فایل جدید
#             new_thumbnail = ContentFile(file_data, name=os.path.basename(new_name))

#         # ----------------------------------------------------
#         # 2) ساختن طرح جدید با thumbnail کپی شده
#         # ----------------------------------------------------
#         new_design = Design.objects.create(
#             name=f"Copy of {original.name}",
#             owner=request.user,
#             data=original.data,
#             thumbnail=new_thumbnail,     # ← این‌بار واقعی و امن
#             is_template=False
#         )

#         # ----------------------------------------------------
#         # 3) عملیات مالی
#         # ----------------------------------------------------
#         price = Decimal("11500.00")
#         wallet, created = Wallet.objects.get_or_create(user=request.user)

#         if wallet.balance < price:
#             raise ValidationError({"detail": "موجودی کیف پول کافی نیست"})

#         with transaction.atomic():
#             wallet.balance -= price
#             wallet.save(update_fields=["balance"])
#             Transaction.objects.create(
#                 user=request.user,
#                 amount=price,
#                 type="usage",
#                 description=f"هزینه ساخت طرح از قالب {original.name}"
#             )

#         serializer = self.get_serializer(new_design)
#         return Response(serializer.data, status=201)

#     @action(detail=True, methods=["post"], url_path="charge-save")
#     def charge_save(self, request, pk=None):

#         design = self.get_object()
#         user = request.user

#         from decimal import Decimal
#         price = Decimal('11500.00')


#         wallet, created = Wallet.objects.get_or_create(user=user)

#         if wallet.balance < price:
#             raise ValidationError({"detail": "موجودی کیف پول کافی نیست"})

#         # کسر مبلغ
#         wallet.balance -= price
#         wallet.save()

#         # ثبت تراکنش
#         Transaction.objects.create(
#             user=user,
#             amount=price,
#             type="usage",
#             description=f"هزینه ساخت کارت جدید {design.name}"
#         )

#         return Response({
#             "detail": "هزینه ذخیره طرح کسر شد",
#             "balance": wallet.balance
#         })


# designs/views.py

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta
from django.db.models import Q
from django.db import transaction
from django.core.files.base import ContentFile
import os
import json
import logging
from decimal import Decimal

from .models import Design
from .serializers import (
    DesignSerializer,
    DashboardStatsSerializer,
    RecentDesignSerializer
)
from .permissions import IsOwnerOrTemplateReadOnly
from finance.models import Wallet, Transaction
from rest_framework.exceptions import ValidationError

# برای PSD
from psd_tools import PSDImage
from django.core.files.storage import default_storage
import base64
from io import BytesIO
from PIL import Image

finance_logger = logging.getLogger("finance")


class DesignViewSet(viewsets.ModelViewSet):
    serializer_class = DesignSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrTemplateReadOnly]

    # -------------------------------------------------f
    # Queryset
    # -------------------------------------------------
    def get_queryset(self):
        user = self.request.user

        if self.action == "duplicate":
            return Design.objects.filter(
                Q(owner=user) | Q(is_template=True)
            )

        if self.action in ["list", "retrieve"]:
            return Design.objects.filter(owner=user)

        return Design.objects.filter(owner=user)

    # -------------------------------------------------
    # Create Design
    # -------------------------------------------------
    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    # =================================================
    # Dashboard APIs
    # =================================================
    @action(detail=False, methods=['get'], url_path='dashboard/stats')
    def dashboard_stats(self, request):
        user = request.user

        total_designs = Design.objects.filter(owner=user).count()
        templates_count = Design.objects.filter(is_template=True).count()

        week_ago = timezone.now() - timedelta(days=7)
        recent_designs = Design.objects.filter(
            owner=user,
            updated_at__gte=week_ago
        ).count()

        total_size = 0
        for design in Design.objects.filter(owner=user):
            if design.thumbnail:
                try:
                    total_size += design.thumbnail.size
                except:
                    pass

        used_storage_mb = round(total_size / (1024 * 1024), 2)
        plan_type = getattr(user, 'plan', 'free')

        stats = {
            "total_designs": total_designs,
            "templates_count": templates_count,
            "recent_designs_count": recent_designs,
            "used_storage": used_storage_mb,
            "plan_type": plan_type,
        }

        serializer = DashboardStatsSerializer(stats)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='dashboard/recent')
    def recent_designs(self, request):
        user = request.user
        recent = Design.objects.filter(owner=user).order_by('-updated_at')[:6]
        serializer = RecentDesignSerializer(recent, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='dashboard/templates')
    def popular_templates(self, request):
        templates = Design.objects.filter(is_template=True).order_by('-updated_at')
        serializer = RecentDesignSerializer(templates, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='dashboard/activity')
    def recent_activity(self, request):
        user = request.user
        recent = Design.objects.filter(owner=user).order_by('-updated_at')[:5]

        activity = []
        for design in recent:
            activity.append({
                "id": design.id,
                "type": "edit",
                "design_name": design.name,
                "timestamp": design.updated_at,
                "message": f'طراحی "{design.name}" را ویرایش کردید'
            })

        return Response(activity)

    # =================================================
    # Duplicate Template
    # =================================================
    @action(detail=True, methods=["post"], url_path="duplicate")
    def duplicate(self, request, pk=None):
        original = self.get_object()

        if not original.is_template and original.owner != request.user:
            return Response({"detail": "Not allowed"}, status=403)

        new_thumbnail = None
        if original.thumbnail:
            original_thumb = original.thumbnail
            original_thumb.open("rb")
            file_data = original_thumb.read()
            original_thumb.close()

            base, ext = os.path.splitext(original_thumb.name)
            new_name = f"{base}_copy_{request.user.id}{ext}"
            new_thumbnail = ContentFile(file_data, name=os.path.basename(new_name))

        new_design = Design.objects.create(
            name=f"Copy of {original.name}",
            owner=request.user,
            data=original.data,
            thumbnail=new_thumbnail,
            is_template=False
        )

        price = Decimal("11500.00")
        wallet, created = Wallet.objects.get_or_create(user=request.user)

        if wallet.balance < price:
            raise ValidationError({"detail": "موجودی کیف پول کافی نیست"})

        with transaction.atomic():
            wallet.balance -= price
            wallet.save(update_fields=["balance"])
            Transaction.objects.create(
                user=request.user,
                amount=price,
                type="usage",
                description=f"هزینه ساخت طرح از قالب {original.name}"
            )

        serializer = self.get_serializer(new_design)
        return Response(serializer.data, status=201)

    @action(detail=True, methods=["post"], url_path="charge-save")
    def charge_save(self, request, pk=None):
        design = self.get_object()
        user = request.user

        price = Decimal('11500.00')
        wallet, created = Wallet.objects.get_or_create(user=user)

        if wallet.balance < price:
            raise ValidationError({"detail": "موجودی کیف پول کافی نیست"})

        wallet.balance -= price
        wallet.save()

        Transaction.objects.create(
            user=user,
            amount=price,
            type="usage",
            description=f"هزینه ساخت کارت جدید {design.name}"
        )

        return Response({
            "detail": "هزینه ذخیره طرح کسر شد",
            "balance": wallet.balance
        })


# =================================================
# آپلود PSD
# =================================================
import traceback

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def upload_psd(request):
    if 'psd_file' not in request.FILES:
        return Response({'error': 'فایل PSD ارسال نشده است'}, status=400)
    
    psd_file = request.FILES['psd_file']
    
    try:
        temp_path = default_storage.save(f'temp/{psd_file.name}', psd_file)
        full_path = default_storage.path(temp_path)
        
        print(f"📁 File saved to: {full_path}")
        
        psd = PSDImage.open(full_path)
        
        layers_data = []
        
        def extract_layers(layer):
            """استخراج بازگشتی لایه‌ها با موقعیت مطلق"""
            if not hasattr(layer, 'visible') or not layer.visible:
                return
            
            # ✅ موقعیت مطلق لایه (نسبت به کل PSD)
            bbox = layer.bbox
            if hasattr(bbox, 'x1'):
                left = bbox.x1
                top = bbox.y1
                width = bbox.width
                height = bbox.height
            else:
                left = bbox[0]
                top = bbox[1]
                width = bbox[2] - bbox[0]
                height = bbox[3] - bbox[1]
            
            layer_info = {
                'name': getattr(layer, 'name', 'لایه'),
                'visible': getattr(layer, 'visible', True),
                'left': round(left, 1),
                'top': round(top, 1),
                'width': round(width, 1),
                'height': round(height, 1),
                'opacity': layer.opacity / 255.0 if hasattr(layer, 'opacity') else 1.0,
                'kind': layer.kind if hasattr(layer, 'kind') else 'pixel',
            }
            
            if layer.is_group():
                layer_info['children'] = []
                for child in layer:
                    child_data = extract_layers(child)
                    if child_data:
                        layer_info['children'].append(child_data)
                layers_data.append(layer_info)
            else:
                try:
                    layer_image = layer.composite()
                    buffer = BytesIO()
                    layer_image.save(buffer, format='PNG')
                    img_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
                    layer_info['image_base64'] = f"data:image/png;base64,{img_base64}"
                except Exception as e:
                    print(f"Error exporting layer {layer_info['name']}: {e}")
                    layer_info['image_base64'] = None
                
                if hasattr(layer, 'kind') and layer.kind == 'type':
                    try:
                        layer_info['text'] = layer.text
                        engine_dict = layer.engine_dict if hasattr(layer, 'engine_dict') else {}
                        layer_info['font_size'] = engine_dict.get('FontSize', 24)
                        layer_info['font_name'] = engine_dict.get('FontName', 'Arial')
                        
                        if 'TextColor' in engine_dict:
                            color = engine_dict['TextColor']
                            if 'Values' in color:
                                vals = color['Values']
                                if len(vals) >= 3:
                                    layer_info['font_color'] = f"rgb({int(vals[0])}, {int(vals[1])}, {int(vals[2])})"
                    except:
                        pass
                
                layers_data.append(layer_info)
        
        for layer in psd:
            extract_layers(layer)
        
        result = {'width': psd.width, 'height': psd.height, 'layers': layers_data}
        
        if os.path.exists(full_path):
            os.remove(full_path)
        
        return Response(result)
        
    except Exception as e:
        print("❌ PSD Error:", traceback.format_exc())
        try:
            if os.path.exists(full_path):
                os.remove(full_path)
        except:
            pass
        
        return Response({'error': str(e)}, status=500)