import { ref, onMounted } from 'vue'
import api from '../../../services/axios'
import MainLayout from '../../../components/dashboard/layout/MainLayout.vue'

export default {

  components: {
    MainLayout
  },

  setup() {

    const activeTab = ref('account')

    const tabs = [
      { key: 'account', label: 'حساب کاربری' },
      { key: 'profile', label: 'پروفایل' },
      { key: 'security', label: 'امنیت' }
    ]


    const form = ref({
      username: '',
      email: '',
      first_name: '',
      last_name: '',
      company: '',
      phone_number: ''
    })


    const passwordForm = ref({
      current_password: '',
      new_password: '',
      confirm_password: ''
    })


    const avatarFile = ref(null)
    const avatarPreview = ref(null)
    const fileInput = ref(null)

    const defaultAvatarText = 'بدون پروفایل'
    const avatarDeleteFlag = ref(false)


    const loadUser = async () => {

      const res = await api.get('/auth/me/')

      form.value = res.data

      if (res.data.avatar_url) {
        avatarPreview.value = res.data.avatar_url
      }

    }


    const changePassword = async () => {

      if (
        passwordForm.value.new_password !==
        passwordForm.value.confirm_password
      ) {
        alert("رمز جدید و تکرار آن یکسان نیست")
        return
      }

      try {

        await api.post('/auth/change-password/', {

          current_password:
            passwordForm.value.current_password,

          new_password:
            passwordForm.value.new_password

        })

        alert("رمز عبور تغییر کرد")

        passwordForm.value = {
          current_password: '',
          new_password: '',
          confirm_password: ''
        }

      }

      catch {

        alert("رمز فعلی اشتباه است")

      }

    }


    const selectFile = () => {
      fileInput.value.click()
    }


    const handleFile = (e) => {

      const file = e.target.files[0]

      processFile(file)

    }


    const handleDrop = (e) => {

      const file = e.dataTransfer.files[0]

      processFile(file)

    }


    const processFile = (file) => {

      if (!file) return

      avatarFile.value = file

      const reader = new FileReader()

      reader.onload = (e) => {

        avatarPreview.value = e.target.result

      }

      reader.readAsDataURL(file)

    }


    const deleteAvatar = () => {

      avatarPreview.value = null
      avatarFile.value = null
      avatarDeleteFlag.value = true

    }


    const saveSettings = async () => {

      const data = new FormData()

      data.append('email', form.value.email)
      data.append('first_name', form.value.first_name)
      data.append('last_name', form.value.last_name)
      data.append('company', form.value.company)
      data.append('phone_number', form.value.phone_number)

      if (avatarFile.value) {
        data.append('avatar', avatarFile.value)
      }

      if (avatarDeleteFlag.value) {
        data.append("delete_avatar", "1")
      }

      await api.patch('/auth/me/', data, {

        headers: {
          'Content-Type': 'multipart/form-data'
        }

      })

      alert('ذخیره شد')

    }


    onMounted(loadUser)


    return {

      activeTab,
      tabs,

      form,
      passwordForm,

      avatarPreview,
      defaultAvatarText,

      fileInput,

      selectFile,
      handleFile,
      handleDrop,
      deleteAvatar,

      saveSettings,
      changePassword

    }

  }

}
