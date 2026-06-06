import { createSlice } from "@reduxjs/toolkit";
import type { Vendor } from "@/lib/mockData";
import {
  fetchVendors,
  addVendor,
  updateVendor,
  deleteVendor,
  setStatus,
} from "../actions/vendorActions";

interface State {
  items: Vendor[];
  loading: boolean;
  error: string | null;
}
const initialState: State = {
  items: [],
  loading: false,
  error: null,
};

const slice = createSlice({
  name: "vendors",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchVendors.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchVendors.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchVendors.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(addVendor.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      .addCase(updateVendor.fulfilled, (state, action) => {
        const i = state.items.findIndex((v) => v.id === action.payload.id);
        if (i >= 0) state.items[i] = action.payload;
      })
      .addCase(deleteVendor.fulfilled, (state, action) => {
        state.items = state.items.filter((v) => v.id !== action.payload);
      })
      .addCase(setStatus.fulfilled, (state, action) => {
        const v = state.items.find((x) => x.id === action.payload.id);
        if (v) v.status = action.payload.status;
      });
  },
});

export { addVendor, deleteVendor, setStatus };
export default slice.reducer;