import apiClient from "./apiClient";

export const searchUsers = async (query) => {
  return await apiClient.get(`/users/search`, { query });
};

export const assignResident = async (data) => {
  return await apiClient.post(`/apartments/assign-resident`, data);
};