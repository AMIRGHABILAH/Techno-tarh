import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import MainLayout from '../../../components/dashboard/layout/MainLayout.vue'
import { useDesignStore } from '../../../stores/design.store'
import api from '../../../services/axios'
import DesignCard from '../../../components/design/DesignCard.vue'
import ModalDialog from '../../../components/common/ModalDialog.vue'

export default {

  components: {
    MainLayout,
    DesignCard,
    ModalDialog
  },

  setup() {

    const router = useRouter()
    const store = useDesignStore()

    const showCreateModal = ref(false)
    const templates = ref([])

    const searchQuery = ref('')
    const activeFilter = ref('all')
    const showDeleteDialog = ref(false)
    const showCreateDialog = ref(false)
    const designToDelete = ref(null)
    const newDesignName = ref('')
    const selectedTemplate = ref('')

    const filteredDesigns = computed(() => {

      let designs = store.designs

      if (activeFilter.value === 'personal') {
        designs = store.personalDesigns
      }

      else if (activeFilter.value === 'templates') {
        designs = store.templates
      }

      if (searchQuery.value) {

        const query = searchQuery.value.toLowerCase().trim()

        designs = designs.filter(d =>
          d.name?.toLowerCase().includes(query)
        )
      }

      return designs

    })


    watch(activeFilter, (newFilter) => {

      store.setFilters({
        is_template:
          newFilter === 'templates'
            ? true
            : newFilter === 'personal'
            ? false
            : null
      })

    })


    const setFilter = (filter) => {
      activeFilter.value = filter
    }


    const handleSearch = () => {

      clearTimeout(window.searchTimeout)

      window.searchTimeout = setTimeout(() => {

        store.setFilters({
          search: searchQuery.value
        })

      }, 300)

    }


    const clearSearch = () => {

      searchQuery.value = ''

      store.setFilters({
        search: ''
      })

    }


    const openDesign = (id) => {
      router.push(`/editor/${id}`)
    }


    const openCreateModal = () => {

      newDesignName.value = ''
      selectedTemplate.value = ''
      showCreateDialog.value = true

    }


    const createNewDesign = () => {
    router.push("/editor/new")
  }



    const createDesign = () => {
      // if (!newDesignName.value.trim()) {
      //   alert("نام کارت را وارد کنید");
      //   return;
      // }

      showCreateModal.value = false;

      router.push({
        path: "/editor/new",
        query: {
          name: newDesignName.value,
          template: selectedTemplate.value || "",
        },
      });
    };



    const duplicateDesign = async (design) => {

      try {

        await store.duplicateDesign(design.id)

      }

      catch (error) {

        console.error('Error duplicating design:', error)

      }

    }


    const confirmDelete = (design) => {

      designToDelete.value = design
      showDeleteDialog.value = true

    }


    const deleteDesign = async () => {

      if (!designToDelete.value) return

      try {

        await store.deleteDesign(designToDelete.value.id)

        showDeleteDialog.value = false
        designToDelete.value = null

      }

      catch (error) {

        console.error('Error deleting design:', error)

      }

    }


    onMounted(() => {

      store.fetchDesigns()

    })


    return {

      showCreateModal,
      templates,
      searchQuery,
      activeFilter,
      showDeleteDialog,
      showCreateDialog,
      designToDelete,
      newDesignName,
      selectedTemplate,
      filteredDesigns,

      setFilter,
      handleSearch,
      clearSearch,
      openDesign,
      openCreateModal,
      createNewDesign,
      createDesign,
      duplicateDesign,
      confirmDelete,
      deleteDesign,

      store

    }

  }

}
