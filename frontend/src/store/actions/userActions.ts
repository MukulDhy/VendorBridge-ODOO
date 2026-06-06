import { createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "../Api/authApi";
import type { User } from "@/lib/mockData";

const extract = (e: unknown): string => {
  if (e && typeof e === "object" && "response" in e) {
    const err = e as { response?: { data?: { message?: string } } };
    return err.response?.data?.message ?? "Something went wrong";
  }
  return "Network error";
};

export const fetchUsers = createAsyncThunk<User[]>(
  "users/fetchUsers",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/users");
      return data.data as User[];
    } catch (e) {
      return rejectWithValue(extract(e));
    }
  }
);

export const addUser = createAsyncThunk<
  User,
  Omit<User, "id">
>("users/addUser", async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post("/users", payload);
    return data.data as User;
  } catch (e) {
    return rejectWithValue(extract(e));
  }
});

export const editUser = createAsyncThunk<User, User>(
  "users/editUser",
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/users/${payload.id}`, payload);
      return data.data as User;
    } catch (e) {
      return rejectWithValue(extract(e));
    }
  }
);

export const removeUser = createAsyncThunk<string, string>(
  "users/removeUser",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/users/${id}`);
      return id;
    } catch (e) {
      return rejectWithValue(extract(e));
    }
  }
);
