import axiosClient from "./axiosClient";

const maintenanceApi = {
  // Requests
  getRequests: (params = {}) =>
    axiosClient.get("/v1/maintenance-requests", { params }),

  getRequestById: (id) =>
    axiosClient.get(`/v1/maintenance-requests/${id}`),

  assignRequest: (id, data) =>
    axiosClient.patch(`/v1/maintenance-requests/${id}/assign`, data),

  cancelRequest: (id, data) =>
    axiosClient.patch(`/v1/maintenance-requests/${id}/cancel`, data),

  // Statistics
  getStatistics: (params = {}) =>
    axiosClient.get("/v1/maintenance-requests/statistics", { params }),

  getStaffWorkload: () =>
    axiosClient.get("/v1/maintenance-requests/staff-workload"),

  getOverdueRequests: () =>
    axiosClient.get("/v1/maintenance-requests/overdue"),

  // Workflow
  getQuotationsByRequestId: (id) =>
    axiosClient.get(`/v1/maintenance-requests/${id}/quotations`),

  getLogs: (id) =>
    axiosClient.get(`/v1/maintenance-requests/${id}/logs`),
};

export default maintenanceApi;
