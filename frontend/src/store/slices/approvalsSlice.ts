import { createSlice } from "@reduxjs/toolkit";
import type { Approval } from "@/lib/mockData";
import {
  fetchApprovals,
  submitForApproval,
  decideApproval,
} from "../actions/approvalActions";

interface State {
  items: Approval[];
  loading: boolean;
  error: string | null;
}
const initialState: State = {
  items: [],
  loading: false,
  error: null,
};

const slice = createSlice({
  name: "approvals",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchApprovals.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchApprovals.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchApprovals.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(submitForApproval.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      .addCase(decideApproval.fulfilled, (state, action) => {
        const i = state.items.findIndex((a) => a.id === action.payload.id);
        if (i >= 0) state.items[i] = action.payload;
      });
  },
});

export { submitForApproval as requestApproval, decideApproval };
export default slice.reducer;