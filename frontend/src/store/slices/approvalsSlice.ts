import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { seedApprovals, type Approval } from "@/lib/mockData";

interface State { items: Approval[] }
const initialState: State = { items: seedApprovals };

const slice = createSlice({
  name: "approvals",
  initialState,
  reducers: {
    requestApproval: {
      reducer(state, action: PayloadAction<Approval>) {
        state.items.unshift(action.payload);
      },
      prepare(payload: Omit<Approval, "id" | "status" | "createdAt">) {
        return {
          payload: {
            ...payload,
            id: `a${Date.now()}`,
            status: "Pending" as Approval["status"],
            createdAt: new Date().toISOString(),
          } as Approval,
        };
      },
    },
    decideApproval(state, action: PayloadAction<{ id: string; status: "Approved" | "Rejected"; approverId: string; remarks?: string }>) {
      const a = state.items.find((x) => x.id === action.payload.id);
      if (a) {
        a.status = action.payload.status;
        a.approverId = action.payload.approverId;
        a.decidedAt = new Date().toISOString();
        if (action.payload.remarks) a.remarks = action.payload.remarks;
      }
    },
  },
});

export const { requestApproval, decideApproval } = slice.actions;
export default slice.reducer;