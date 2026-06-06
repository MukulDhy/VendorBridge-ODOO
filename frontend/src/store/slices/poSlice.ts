import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { seedPOs, type PurchaseOrder } from "@/lib/mockData";

interface State { items: PurchaseOrder[] }
const initialState: State = { items: seedPOs };

const slice = createSlice({
  name: "purchaseOrders",
  initialState,
  reducers: {
    createPO: {
      reducer(state, action: PayloadAction<PurchaseOrder>) {
        state.items.unshift(action.payload);
      },
      prepare(payload: Omit<PurchaseOrder, "id" | "code" | "createdAt" | "status"> & { status?: PurchaseOrder["status"] }) {
        const seq = String(Math.floor(Math.random() * 900) + 100);
        return {
          payload: {
            ...payload,
            id: `p${Date.now()}`,
            code: `PO-2026-${seq}`,
            status: payload.status ?? "Issued",
            createdAt: new Date().toISOString(),
          } as PurchaseOrder,
        };
      },
    },
    setPOStatus(state, action: PayloadAction<{ id: string; status: PurchaseOrder["status"] }>) {
      const p = state.items.find((x) => x.id === action.payload.id);
      if (p) p.status = action.payload.status;
    },
  },
});

export const { createPO, setPOStatus } = slice.actions;
export default slice.reducer;