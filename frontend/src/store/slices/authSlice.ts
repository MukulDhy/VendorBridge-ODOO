import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { seedUsers, type User, type Role } from "@/lib/mockData";

interface AuthState {
  user: User | null;
  token: string | null;
  error: string | null;
}

const stored = typeof window !== "undefined" ? localStorage.getItem("vb_auth") : null;
const parsed = stored ? (JSON.parse(stored) as AuthState) : null;

const initialState: AuthState = parsed ?? { user: null, token: null, error: null };

const persist = (s: AuthState) => {
  if (typeof window !== "undefined") localStorage.setItem("vb_auth", JSON.stringify(s));
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    login(state, action: PayloadAction<{ email: string; password: string }>) {
      const u = seedUsers.find(
        (x) => x.email.toLowerCase() === action.payload.email.toLowerCase() && x.password === action.payload.password,
      );
      if (!u) {
        state.error = "Invalid email or password";
        return;
      }
      state.user = u;
      state.token = `mock.jwt.${u.id}.${Date.now()}`;
      state.error = null;
      persist(state);
    },
    signup(state, action: PayloadAction<{ name: string; email: string; password: string; role: Role }>) {
      const exists = seedUsers.find((u) => u.email === action.payload.email);
      if (exists) {
        state.error = "Email already registered";
        return;
      }
      const u: User = {
        id: `u${Date.now()}`,
        name: action.payload.name,
        email: action.payload.email,
        password: action.payload.password,
        role: action.payload.role,
      };
      seedUsers.push(u);
      state.user = u;
      state.token = `mock.jwt.${u.id}.${Date.now()}`;
      state.error = null;
      persist(state);
    },
    logout(state) {
      state.user = null;
      state.token = null;
      state.error = null;
      if (typeof window !== "undefined") localStorage.removeItem("vb_auth");
    },
    clearError(state) {
      state.error = null;
    },
  },
});

export const { login, signup, logout, clearError } = authSlice.actions;
export default authSlice.reducer;