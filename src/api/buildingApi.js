const BASE_URL = "http://localhost:8080/building-management/api";

export const fetchBuildings = async (page = 0, size = 10, search = "") => {
  const params = new URLSearchParams({
    page,
    size,
    ...(search && { search }),
  });

  const res = await fetch(`${BASE_URL}/buildings?${params}`);
  return await res.json();
};


export const fetchAllBuildings = async () => {
  const res = await fetch(`${BASE_URL}/buildings/all`);
  return await res.json();
};


export const fetchBuildingById = async (id) => {
  const res = await fetch(`${BASE_URL}/buildings/${id}`);
  return await res.json();
};


export const createBuilding = async (data) => {
  const res = await fetch(`${BASE_URL}/buildings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return await res.json();
};


export const updateBuilding = async (id, data) => {
  const res = await fetch(`${BASE_URL}/buildings/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return await res.json();
};


export const deleteBuilding = async (id) => {
  const res = await fetch(`${BASE_URL}/buildings/${id}`, {
    method: "DELETE",
  });

  return await res.json();
};


export const generateApartments = async (id) => {
  const res = await fetch(`${BASE_URL}/buildings/${id}/generate-apartments`, {
    method: "POST",
  });

  return await res.json();
};


export const checkBuildingCode = async (code, excludeId = null) => {
  const params = new URLSearchParams();
  if (excludeId) params.append("excludeId", excludeId);

  const res = await fetch(
    `${BASE_URL}/buildings/check-code/${code}?${params}`
  );

  return await res.json();
};


export const checkBuildingName = async (name, excludeId = null) => {
  const params = new URLSearchParams();
  if (excludeId) params.append("excludeId", excludeId);

  const res = await fetch(
    `${BASE_URL}/buildings/check-name/${name}?${params}`
  );

  return await res.json();
};