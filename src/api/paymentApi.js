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

  // Chi tiết giao dịch (admin)
  getTransactionDetail: (transactionId) =>
    axiosClient.get(`/payments/admin/transactions/${transactionId}/detail`),

  // Chi tiết hóa đơn
  getBillDetail: (billId) =>
    axiosClient.get(`/monthly-bills/${billId}`),

  // Admin xem tất cả hóa đơn — params: { status, periodCode, buildingCode, page, size }
  getAllBills: (params = {}) =>
    axiosClient.get("/monthly-bills", { params }),

  // Từ chối giao dịch (admin)
  rejectTransaction: (transactionId, reason) =>
    axiosClient.post(`/payments/admin/transactions/${transactionId}/reject`, { reason }),
};

export default paymentApi;
