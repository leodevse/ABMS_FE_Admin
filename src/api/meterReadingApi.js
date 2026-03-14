import axiosClient from "./axiosClient";

export const meterReadingApi = {
    // ── Tìm kiếm (phân trang) ──────────────────────────────────
    search: (params) => axiosClient.get("/meter-readings", { params }),
    // params: { apartmentId, serviceId, period, status, page, size }

    // ── Lấy theo kỳ + service ──────────────────────────────────
    getByPeriod: (period, serviceId) =>
        axiosClient.get(`/meter-readings/by-period/${period}`, {
            params: serviceId ? { serviceId } : {},
        }),

    // ── Lấy by apartment ───────────────────────────────────────
    getByApartment: (apartmentId, serviceId) =>
        axiosClient.get(`/meter-readings/by-apartment/${apartmentId}`, {
            params: serviceId ? { serviceId } : {},
        }),

    // ── Old index gợi ý ────────────────────────────────────────
    getOldIndex: (apartmentId, serviceId, period) =>
        axiosClient.get("/meter-readings/old-index", {
            params: { apartmentId, serviceId, period },
        }),

    // ── Tạo mới (multipart – data JSON string + optional photo) ─
    create: (data, photo = null) => {
        const formData = new FormData();
        formData.append("data", JSON.stringify(data));
        if (photo) formData.append("photo", photo);
        return axiosClient.post("/meter-readings", formData, {
            headers: { "Content-Type": "multipart/form-data" }
        });
    },

    // ── Cập nhật (multipart) ───────────────────────────────────
    update: (id, data, photo = null) => {
        const formData = new FormData();
        formData.append("data", JSON.stringify(data));
        if (photo) formData.append("photo", photo);
        return axiosClient.put(`/meter-readings/${id}`, formData, {
            headers: { "Content-Type": "multipart/form-data" }
        });
    },

    delete: (id) => axiosClient.delete(`/meter-readings/${id}`),

    // ── Status workflow ────────────────────────────────────────
    confirm: (id) => axiosClient.patch(`/meter-readings/${id}/confirm`),
    lock: (id) => axiosClient.patch(`/meter-readings/${id}/lock`),

    // ── Stats / summary ────────────────────────────────────────
    getPeriodSummary: (period) =>
        axiosClient.get(`/meter-readings/summary/${period}`),

    countByPeriodAndStatus: (period, status) =>
        axiosClient.get("/meter-readings/stats/count", { params: { period, status } }),
};
