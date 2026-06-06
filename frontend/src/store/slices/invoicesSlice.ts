import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { seedInvoices, type Invoice } from "@/lib/mockData";

interface State { items: Invoice[] }
const initialState: State = { items: seedInvoices };

const slice = createSlice({
  name: "invoices",
  initialState,
  reducers: {
    createInvoice: {
      reducer(state, action: PayloadAction<Invoice>) {
        state.items.unshift(action.payload);
      },
      prepare(payload: Omit<Invoice, "id" | "code" | "createdAt" | "status"> & { status?: Invoice["status"] }) {
        const seq = String(Math.floor(Math.random() * 900) + 100);
        return {
          payload: {
            ...payload,
            id: `i${Date.now()}`,
            code: `INV-2026-${seq}`,
            status: payload.status ?? "Pending",
            createdAt: new Date().toISOString(),
          } as Invoice,
        };
      },
    },
    setInvoiceStatus(state, action: PayloadAction<{ id: string; status: Invoice["status"] }>) {
      const i = state.items.find((x) => x.id === action.payload.id);
      if (i) i.status = action.payload.status;
    },
  },
});

export const { createInvoice, setInvoiceStatus } = slice.actions;
export default slice.reducer;