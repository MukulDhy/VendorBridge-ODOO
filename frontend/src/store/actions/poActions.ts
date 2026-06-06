import { createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "../Api/authApi";
import type { PurchaseOrder } from "@/lib/mockData";

const extract = (e: unknown): string => {
  if (e && typeof e === "object" && "response" in e) {
    const err = e as { response?: { data?: { message?: string } } };
    return err.response?.data?.message ?? "Something went wrong";
  }
  return "Network error";
};

export const fetchPOs = createAsyncThunk<PurchaseOrder[]>(
  "purchaseOrders/fetchPOs",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/purchase-orders");
      return data.data as PurchaseOrder[];
    } catch (e) {
      return rejectWithValue(extract(e));
    }
  }
);

export const addPO = createAsyncThunk<
  PurchaseOrder,
  Omit<PurchaseOrder, "id" | "code" | "createdAt" | "status"> & { status?: PurchaseOrder["status"] }
>("purchaseOrders/addPO", async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post("/purchase-orders", payload);
    return data.data as PurchaseOrder;
  } catch (e) {
    return rejectWithValue(extract(e));
  }
});

export const updatePOStatus = createAsyncThunk<
  PurchaseOrder,
  { id: string; status: PurchaseOrder["status"] }
>("purchaseOrders/updatePOStatus", async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.patch(`/purchase-orders/${payload.id}/status`, {
      status: payload.status,
    });
    return data.data as PurchaseOrder;
  } catch (e) {
    return rejectWithValue(extract(e));
  }
});
