import { createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "../Api/authApi";
import type { Approval } from "@/lib/mockData";

const extract = (e: unknown): string => {
  if (e && typeof e === "object" && "response" in e) {
    const err = e as { response?: { data?: { message?: string } } };
    return err.response?.data?.message ?? "Something went wrong";
  }
  return "Network error";
};

export const fetchApprovals = createAsyncThunk<Approval[]>(
  "approvals/fetchApprovals",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/approvals");
      return data.data as Approval[];
    } catch (e) {
      return rejectWithValue(extract(e));
    }
  }
);

export const submitForApproval = createAsyncThunk<
  Approval,
  { rfqId: string; quotationId: string; amount: number; remarks: string }
>("approvals/submitForApproval", async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post("/approvals/submit", payload);
    return data.data as Approval;
  } catch (e) {
    return rejectWithValue(extract(e));
  }
});

export const decideApproval = createAsyncThunk<
  Approval,
  { id: string; status: Approval["status"]; remarks: string }
>("approvals/decideApproval", async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post(`/approvals/${payload.id}/decide`, {
      status: payload.status,
      remarks: payload.remarks,
    });
    return data.data as Approval;
  } catch (e) {
    return rejectWithValue(extract(e));
  }
});
