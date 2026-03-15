import apiClient from "./apiClient";
//not use this to search,for apartment
export const searchUsers = async (query) => {
  return await apiClient.get(`/users/search`, { query });
};

export const assignResident = async (data) => {
  return await apiClient.post(`/apartments/assign-resident`, data);
};

export const fetchUsers = async (params) => {
  return await apiClient.get("/users", params); 
};


export const deactivateUser = async (id) => {
  const response = await apiClient.delete(`/users/${id}`);
  return response?.data ? response.data : response;
};

export const fetchRoles = async () => {
  const response = await apiClient.get("/roles");
  return response.data || response;
};

export const fetchBuildingsShort = async () => {
  const response = await apiClient.get("/buildings");
  return response.data || response;
};

export const getUserById = async (id) => {
  return await apiClient.get(`/users/${id}`);
};

export const createUser = async (data) => {
  const response = await apiClient.post("/users/create", data);
  return response.data || response;
};

export const updateUser = async (id, data) => {
  return await apiClient.put(`/users/${id}`, data);
};