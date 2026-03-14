import apiClient from "./apiClient";


export const fetchApartmentsWithFilters = async (params) => {
  return await apiClient.get("/apartments/search/filter", params);
};

export const getApartmentsByResidentEmail = async (email) => {
  return await apiClient.get(`/apartments/resident/${email}`);
};

export const getApartmentById = async (id) => {
  return await apiClient.get(`/apartments/${id}`);
};