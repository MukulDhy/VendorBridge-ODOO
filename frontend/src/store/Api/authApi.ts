import axios from "axios";

const BASE_URL = "http://localhost:5001/api"; // adjust prefix if different

export const api = axios.create({
    baseURL: BASE_URL,
    withCredentials: true, // send cookies if backend sets them
    headers: { "Content-Type": "application/json" },
});

// Attach accessToken from localStorage on every request
api.interceptors.request.use((config) => {
    const stored = localStorage.getItem("vb_auth");
    if (stored) {
        const parsed = JSON.parse(stored) as { accessToken?: string };
        if (parsed.accessToken) {
            config.headers.Authorization = `Bearer ${parsed.accessToken}`;
        }
    }
    return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
    (res) => res,
    async (error) => {
        const original = error.config;
        if (error.response?.status === 401 && !original._retry) {
            original._retry = true;
            try {
                const stored = localStorage.getItem("vb_auth");
                const parsed = stored ? JSON.parse(stored) : null;
                const refreshToken = parsed?.refreshToken;
                if (!refreshToken) throw new Error("No refresh token");

                const { data } = await axios.post(
                    `${BASE_URL}/auth/refresh-token`,
                    { refreshToken },
                    { withCredentials: true }
                );

                const newAccess: string = data.data.accessToken;

                // Patch stored tokens
                const updated = { ...parsed, accessToken: newAccess };
                localStorage.setItem("vb_auth", JSON.stringify(updated));

                original.headers.Authorization = `Bearer ${newAccess}`;
                return api(original);
            } catch {
                // Refresh failed — let the slice handle logout
                localStorage.removeItem("vb_auth");
                window.location.href = "/login";
            }
        }
        return Promise.reject(error);
    }
);