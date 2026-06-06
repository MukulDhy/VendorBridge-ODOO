import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { seedActivity, type ActivityLog } from "@/lib/mockData";

interface State { items: ActivityLog[] }
const initialState: State = { items: seedActivity };

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
});

export const { logActivity } = slice.actions;
export default slice.reducer;