import apiClient from "./apiClient";


export const fetchBuildings = async (
  page = 0,
  size = 10,
  search = "",
  apartmentsGenerated = ""
) => {
  const params = { page, size };
  if (search) params.search = search;
  if (apartmentsGenerated !== "") {
    params.apartmentsGenerated = apartmentsGenerated;
  }

  return await apiClient.get("/buildings", params);
};

export const deleteBuilding = async (id) => {
  return await apiClient.delete(`/buildings/${id}`);
};

export const generateApartments = async (id) => {
  return await apiClient.post(`/buildings/${id}/generate-apartments`);
};

export const getBuildingByResidentEmail = async (email) => {
  return await apiClient.get(`/buildings/resident/${email}`);
};

export const fetchAllBuildings = async () => {
  return await apiClient.get("/buildings/all");
};

export const createBuilding = async (data) => {
  return await apiClient.post("/buildings", data);
};

export const getBuildingById = async (id) => {
  return await apiClient.get(`/buildings/${id}`);
};

export const updateBuilding = async (id, data) => {
  return await apiClient.put(`/buildings/${id}`, data);
};