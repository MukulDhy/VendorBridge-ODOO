import { createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "../Api/authApi";
import type { ActivityLog } from "@/lib/mockData";

const extract = (e: unknown): string => {
  if (e && typeof e === "object" && "response" in e) {
    const err = e as { response?: { data?: { message?: string } } };
    return err.response?.data?.message ?? "Something went wrong";
  }
  return "Network error";
};

export const fetchActivityLogs = createAsyncThunk<ActivityLog[]>(
  "activity/fetchActivityLogs",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/activity-logs");
      return data.data as ActivityLog[];
    } catch (e) {
      return rejectWithValue(extract(e));
    }
  }
);
