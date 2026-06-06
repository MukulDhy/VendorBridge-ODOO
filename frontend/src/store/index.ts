import { configureStore } from "@reduxjs/toolkit";
import auth from "./slices/authSlice";
import vendors from "./slices/vendorsSlice";
import rfqs from "./slices/rfqsSlice";
import quotations from "./slices/quotationsSlice";
import approvals from "./slices/approvalsSlice";
import purchaseOrders from "./slices/poSlice";
import invoices from "./slices/invoicesSlice";
import notifications from "./slices/notificationsSlice";
import activity from "./slices/activitySlice";
import users from "./slices/usersSlice";

export const store = configureStore({
  reducer: { auth, vendors, rfqs, quotations, approvals, purchaseOrders, invoices, notifications, activity, users },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

import { useDispatch, useSelector, type TypedUseSelectorHook } from "react-redux";
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;