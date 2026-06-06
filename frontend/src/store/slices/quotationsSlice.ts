import { createSlice } from "@reduxjs/toolkit";
import type { Quotation } from "@/lib/mockData";
import {
  fetchQuotations,
  submitQuotation,
  setQuotationStatus,
} from "../actions/quotationActions";

interface State {
  items: Quotation[];
  loading: boolean;
  error: string | null;
}
const initialState: State = {
  items: [],
  loading: false,
  error: null,
};

const slice = createSlice({
  name: "quotations",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchQuotations.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchQuotations.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchQuotations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(submitQuotation.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      .addCase(setQuotationStatus.fulfilled, (state, action) => {
        const q = state.items.find((x) => x.id === action.payload.id);
        if (q) q.status = action.payload.status;
      });
  },
});

export { submitQuotation, setQuotationStatus };
export default slice.reducer;