import axiosClient from "./axiosClient";

const maintenanceApi = {
  // Requests
  getRequests: (params = {}) =>
    axiosClient.get("/maintenance-requests", { params }),

  getRequestById: (id) =>
    axiosClient.get(`/maintenance-requests/${id}`),

  assignRequest: (id, data) =>
    axiosClient.patch(`/maintenance-requests/${id}/assign`, data),

  cancelRequest: (id, data) =>
    axiosClient.patch(`/maintenance-requests/${id}/cancel`, data),

  // Statistics
  getStatistics: (params = {}) =>
    axiosClient.get("/maintenance/statistics/statistics", { params }),

  getStaffWorkload: () =>
    axiosClient.get("/maintenance/statistics/staff-workload"),

  getOverdueRequests: () =>
    axiosClient.get("/maintenance/statistics/overdue"),

  // Workflow
  getQuotationsByRequestId: (id) =>
    axiosClient.get(`/maintenance-requests/${id}/quotations`),

  getLogs: (id) =>
    axiosClient.get(`/maintenance-requests/${id}/logs`),
};

export default maintenanceApi;
