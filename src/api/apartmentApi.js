import axiosClient from "./axiosClient";

export const apartmentApi = {
    getAll: () => axiosClient.get("/apartments"),
};

export const fetchApartmentsByBuilding = async (buildingId) => {
    const res = await axiosClient.get(`/apartments/building/${buildingId}`);
    return res.data;
};
// Force Vite HMR to clear cache
