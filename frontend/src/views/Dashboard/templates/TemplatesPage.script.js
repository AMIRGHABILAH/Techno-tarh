import { ref, onMounted } from 'vue'
import MainLayout from '../../../components/dashboard/layout/MainLayout.vue'
import api from '../../../services/axios'
import { useRouter } from 'vue-router'

export default {
  components: {
    MainLayout
  },

  setup() {
    const router = useRouter()

    const templates = ref([])
    const loading = ref(true)

    const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

    onMounted(async () => {
      try {
        const res = await api.get('/designs/dashboard/templates/')
        console.log('TEMPLATES RESPONSE:', res.data)
        templates.value = res.data
      } catch (err) {
        console.error("خطا در دریافت قالب‌ها:", err)
      } finally {
        loading.value = false
      }
    })

    // باز کردن قالب در ادیتور (بدون کپی - فقط نمایش)
    const openTemplate = (template) => {
      // مستقیم به ادیتور برو با پارامتر template
      // template=true یعنی فقط قالب رو نشون بده، کپی نکن
      router.push({
        path: '/editor',
        query: {
          template: template.id,
          name: template.name || 'طراحی جدید'
        }
      })
    }

    const formatDate = (dateStr) => {
      if (!dateStr) return 'نامشخص'
      
      const d = new Date(dateStr)
      const now = new Date()
      const diffTime = Math.abs(now - d)
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      if (diffDays === 0) return 'امروز'
      if (diffDays === 1) return 'دیروز'
      if (diffDays < 7) return `${diffDays} روز پیش`
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} هفته پیش`
      if (diffDays < 365) return `${Math.floor(diffDays / 30)} ماه پیش`
      
      return new Intl.DateTimeFormat('fa-IR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(d)
    }

    const getThumbnail = (tpl) => {
      if (!tpl.thumbnail_url) return null
      if (tpl.thumbnail_url.startsWith('http')) {
        return tpl.thumbnail_url
      }
      return API_BASE + tpl.thumbnail_url
    }

    const getTemplateSize = (tpl) => {
      if (tpl.data?.attrs) {
        return `${Math.round(tpl.data.attrs.width)}×${Math.round(tpl.data.attrs.height)}`
      }
      return '1080×1080'
    }

    return {
      templates,
      loading,
      openTemplate,
      formatDate,
      getThumbnail,
      getTemplateSize
    }
  }
}