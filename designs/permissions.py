from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsOwnerOrTemplateReadOnly(BasePermission):
    """
    - Owner می‌تواند همه کارها را انجام دهد
    - Template برای بقیه فقط خواندنی است
    - Duplicate برای template مجاز است
    """

    def has_object_permission(self, request, view, obj):

        # خواندن آزاد
        if request.method in SAFE_METHODS:
            return True

        # اجازه duplicate برای template
        if view.action == "duplicate" and obj.is_template:
            return True

        # فقط owner می‌تواند ویرایش یا حذف کند
        return obj.owner == request.user


class IsOwner(BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj.owner == request.user
