from rest_framework.routers import DefaultRouter
from .views import DesignViewSet

router = DefaultRouter()
router.register(r'designs', DesignViewSet, basename='design')

urlpatterns = router.urls


# designs/urls.py
