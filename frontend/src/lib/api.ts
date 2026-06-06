import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:5002/api",
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const stored = typeof window !== "undefined" ? localStorage.getItem("vb_auth") : null;
  if (stored) {
    try {
      const { token } = JSON.parse(stored);
      if (token) config.headers.Authorization = `Bearer ${token}`;
    } catch { }
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err?.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("vb_auth");
    }
    return Promise.reject(err);
  },
);

export const fmtINR = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);