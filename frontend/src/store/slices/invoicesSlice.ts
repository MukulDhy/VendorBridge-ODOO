import { createSlice } from "@reduxjs/toolkit";
import type { Invoice } from "@/lib/mockData";
import {
  fetchInvoices,
  addInvoice,
  updateInvoiceStatus,
} from "../actions/invoiceActions";

interface State {
  items: Invoice[];
  loading: boolean;
  error: string | null;
}
const initialState: State = {
  items: [],
  loading: false,
  error: null,
};

const slice = createSlice({
  name: "invoices",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchInvoices.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchInvoices.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchInvoices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(addInvoice.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      .addCase(updateInvoiceStatus.fulfilled, (state, action) => {
        const i = state.items.find((x) => x.id === action.payload.id);
        if (i) i.status = action.payload.status;
      });
  },
});

export { addInvoice as createInvoice, updateInvoiceStatus as setInvoiceStatus };
export default slice.reducer;