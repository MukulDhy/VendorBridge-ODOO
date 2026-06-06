import { createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "../Api/authApi";
import type { Quotation } from "@/lib/mockData";

const extract = (e: unknown): string => {
  if (e && typeof e === "object" && "response" in e) {
    const err = e as { response?: { data?: { message?: string } } };
    return err.response?.data?.message ?? "Something went wrong";
  }
  return "Network error";
};

export const fetchQuotations = createAsyncThunk<
  Quotation[],
  { rfqId?: string; vendorId?: string } | undefined
>("quotations/fetchQuotations", async (params, { rejectWithValue }) => {
  try {
    const { data } = await api.get("/quotations", { params });
    return data.data as Quotation[];
  } catch (e) {
    return rejectWithValue(extract(e));
  }
});

export const submitQuotation = createAsyncThunk<
  Quotation,
  Omit<Quotation, "id" | "status" | "submittedAt">
>("quotations/submitQuotation", async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post("/quotations", payload);
    return data.data as Quotation;
  } catch (e) {
    return rejectWithValue(extract(e));
  }
});

export const setQuotationStatus = createAsyncThunk<
  Quotation,
  { id: string; status: Quotation["status"] }
>("quotations/setQuotationStatus", async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.patch(`/quotations/${payload.id}/status`, {
      status: payload.status,
    });
    return data.data as Quotation;
  } catch (e) {
    return rejectWithValue(extract(e));
  }
});
