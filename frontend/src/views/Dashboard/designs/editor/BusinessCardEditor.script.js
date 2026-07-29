import { ref, computed } from "vue"
import { useRoute } from "vue-router"

import Sidebar from "../../../../components/dashboard/layout/Sidebar.vue"
import BusinessCardEditorPro from "../../../../components/editor/BusinessCardEditorPro.vue"

export default {

  components: {
    Sidebar,
    BusinessCardEditorPro
  },

  setup() {

    const route = useRoute()

    const isSidebarCollapsed = ref(false)

    const toggleSidebar = () => {
      isSidebarCollapsed.value = !isSidebarCollapsed.value
    }

    const designId = computed(() => {
      return route.params.id
    })

    return {
      isSidebarCollapsed,
      toggleSidebar,
      designId
    }

  }

}
