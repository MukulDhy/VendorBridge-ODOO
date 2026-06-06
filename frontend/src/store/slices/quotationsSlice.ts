import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { seedQuotations, type Quotation } from "@/lib/mockData";

interface State { items: Quotation[] }
const initialState: State = { items: seedQuotations };

const slice = createSlice({
  name: "quotations",
  initialState,
  reducers: {
    submitQuotation: {
      reducer(state, action: PayloadAction<Quotation>) {
        state.items.unshift(action.payload);
      },
      prepare(payload: Omit<Quotation, "id" | "status" | "submittedAt">) {
        return {
          payload: {
            ...payload,
            id: `q${Date.now()}`,
            status: "Submitted" as Quotation["status"],
            submittedAt: new Date().toISOString(),
          } as Quotation,
        };
      },
    },
    setQuotationStatus(state, action: PayloadAction<{ id: string; status: Quotation["status"] }>) {
      const q = state.items.find((x) => x.id === action.payload.id);
      if (q) q.status = action.payload.status;
    },
  },
});

export const { submitQuotation, setQuotationStatus } = slice.actions;
export default slice.reducer;