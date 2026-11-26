// =============================================================
// Payments slice – payment records against service bills
//
// CRUD – every operation is an async thunk:
//   UI -> thunk -> paymentsApi -> backend/DB -> success -> Redux updated -> UI
//   C  createPayment
//   R  fetchPayments / fetchPaymentsByOwner / fetchPaymentById
//   U  (none: the backend has no update route or repository method for payments)
//   D  deletePayment
//
// Payment data in the store changes ONLY in the ".fulfilled" cases below,
// i.e. after the backend has answered successfully.
// Components read payments with the selectors at the bottom of this file.
// =============================================================

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  deletePaymentById,
  getPaymentById,
  getPayments,
  getPaymentsByOwner,
  postPayment,
} from "./paymentsApi";

const sameId = (a, b) => String(a) === String(b);

function upsert(list, payment) {
  if (!payment || payment.id === undefined) return;
  const i = list.findIndex((p) => sameId(p.id, payment.id));
  if (i === -1) list.unshift(payment);
  else list[i] = { ...list[i], ...payment };
}

const message = (action) => action.error?.message || "Something went wrong";

/* ---------------- async thunks (backend CRUD) ---------------- */

// READ – all payments (optionally one owner's): dispatch(fetchPayments({ ownerId }))
export const fetchPayments = createAsyncThunk("payments/fetchAll", (arg = {}) => getPayments(arg));

// READ – one owner's payments
export const fetchPaymentsByOwner = createAsyncThunk("payments/fetchByOwner", (arg) =>
  getPaymentsByOwner(typeof arg === "object" ? arg : { ownerId: arg })
);

// READ – one payment
export const fetchPaymentById = createAsyncThunk("payments/fetchById", (arg) =>
  getPaymentById(typeof arg === "object" ? arg : { id: arg })
);

// CREATE – dispatch(createPayment({ payment: { billId, ownerId, amount, receiptImage } }))
export const createPayment = createAsyncThunk("payments/create", (arg) => postPayment(arg));

// DELETE – dispatch(deletePayment(paymentId))
export const deletePayment = createAsyncThunk("payments/delete", async (arg) => {
  const params = typeof arg === "object" ? arg : { id: arg };
  await deletePaymentById(params);
  return params.id;
});

/* ---------------- slice ---------------- */

const initialState = {
  items: [],
  selectedPayment: null,
  loading: false, // a READ is running
  saving: false, // a CREATE / DELETE is running
  error: null,
};

const startRead = (state) => {
  state.loading = true;
  state.error = null;
};
const startSave = (state) => {
  state.saving = true;
  state.error = null;
};

const paymentsSlice = createSlice({
  name: "payments",
  initialState,
  reducers: {
    clearPaymentsError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // READ all / by owner (both replace the list)
      .addCase(fetchPayments.pending, startRead)
      .addCase(fetchPaymentsByOwner.pending, startRead)
      .addCase(fetchPayments.fulfilled, (state, action) => {
        state.loading = false;
        state.items = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchPaymentsByOwner.fulfilled, (state, action) => {
        state.loading = false;
        state.items = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchPayments.rejected, (state, action) => {
        state.loading = false;
        state.error = message(action);
      })
      .addCase(fetchPaymentsByOwner.rejected, (state, action) => {
        state.loading = false;
        state.error = message(action);
      })

      // READ one
      .addCase(fetchPaymentById.fulfilled, (state, action) => {
        state.selectedPayment = action.payload;
        upsert(state.items, action.payload);
      })
      .addCase(fetchPaymentById.rejected, (state, action) => {
        state.error = message(action);
      })

      // CREATE
      .addCase(createPayment.pending, startSave)
      .addCase(createPayment.fulfilled, (state, action) => {
        state.saving = false;
        upsert(state.items, action.payload);
      })
      .addCase(createPayment.rejected, (state, action) => {
        state.saving = false;
        state.error = message(action);
      })

      // DELETE
      .addCase(deletePayment.pending, startSave)
      .addCase(deletePayment.fulfilled, (state, action) => {
        state.saving = false;
        state.items = state.items.filter((p) => !sameId(p.id, action.payload));
      })
      .addCase(deletePayment.rejected, (state, action) => {
        state.saving = false;
        state.error = message(action);
      });
  },
});

export const { clearPaymentsError } = paymentsSlice.actions;

/* ---------------- selectors ---------------- */
export const selectAllPayments = (state) => state.payments.items;
export const selectPaymentsLoading = (state) => state.payments.loading;
export const selectPaymentsSaving = (state) => state.payments.saving;
export const selectPaymentsError = (state) => state.payments.error;
export const selectSelectedPayment = (state) => state.payments.selectedPayment;
export const selectPaymentById = (state, id) => state.payments.items.find((p) => sameId(p.id, id));

export default paymentsSlice.reducer;
