import api from "./axios";

export default {
  getWallet() {
    return api.get("/finance/wallet/");
  },

  chargeWallet(amount) {
    return api.post("/finance/wallet/charge/", { amount });
  },

  getTransactions() {
    return api.get("/finance/wallet/transactions/");
  },
  createZarinpalPayment(amount) {
  return axios.post("/api/finance/zarinpal/request/", { amount });
}

};
