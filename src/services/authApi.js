const BASE_URL = "http://localhost:8080/building-management/api";

const getHeaders = (token = null) => {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
};

const handleResponse = async (res) => {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Lỗi hệ thống: ${res.status}`);
  }
  return res.json();
};

export const signIn = async (email, password) => {
  const res = await fetch(`${BASE_URL}/auth/signin`, {
    method: "POST",
    headers: getHeaders(), 
    body: JSON.stringify({ email, password }),
  });
  return handleResponse(res);
};

export const getMyProfile = async (token) => {
  const res = await fetch(`${BASE_URL}/users/me`, {
    method: "GET",
    headers: getHeaders(token),
  });
  return handleResponse(res);
};