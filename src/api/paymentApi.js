import axiosClient from "./axiosClient";

const paymentApi = {
  // Tạo payment link cho hóa đơn (Resident)
  createPaymentLink: (billId) =>
    axiosClient.post(`/payments/${billId}`),

  // Lịch sử giao dịch — admin xem tất cả, resident xem của mình
  // params: { page, size, billId, status }
  getTransactions: (params = {}) =>
    axiosClient.get("/payments/transactions", { params }),

  // Admin sync lại trạng thái từ PayOS
  syncTransaction: (orderCode) =>
    axiosClient.post(`/payments/sync/${orderCode}`),

  // Admin xác nhận thủ công
  manualConfirm: (transactionId, reason) =>
    axiosClient.post(`/payments/manual-confirm/${transactionId}`, { reason }),

  // Thống kê — params: { month, year }
  getStatistics: (params = {}) =>
    axiosClient.get("/payments/statistics", { params }),
};

export default paymentApi;
