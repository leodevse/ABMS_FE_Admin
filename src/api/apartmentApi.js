import axiosClient from "./axiosClient";

export const apartmentApi = {
    getAll: () => axiosClient.get("/apartments"),
};
