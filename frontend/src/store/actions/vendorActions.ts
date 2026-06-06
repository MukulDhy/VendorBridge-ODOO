import { createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "../Api/authApi";
import type { Vendor } from "@/lib/mockData";

const extract = (e: unknown): string => {
  if (e && typeof e === "object" && "response" in e) {
    const err = e as { response?: { data?: { message?: string } } };
    return err.response?.data?.message ?? "Something went wrong";
  }
  return "Network error";
};

export const fetchVendors = createAsyncThunk<Vendor[]>(
  "vendors/fetchVendors",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/vendors");
      return data.data as Vendor[];
    } catch (e) {
      return rejectWithValue(extract(e));
    }
  }
);

export const addVendor = createAsyncThunk<
  Vendor,
  Omit<Vendor, "id" | "createdAt" | "rating" | "onTime">
>("vendors/addVendor", async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post("/vendors", payload);
    return data.data as Vendor;
  } catch (e) {
    return rejectWithValue(extract(e));
  }
});

export const updateVendor = createAsyncThunk<Vendor, Vendor>(
  "vendors/updateVendor",
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/vendors/${payload.id}`, payload);
      return data.data as Vendor;
    } catch (e) {
      return rejectWithValue(extract(e));
    }
  }
);

export const deleteVendor = createAsyncThunk<string, string>(
  "vendors/deleteVendor",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/vendors/${id}`);
      return id;
    } catch (e) {
      return rejectWithValue(extract(e));
    }
  }
);

export const setStatus = createAsyncThunk<
  Vendor,
  { id: string; status: Vendor["status"] }
>("vendors/setStatus", async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.patch(`/vendors/${payload.id}/status`, {
      status: payload.status,
    });
    return data.data as Vendor;
  } catch (e) {
    return rejectWithValue(extract(e));
  }
});
