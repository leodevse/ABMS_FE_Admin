const BASE_URL = "http://localhost:8080/building-management/api";

const getHeaders = (isFormData = false) => {
  const token = localStorage.getItem("token");

  const headers = {};

  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
};

const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }

  return await response.json();
};

const apiClient = {
  get: async (url, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const fullUrl = queryString
      ? `${BASE_URL}${url}?${queryString}`
      : `${BASE_URL}${url}`;

    const response = await fetch(fullUrl, {
      method: "GET",
      headers: getHeaders(),
    });

    return handleResponse(response);
  },

  post: async (url, data, isFormData = false) => {
    const response = await fetch(`${BASE_URL}${url}`, {
      method: "POST",
      headers: getHeaders(isFormData),
      body: isFormData ? data : JSON.stringify(data),
    });

    return handleResponse(response);
  },

  put: async (url, data) => {
    const response = await fetch(`${BASE_URL}${url}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });

    return handleResponse(response);
  },

  patch: async (url, data) => {
    const response = await fetch(`${BASE_URL}${url}`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });

    return handleResponse(response);
  },

  delete: async (url) => {
    const response = await fetch(`${BASE_URL}${url}`, {
      method: "DELETE",
      headers: getHeaders(),
    });

    return handleResponse(response);
  },
};

export default apiClient;