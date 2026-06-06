import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { seedNotifications, type Notification } from "@/lib/mockData";

interface State { items: Notification[] }
const initialState: State = { items: seedNotifications };

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
    markRead(state, action: PayloadAction<string>) {
      const n = state.items.find((x) => x.id === action.payload);
      if (n) n.read = true;
    },
    markAllRead(state, action: PayloadAction<string>) {
      state.items.forEach((n) => {
        if (n.userId === action.payload || n.userId === "all") n.read = true;
      });
    },
  },
});

export const { pushNotification, markRead, markAllRead } = slice.actions;
export default slice.reducer;