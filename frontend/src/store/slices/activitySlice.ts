import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { ActivityLog } from "@/lib/mockData";
import { fetchActivityLogs } from "../actions/activityActions";

interface State {
  items: ActivityLog[];
  loading: boolean;
  error: string | null;
}
const initialState: State = {
  items: [],
  loading: false,
  error: null,
};

const slice = createSlice({
  name: "activity",
  initialState,
  reducers: {
    logActivity: {
      reducer(state, action: PayloadAction<ActivityLog>) {
        state.items.unshift(action.payload);
      },
      prepare(payload: Omit<ActivityLog, "id" | "timestamp">) {
        return {
          payload: { ...payload, id: `l${Date.now()}`, timestamp: new Date().toISOString() } as ActivityLog,
        };
      },
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchActivityLogs.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchActivityLogs.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchActivityLogs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { logActivity } = slice.actions;
export default slice.reducer;