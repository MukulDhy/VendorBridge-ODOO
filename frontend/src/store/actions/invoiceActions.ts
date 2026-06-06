import { createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "../Api/authApi";
import type { Invoice } from "@/lib/mockData";

const extract = (e: unknown): string => {
  if (e && typeof e === "object" && "response" in e) {
    const err = e as { response?: { data?: { message?: string } } };
    return err.response?.data?.message ?? "Something went wrong";
  }
  return "Network error";
};

export const fetchInvoices = createAsyncThunk<Invoice[]>(
  "invoices/fetchInvoices",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/invoices");
      return data.data as Invoice[];
    } catch (e) {
      return rejectWithValue(extract(e));
    }
  }
);

export const addInvoice = createAsyncThunk<
  Invoice,
  Omit<Invoice, "id" | "code" | "createdAt" | "status"> & { status?: Invoice["status"] }
>("invoices/addInvoice", async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post("/invoices", payload);
    return data.data as Invoice;
  } catch (e) {
    return rejectWithValue(extract(e));
  }
});

export const updateInvoiceStatus = createAsyncThunk<
  Invoice,
  { id: string; status: Invoice["status"] }
>("invoices/updateInvoiceStatus", async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.patch(`/invoices/${payload.id}/status`, {
      status: payload.status,
    });
    return data.data as Invoice;
  } catch (e) {
    return rejectWithValue(extract(e));
  }
});
