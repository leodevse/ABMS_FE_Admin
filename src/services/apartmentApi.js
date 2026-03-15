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

export const moveOutResident = async (residentId) => {
  return await apiClient.post(`/apartments/resident/${residentId}/move-out`);
};

export const getResidencyHistoryPaged = async (apartmentId, params) => {
  return await apiClient.get(`/apartments/${apartmentId}/history`, { params });
};

export const assignResident = async (data) => {
  return await apiClient.post("/apartments/assign-resident", data);
};