import MainLayout from "../../../../components/dashboard/layout/MainLayout.vue";
import { ref, onMounted } from "vue";
import financeService from "../../../../services/finance";

export default {
  components: {
    MainLayout
  },

  setup() {
    const amount = ref("");
    const loading = ref(false);
    const wallet = ref({});
    const walletLoaded = ref(false);
    const successMsg = ref("");
    const errorMsg = ref("");

    const formatPrice = (price) => new Intl.NumberFormat().format(price);

    const fetchWallet = async () => {
      try {
        const response = await financeService.getWallet();
        wallet.value = response.data;
      } catch (error) {
        console.error("خطا در دریافت موجودی کیف پول:", error);
      } finally {
        walletLoaded.value = true;
      }
    };

    onMounted(fetchWallet);

    const submitTopUp = async () => {
    successMsg.value = "";
    errorMsg.value = "";
    loading.value = true;

    try {
        // 1) درخواست ایجاد تراکنش در بک‌اند
        const response = await financeService.createZarinpalPayment(amount.value);

        if (response.data && response.data.url) {
        // 2) ریدایرکت کاربر به درگاه
        window.location.href = response.data.url;
        return;
        }

        throw new Error("لینک درگاه معتبر نیست");

    } catch (error) {
        console.error("Charge error:", error);
        errorMsg.value = "خطا در اتصال به درگاه پرداخت.";
    } finally {
        loading.value = false;
    }
    };


    return {
      amount,
      loading,
      wallet,
      walletLoaded,
      successMsg,
      errorMsg,
      formatPrice,
      submitTopUp
    };
  }
};
