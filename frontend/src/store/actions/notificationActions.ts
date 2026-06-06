import { createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "../Api/authApi";
import type { Notification } from "@/lib/mockData";

const extract = (e: unknown): string => {
  if (e && typeof e === "object" && "response" in e) {
    const err = e as { response?: { data?: { message?: string } } };
    return err.response?.data?.message ?? "Something went wrong";
  }
  return "Network error";
};

export const fetchNotifications = createAsyncThunk<Notification[]>(
  "notifications/fetchNotifications",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/notifications");
      return data.data as Notification[];
    } catch (e) {
      return rejectWithValue(extract(e));
    }
  }
);

export const markRead = createAsyncThunk<Notification, string>(
  "notifications/markRead",
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await api.patch(`/notifications/${id}/read`);
      return data.data as Notification;
    } catch (e) {
      return rejectWithValue(extract(e));
    }
  }
);
