import axiosClient from "./axiosClient";

export const apartmentApi = {
    getAll: () => axiosClient.get("/apartments"),
};

const BASE_URL = "http://localhost:8080/building-management/api";

export const fetchApartmentsByBuilding = async (buildingId) => {
  const res = await fetch(`${BASE_URL}/apartments/building/${buildingId}`);
  return await res.json();
};
