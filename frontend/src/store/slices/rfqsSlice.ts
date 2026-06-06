import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { seedRFQs, type RFQ } from "@/lib/mockData";

interface State { items: RFQ[] }
const initialState: State = { items: seedRFQs };

const slice = createSlice({
  name: "rfqs",
  initialState,
  reducers: {
    addRFQ: {
      reducer(state, action: PayloadAction<RFQ>) {
        state.items.unshift(action.payload);
      },
      prepare(payload: Omit<RFQ, "id" | "code" | "createdAt" | "status"> & { status?: RFQ["status"] }) {
        const id = `r${Date.now()}`;
        const seq = String(Math.floor(Math.random() * 900) + 100);
        return {
          payload: {
            ...payload,
            id,
            code: `RFQ-2026-${seq}`,
            status: payload.status ?? "Open",
            createdAt: new Date().toISOString(),
          } as RFQ,
        };
      },
    },
    updateRFQStatus(state, action: PayloadAction<{ id: string; status: RFQ["status"] }>) {
      const r = state.items.find((x) => x.id === action.payload.id);
      if (r) r.status = action.payload.status;
    },
    deleteRFQ(state, action: PayloadAction<string>) {
      state.items = state.items.filter((r) => r.id !== action.payload);
    },
  },
});

export const { addRFQ, updateRFQStatus, deleteRFQ } = slice.actions;
export default slice.reducer;