import apiClient from "./apiClient";

export const getApartmentsByResidentEmail = async (email) => {
  return await apiClient.get(`/apartments/resident/${email}`);
};
