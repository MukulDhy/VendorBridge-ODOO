import { createSlice } from "@reduxjs/toolkit";
import type { User } from "@/lib/mockData";
import {
  fetchUsers,
  addUser as addUserThunk,
  editUser,
  removeUser as removeUserThunk,
} from "../actions/userActions";

interface State {
  items: User[];
  loading: boolean;
  error: string | null;
}
const initialState: State = {
  items: [],
  loading: false,
  error: null,
};

const slice = createSlice({
  name: "users",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(addUserThunk.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      .addCase(editUser.fulfilled, (state, action) => {
        const i = state.items.findIndex((u) => u.id === action.payload.id);
        if (i >= 0) state.items[i] = action.payload;
      })
      .addCase(removeUserThunk.fulfilled, (state, action) => {
        state.items = state.items.filter((u) => u.id !== action.payload);
      });
  },
});

export { addUserThunk as addUser, removeUserThunk as deleteUser };
export default slice.reducer;