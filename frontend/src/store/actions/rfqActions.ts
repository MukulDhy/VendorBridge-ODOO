import { createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "../Api/authApi";
import type { RFQ } from "@/lib/mockData";

const extract = (e: unknown): string => {
  if (e && typeof e === "object" && "response" in e) {
    const err = e as { response?: { data?: { message?: string } } };
    return err.response?.data?.message ?? "Something went wrong";
  }
  return "Network error";
};

export const fetchRFQs = createAsyncThunk<RFQ[]>(
  "rfqs/fetchRFQs",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/rfqs");
      return data.data as RFQ[];
    } catch (e) {
      return rejectWithValue(extract(e));
    }
  }
);

export const addRFQ = createAsyncThunk<
  RFQ,
  Omit<RFQ, "id" | "code" | "createdAt" | "status"> & { status?: RFQ["status"] }
>("rfqs/addRFQ", async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post("/rfqs", payload);
    console.log(data);
    return data.data as RFQ;
  } catch (e) {
    return rejectWithValue(extract(e));
  }
});

export const updateRFQStatus = createAsyncThunk<
  RFQ,
  { id: string; status: RFQ["status"] }
>("rfqs/updateRFQStatus", async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.patch(`/rfqs/${payload.id}/status`, {
      status: payload.status,
    });
    return data.data as RFQ;
  } catch (e) {
    return rejectWithValue(extract(e));
  }
});

export const deleteRFQ = createAsyncThunk<string, string>(
  "rfqs/deleteRFQ",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/rfqs/${id}`);
      return id;
    } catch (e) {
      return rejectWithValue(extract(e));
    }
  }
);
