import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Notification } from "@/lib/mockData";
import { fetchNotifications, markRead as markReadThunk } from "../actions/notificationActions";

interface State {
  items: Notification[];
  loading: boolean;
  error: string | null;
}
const initialState: State = {
  items: [],
  loading: false,
  error: null,
};

const slice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    pushNotification: {
      reducer(state, action: PayloadAction<Notification>) {
        state.items.unshift(action.payload);
      },
      prepare(payload: Omit<Notification, "id" | "createdAt" | "read">) {
        return {
          payload: {
            ...payload,
            id: `n${Date.now()}`,
            read: false,
            createdAt: new Date().toISOString(),
          } as Notification,
        };
      },
    },
    markAllRead(state, action: PayloadAction<string>) {
      state.items.forEach((n) => {
        if (n.userId === action.payload || n.userId === "all") n.read = true;
      });
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(markReadThunk.fulfilled, (state, action) => {
        const n = state.items.find((x) => x.id === action.payload.id);
        if (n) n.read = true;
      });
  },
});

export const { pushNotification, markAllRead } = slice.actions;
export const markRead = markReadThunk;
export default slice.reducer;