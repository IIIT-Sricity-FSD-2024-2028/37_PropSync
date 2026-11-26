// =============================================================
// Bills slice – service bills submitted by service providers
//
// CRUD – every operation is an async thunk:
//   UI -> thunk -> billsApi -> backend/DB -> success -> Redux updated -> UI
//   C  createBill
//   R  fetchBills / fetchBillById / fetchPaidBillsByProvider
//   U  markBillPaid
//   D  deleteBill
//
// Bill data in the store changes ONLY in the ".fulfilled" cases below,
// i.e. after the backend has answered successfully.
// Components read bills with the selectors at the bottom of this file.
// =============================================================

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  deleteBillById,
  getBillById,
  getBills,
  getPaidBillsByProvider,
  patchBillPaid,
  postBill,
} from "./billsApi";

const sameId = (a, b) => String(a) === String(b);

function upsert(list, bill) {
  if (!bill || bill.id === undefined) return;
  const i = list.findIndex((b) => sameId(b.id, bill.id));
  if (i === -1) list.unshift(bill);
  else list[i] = { ...list[i], ...bill };
}

const message = (action) => action.error?.message || "Something went wrong";

/* ---------------- async thunks (backend CRUD) ---------------- */

// READ – all bills, or only one complaint's bills: dispatch(fetchBills({ complaintId }))
export const fetchBills = createAsyncThunk("bills/fetchAll", (arg = {}) => getBills(arg));

// READ – one bill
export const fetchBillById = createAsyncThunk("bills/fetchById", (arg) =>
  getBillById(typeof arg === "object" ? arg : { id: arg })
);

// READ – paid bills of one provider (Service Provider earnings)
export const fetchPaidBillsByProvider = createAsyncThunk("bills/fetchPaidByProvider", (arg) =>
  getPaidBillsByProvider(typeof arg === "object" ? arg : { providerId: arg })
);

// CREATE – dispatch(createBill({ formData }))
export const createBill = createAsyncThunk("bills/create", (arg) => postBill(arg));

// UPDATE – dispatch(markBillPaid(billId))
export const markBillPaid = createAsyncThunk("bills/markPaid", (arg) =>
  patchBillPaid(typeof arg === "object" ? arg : { id: arg })
);

// DELETE – dispatch(deleteBill(billId))
export const deleteBill = createAsyncThunk("bills/delete", async (arg) => {
  const params = typeof arg === "object" ? arg : { id: arg };
  await deleteBillById(params);
  return params.id;
});

/* ---------------- slice ---------------- */

const initialState = {
  items: [],
  selectedBill: null,
  loading: false, // a READ is running
  saving: false, // a CREATE / UPDATE / DELETE is running
  error: null,
};

const billsSlice = createSlice({
  name: "bills",
  initialState,
  reducers: {
    clearBillsError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // READ all
      .addCase(fetchBills.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBills.fulfilled, (state, action) => {
        state.loading = false;
        const list = Array.isArray(action.payload) ? action.payload : [];
        const complaintId = action.meta.arg?.complaintId;
        // a filtered fetch only replaces that complaint's bills
        state.items = complaintId
          ? [...state.items.filter((b) => !sameId(b.complaintId, complaintId)), ...list]
          : list;
      })
      .addCase(fetchBills.rejected, (state, action) => {
        state.loading = false;
        state.error = message(action);
      })

      // READ one
      .addCase(fetchBillById.fulfilled, (state, action) => {
        state.selectedBill = action.payload;
        upsert(state.items, action.payload);
      })
      .addCase(fetchBillById.rejected, (state, action) => {
        state.error = message(action);
      })

      // READ provider's paid bills
      .addCase(fetchPaidBillsByProvider.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPaidBillsByProvider.fulfilled, (state, action) => {
        state.loading = false;
        state.items = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchPaidBillsByProvider.rejected, (state, action) => {
        state.loading = false;
        state.error = message(action);
      })

      // CREATE
      .addCase(createBill.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(createBill.fulfilled, (state, action) => {
        state.saving = false;
        upsert(state.items, action.payload);
      })
      .addCase(createBill.rejected, (state, action) => {
        state.saving = false;
        state.error = message(action);
      })

      // UPDATE
      .addCase(markBillPaid.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(markBillPaid.fulfilled, (state, action) => {
        state.saving = false;
        upsert(state.items, action.payload);
      })
      .addCase(markBillPaid.rejected, (state, action) => {
        state.saving = false;
        state.error = message(action);
      })

      // DELETE
      .addCase(deleteBill.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(deleteBill.fulfilled, (state, action) => {
        state.saving = false;
        state.items = state.items.filter((b) => !sameId(b.id, action.payload));
      })
      .addCase(deleteBill.rejected, (state, action) => {
        state.saving = false;
        state.error = message(action);
      });
  },
});

export const { clearBillsError } = billsSlice.actions;

/* ---------------- selectors ---------------- */
export const isBillPaid = (b) => (b.status || (b.isPaid ? "paid" : "submitted")) === "paid";

export const selectAllBills = (state) => state.bills.items;
export const selectBillsLoading = (state) => state.bills.loading;
export const selectBillsSaving = (state) => state.bills.saving;
export const selectBillsError = (state) => state.bills.error;
export const selectSelectedBill = (state) => state.bills.selectedBill;
export const selectBillById = (state, id) => state.bills.items.find((b) => sameId(b.id, id));
// Use inside useMemo (these return new arrays)
export const filterBillsByComplaint = (bills, complaintId) => bills.filter((b) => sameId(b.complaintId, complaintId));
export const filterPendingBills = (bills) => bills.filter((b) => !isBillPaid(b));
export const filterPaidBills = (bills) => bills.filter(isBillPaid);

export default billsSlice.reducer;
