import axiosClient from "./axiosClient";

// ─── SERVICE CRUD ───────────────────────────────────────────
export const serviceApi = {
    getAll: (activeOnly = false) =>
        axiosClient.get("/services", { params: { activeOnly } }),

    getById: (id, includeTariffs = false) =>
        axiosClient.get(`/services/${id}`, { params: { includeTariffs } }),

    create: (data) => axiosClient.post("/services", data),

    update: (id, data) => axiosClient.put(`/services/${id}`, data),

    delete: (id) => axiosClient.delete(`/services/${id}`),

    activate: (id) => axiosClient.patch(`/services/${id}/activate`),

    deactivate: (id) => axiosClient.patch(`/services/${id}/deactivate`),
};

// ─── TARIFF MANAGEMENT ──────────────────────────────────────
export const tariffApi = {
    getTariffs: (serviceId) =>
        axiosClient.get(`/services/${serviceId}/tariffs`),

    getCurrentTariff: (serviceId) =>
        axiosClient.get(`/services/${serviceId}/tariffs/current`),

    addTariff: (serviceId, data) =>
        axiosClient.post(`/services/${serviceId}/tariffs`, data),

    updateTariff: (serviceId, tariffId, data) =>
        axiosClient.put(`/services/${serviceId}/tariffs/${tariffId}`, data),

    deleteTariff: (tariffId) =>
        axiosClient.delete(`/tariffs/${tariffId}`),
};
