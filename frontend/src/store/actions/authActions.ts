import { createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "../Api/authApi";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BackendUser {
    id: string;
    name: string;
    email: string;
    role: "ADMIN" | "PROCUREMENT_OFFICER" | "MANAGER" | "VENDOR";
    phone?: string;
    profilePicture?: string;
    isEmailVerified: boolean;
    isActive: boolean;
    profileComplete: boolean;
    lastLogin?: string;
    vendorId?: string;
    createdAt: string;
}

export interface AuthPayload {
    user: BackendUser;
    accessToken: string;
    refreshToken: string;
}

// Helper: extract data or throw a clean message
const extract = (e: unknown): string => {
    if (e && typeof e === "object" && "response" in e) {
        const err = e as { response?: { data?: { message?: string } } };
        return err.response?.data?.message ?? "Something went wrong";
    }
    return "Network error";
};

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const loginUser = createAsyncThunk<
    AuthPayload,
    { email: string; password: string }
>("auth/loginUser", async (credentials, { rejectWithValue }) => {
    try {
        const { data } = await api.post("/auth/login", credentials);
        return data.data as AuthPayload;
    } catch (e) {
        return rejectWithValue(extract(e));
    }
});

export const registerUser = createAsyncThunk<
    AuthPayload,
    { name: string; email: string; password: string; role: string }
>("auth/registerUser", async (payload, { rejectWithValue }) => {
    try {
        const { data } = await api.post("/auth/register", payload);
        return data.data as AuthPayload;
    } catch (e) {
        return rejectWithValue(extract(e));
    }
});

export const logoutUser = createAsyncThunk(
    "auth/logoutUser",
    async (_, { rejectWithValue }) => {
        try {
            await api.post("/auth/logout");
        } catch (e) {
            return rejectWithValue(extract(e));
        }
    }
);

export const getMe = createAsyncThunk<BackendUser>(
    "auth/getMe",
    async (_, { rejectWithValue }) => {
        try {
            const { data } = await api.get("/auth/me");
            return data.data.user as BackendUser;
        } catch (e) {
            return rejectWithValue(extract(e));
        }
    }
);

export const forgotPassword = createAsyncThunk<string, { email: string }>(
    "auth/forgotPassword",
    async (payload, { rejectWithValue }) => {
        try {
            const { data } = await api.post("/auth/forgot-password", payload);
            return data.message as string;
        } catch (e) {
            return rejectWithValue(extract(e));
        }
    }
);

export const resetPassword = createAsyncThunk<
    string,
    { token: string; password: string }
>("auth/resetPassword", async (payload, { rejectWithValue }) => {
    try {
        const { data } = await api.post("/auth/reset-password", payload);
        return data.message as string;
    } catch (e) {
        return rejectWithValue(extract(e));
    }
});

export const verifyEmailCode = createAsyncThunk<
    BackendUser,
    { otp: string }
>("auth/verifyEmailCode", async (payload, { rejectWithValue }) => {
    try {
        const { data } = await api.post("/auth/verify-email-code", payload);
        return data.data.user as BackendUser;
    } catch (e) {
        return rejectWithValue(extract(e));
    }
});

export const resendVerification = createAsyncThunk<string, { email: string }>(
    "auth/resendVerification",
    async (payload, { rejectWithValue }) => {
        try {
            const { data } = await api.post("/auth/resend-verification", payload);
            return data.message as string;
        } catch (e) {
            return rejectWithValue(extract(e));
        }
    }
);

export const changePassword = createAsyncThunk<
    string,
    { currentPassword: string; newPassword: string }
>("auth/changePassword", async (payload, { rejectWithValue }) => {
    try {
        const { data } = await api.put("/auth/change-password", payload);
        return data.message as string;
    } catch (e) {
        return rejectWithValue(extract(e));
    }
});