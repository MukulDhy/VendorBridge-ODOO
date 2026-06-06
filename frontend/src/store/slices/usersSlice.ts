import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { seedUsers, type User } from "@/lib/mockData";

interface State { items: User[] }
const initialState: State = { items: seedUsers };

const slice = createSlice({
  name: "users",
  initialState,
  reducers: {
    addUser(state, action: PayloadAction<User>) {
      state.items.unshift(action.payload);
    },
    deleteUser(state, action: PayloadAction<string>) {
      state.items = state.items.filter((u) => u.id !== action.payload);
    },
  },
});

export const { addUser, deleteUser } = slice.actions;
export default slice.reducer;