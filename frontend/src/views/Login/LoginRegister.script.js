import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import api from '../../services/axios'
import { useAuthStore } from '../../stores/auth'

export default {
  name: "LoginRegister",

  setup() {

    const router = useRouter()
    const auth = useAuthStore()

    // -------------------------
    // 🟢 اول ref ها
    // -------------------------
    const phone = ref("")
    const password = ref("")
    const otp = ref("")
    const popup = ref(null)
    const isLoading = ref(false)
    const mainError = ref("")
    const popupError = ref("")

    // -------------------------
    // 🟢 computed بعد ref ها
    // -------------------------
    const phoneRegex = /^09\d{9}$/
    const isPhoneValid = computed(() => phoneRegex.test(phone.value))

    // -------------------------
    // 🧩 متدها
    // -------------------------

    const openPopup = (name) => {
      popupError.value = ""
      popup.value = name
    }

    const closePopup = () => {
      popup.value = null
      popupError.value = ""
    }

    const getErrorMessage = (e, def) => {
      if (e.response?.data) {
        const data = e.response.data
        if (typeof data === "string") return data
        if (data.detail) return data.detail
        const key = Object.keys(data)[0]
        if (key) return data[key]
      }
      return def
    }

    const validatePhone = () => {
      if (!phone.value) {
        mainError.value = "شماره موبایل را وارد کنید"
        return false
      }
      if (!phoneRegex.test(phone.value)) {
        mainError.value = "شماره موبایل معتبر نیست"
        return false
      }
      return true
    }

    const submitPhone = async () => {
      mainError.value = ""
      popupError.value = ""

      if (!validatePhone()) return

      isLoading.value = true

      try {
        const res = await api.post("auth/check-phone/", {
          phone_number: phone.value
        })

        if (res.data.exists) {
          openPopup("password-login")
        } else {
          await api.post("auth/send-code/", {
            phone_number: phone.value
          })
          openPopup("otp")
        }

      } catch (e) {
        mainError.value = getErrorMessage(e, "خطا در اتصال به سرور")
      }

      isLoading.value = false
    }

    const passwordLogin = async () => {
      popupError.value = ""

      if (!password.value || password.value.trim().length < 1) {
        popupError.value = "رمز عبور را وارد کنید"
        return
      }

      isLoading.value = true

      try {
        const res = await api.post("auth/token/", {
          username: "USR" + phone.value,
          password: password.value
        })

        auth.setTokens(res.data.access, res.data.refresh)
        closePopup()
        router.push("/dashboard")

      } catch (e) {
        popupError.value = getErrorMessage(e, "رمز اشتباه است")
      }

      isLoading.value = false
    }

    const verifyOtp = async () => {
      popupError.value = ""
      isLoading.value = true

      try {
        const res = await api.post("auth/verify-code/", {
          phone_number: phone.value,
          code: otp.value
        })

        if (res.data.need_set_password) {
          openPopup("password-set")
        } else {
          auth.setTokens(res.data.access, res.data.refresh)
          closePopup()
          router.push("/dashboard")
        }

      } catch (e) {
        popupError.value = getErrorMessage(e, "کد تایید اشتباه است")
      }

      isLoading.value = false
    }

    const setPassword = async () => {
      popupError.value = ""

      if (!password.value || password.value.trim().length < 6) {
        popupError.value = "رمز عبور را وارد کنید (حداقل ۶ کاراکتر)"
        return
      }

      isLoading.value = true

      try {
        const res = await api.post("auth/set-password/", {
          phone_number: phone.value,
          password: password.value
        })

        auth.setTokens(res.data.access, res.data.refresh)
        closePopup()
        router.push("/dashboard")

      } catch (e) {
        popupError.value = getErrorMessage(e, "خطا در ذخیره رمز")
      }

      isLoading.value = false
    }

    const loginWithOtp = async () => {
      mainError.value = ""
      isLoading.value = true

      try {
        await api.post("auth/send-code/", { phone_number: phone.value })
        openPopup("otp")

      } catch (e) {
        mainError.value = getErrorMessage(e, "خطا در ارسال کد")
      }

      isLoading.value = false
    }

    // -------------------------
    // 🔥 مهم‌ترین بخش: RETURN
    // -------------------------
    return {
      phone,
      password,
      otp,
      popup,
      isLoading,
      mainError,
      popupError,
      isPhoneValid,
      submitPhone,
      passwordLogin,
      verifyOtp,
      setPassword,
      loginWithOtp,
      openPopup,
      closePopup
    }
  }
}
