import { createSlice } from "@reduxjs/toolkit";
import {
  loginUser,
  registerUser,
  logoutUser,
  getMe,
  verifyEmailCode,
  type BackendUser,
} from "../actions/authActions";

// ─── State ────────────────────────────────────────────────────────────────────

interface AuthState {
  user: BackendUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  loading: boolean;
  error: string | null;
}

const stored =
  typeof window !== "undefined" ? localStorage.getItem("vb_auth") : null;
const parsed = stored ? (JSON.parse(stored) as AuthState) : null;

const initialState: AuthState = parsed ?? {
  user: null,
  accessToken: null,
  refreshToken: null,
  loading: false,
  error: null,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const persist = (s: AuthState) => {
  if (typeof window !== "undefined")
    localStorage.setItem("vb_auth", JSON.stringify(s));
};

const clearStorage = () => {
  if (typeof window !== "undefined") localStorage.removeItem("vb_auth");
};

// ─── Slice ────────────────────────────────────────────────────────────────────

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
    // Manual logout (no API call needed, e.g. token expired)
    forceLogout(state) {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.error = null;
      clearStorage();
    },
  },
  extraReducers: (builder) => {
    // ── Login ──────────────────────────────────────────────────────────────
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.error = null;
        persist(state);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // ── Register ───────────────────────────────────────────────────────────
    builder
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.error = null;
        persist(state);
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // ── Logout ─────────────────────────────────────────────────────────────
    builder
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.error = null;
        clearStorage();
      })
      .addCase(logoutUser.rejected, (state) => {
        // Even if API fails, clear local state
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        clearStorage();
      });

    // ── Get Me (refresh user from server) ──────────────────────────────────
    builder
      .addCase(getMe.fulfilled, (state, action) => {
        state.user = action.payload;
        persist(state);
      })
      .addCase(getMe.rejected, (state) => {
        // Token likely invalid — force logout
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        clearStorage();
      });

    // ── Verify Email OTP ───────────────────────────────────────────────────
    builder.addCase(verifyEmailCode.fulfilled, (state, action) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        persist(state);
      }
    });
  },
});

export const { clearError, forceLogout } = authSlice.actions;
export const logout = logoutUser;
export const login = loginUser;
export const register = registerUser;
export const signup = registerUser;
export default authSlice.reducer;

// ─── Re-export thunks for convenience ────────────────────────────────────────
export {
  loginUser,
  registerUser,
  logoutUser,
  getMe,
  forgotPassword,
  resetPassword,
  verifyEmailCode,
  resendVerification,
  changePassword,
} from "../actions/authActions";