import axios from "axios";

// Ưu tiên: VITE_API_BASE_URL từ .env → fallback proxy /api
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";

const axiosClient = axios.create({
    baseURL: BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
    timeout: 15000,
});

// Request interceptor – attach JWT khi có
axiosClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("abms_token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor – log lỗi rõ ràng
axiosClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem("abms_token");
            // window.location.href = "/login"; // Bật khi có auth
        }
        return Promise.reject(error);
    }
);

export default axiosClient;
