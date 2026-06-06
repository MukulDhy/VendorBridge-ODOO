import { createSlice } from "@reduxjs/toolkit";
import type { PurchaseOrder } from "@/lib/mockData";
import {
  fetchPOs,
  addPO,
  updatePOStatus,
} from "../actions/poActions";

interface State {
  items: PurchaseOrder[];
  loading: boolean;
  error: string | null;
}
const initialState: State = {
  items: [],
  loading: false,
  error: null,
};

const slice = createSlice({
  name: "purchaseOrders",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPOs.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchPOs.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchPOs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(addPO.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      .addCase(updatePOStatus.fulfilled, (state, action) => {
        const p = state.items.find((x) => x.id === action.payload.id);
        if (p) p.status = action.payload.status;
      });
  },
});

export { addPO as createPO, updatePOStatus as setPOStatus };
export default slice.reducer;