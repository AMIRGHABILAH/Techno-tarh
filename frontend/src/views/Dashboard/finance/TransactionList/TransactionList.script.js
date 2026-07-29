import MainLayout from "../../../../components/dashboard/layout/MainLayout.vue"
import { ref, onMounted } from "vue";
import financeService from "../../../../services/finance";
import t from "./TransactionList.lang";



export default {
    components: { MainLayout },
    setup() {
        const transactions = ref([]);
        const loading = ref(true);

        const formatPrice = (n) => new Intl.NumberFormat().format(n);
        const formatDate = (d) => new Date(d).toLocaleDateString("fa-IR");

        const fetchTransactions = async () => {
        try {
            const res = await financeService.getTransactions();
            transactions.value = res.data;
        } catch (e) {
            console.error("خطا:", e);
        } finally {
            loading.value = false;
        }
        };

        onMounted(fetchTransactions);

        return {
        t,
        transactions,
        loading,
        formatPrice,
        formatDate,
        };
    },
};
