
// export default {
//   name: "LandingPage",

//   setup() {

//     const submitContact = () => {
//       alert("پیام ارسال شد")
//     }

//     return {
//       submitContact
//     }
//   }
// }


import { useAuthStore } from "../../../stores/auth"
import { computed } from "vue"

export default {
  setup() {
    const auth = useAuthStore()

    const isLoggedIn = computed(() => auth.isAuthenticated)

    const scrollTo = (id) => {
      const el = document.getElementById(id)
      if (el) {
        el.scrollIntoView({
          behavior: "smooth",
          block: "start"
        })
      }
    }

    return {
      isLoggedIn,
      scrollTo
    }
  }
}