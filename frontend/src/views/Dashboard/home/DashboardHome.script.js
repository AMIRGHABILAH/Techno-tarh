import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../../stores/auth'
import api from '../../../services/axios'
import MainLayout from '../../../components/dashboard/layout/MainLayout.vue'
import { useRoute } from "vue-router"

export default {
  components: {
    MainLayout
  },

  setup() {
    const route = useRoute()
    const router = useRouter()
    const auth = useAuthStore()
    const user = computed(() => auth.user)

    const loading = ref(false)
    const recentDesigns = ref([])
    const walletBalance = ref(0)
    
    // ==========================================
    // Toast Notification
    // ==========================================
    const toastMessage = ref('')
    const toastType = ref('success')
    const toastVisible = ref(false)
    let toastTimer = null

    function showToast(message, type = 'success', duration = 4000) {
      toastMessage.value = message
      toastType.value = type
      
      setTimeout(() => {
        toastVisible.value = true
      }, 20)
      
      clearTimeout(toastTimer)
      if (duration > 0) {
        toastTimer = setTimeout(() => {
          toastVisible.value = false
        }, duration)
      }
    }

    const loadWalletBalance = async () => {
      try {
        const response = await api.get('/finance/wallet/')
        walletBalance.value = response.data.balance
      } catch (error) {
        console.error('خطا در دریافت موجودی کیف پول:', error)
      }
    }

    const stats = reactive({
      totalDesigns: 0,
      templates: 0,
      recentEdits: 0,
      usedStorage: 0
    })

    const loadDesigns = async () => {
      loading.value = true
      try {
        const response = await api.get('/designs/')
        recentDesigns.value = response.data.slice(0, 6)
        stats.totalDesigns = response.data.length
        stats.templates = response.data.filter(d => d.is_template).length
        stats.recentEdits = response.data.filter(d => {
          const updated = new Date(d.updated_at)
          const now = new Date()
          const diffDays = Math.floor((now - updated) / (1000 * 60 * 60 * 24))
          return diffDays < 7
        }).length
      } catch (error) {
        console.error('خطا در لود طراحی‌ها:', error)
      } finally {
        loading.value = false
      }
    }

    const createNewDesign = () => {
      router.push("/editor/new")
    }

    const editDesign = (id) => {
      router.push(`/editor/${id}`)
    }

    const duplicateDesign = async (design) => {
      try {
        await api.post(`/designs/${design.id}/duplicate/`)
        await loadDesigns()
      } catch (error) {
        console.error('خطا در کپی:', error)
      }
    }

    const formatDate = (dateString) => {
      const date = new Date(dateString)
      return new Intl.DateTimeFormat('fa-IR', {
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date)
    }

    onMounted(() => {
      loadDesigns()
      loadWalletBalance()
      
      // ✅ بررسی Toast ذخیره شده از صفحه ادیتور
      const pendingToast = sessionStorage.getItem('pendingToast')
      if (pendingToast) {
        try {
          const { message, type, timestamp } = JSON.parse(pendingToast)
          
          // فقط Toast های کمتر از ۳۰ ثانیه قبل را نشان بده
          if (Date.now() - timestamp < 30000) {
            setTimeout(() => {
              showToast(message, type)
            }, 500)
          }
        } catch (e) {
          // ignore
        }
        sessionStorage.removeItem('pendingToast')
      }
    })

    return {
      user,
      loading,
      recentDesigns,
      stats,
      createNewDesign,
      editDesign,
      duplicateDesign,
      formatDate,
      walletBalance,
      loadWalletBalance,
      // Toast
      toastMessage,
      toastType,
      toastVisible,
      showToast,
    }
  }
}