import { createSlice } from "@reduxjs/toolkit";
import type { RFQ } from "@/lib/mockData";
import {
  fetchRFQs,
  addRFQ,
  updateRFQStatus,
  deleteRFQ,
} from "../actions/rfqActions";

interface State {
  items: RFQ[];
  loading: boolean;
  error: string | null;
}
const initialState: State = {
  items: [],
  loading: false,
  error: null,
};

const slice = createSlice({
  name: "rfqs",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchRFQs.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchRFQs.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchRFQs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(addRFQ.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      .addCase(updateRFQStatus.fulfilled, (state, action) => {
        const r = state.items.find((x) => x.id === action.payload.id);
        if (r) r.status = action.payload.status;
      })
      .addCase(deleteRFQ.fulfilled, (state, action) => {
        state.items = state.items.filter((r) => r.id !== action.payload);
      });
  },
});

export { addRFQ, deleteRFQ, updateRFQStatus };
export default slice.reducer;