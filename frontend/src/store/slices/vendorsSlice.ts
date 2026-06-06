import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { seedVendors, type Vendor } from "@/lib/mockData";

interface State { items: Vendor[] }
const initialState: State = { items: seedVendors };

const slice = createSlice({
  name: "vendors",
  initialState,
  reducers: {
    addVendor(state, action: PayloadAction<Omit<Vendor, "id" | "createdAt" | "rating" | "onTime">>) {
      state.items.unshift({
        ...action.payload,
        id: `v${Date.now()}`,
        createdAt: new Date().toISOString(),
        rating: 4.0,
        onTime: 90,
      });
    },
    updateVendor(state, action: PayloadAction<Vendor>) {
      const i = state.items.findIndex((v) => v.id === action.payload.id);
      if (i >= 0) state.items[i] = action.payload;
    },
    deleteVendor(state, action: PayloadAction<string>) {
      state.items = state.items.filter((v) => v.id !== action.payload);
    },
    setStatus(state, action: PayloadAction<{ id: string; status: Vendor["status"] }>) {
      const v = state.items.find((x) => x.id === action.payload.id);
      if (v) v.status = action.payload.status;
    },
  },
});

export const { addVendor, updateVendor, deleteVendor, setStatus } = slice.actions;
export default slice.reducer;