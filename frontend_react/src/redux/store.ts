import { configureStore } from "@reduxjs/toolkit";
import billsReducer from "./features/bills/billsSlice";
import paymentsReducer from "./features/payments/paymentsSlice";
import complaintsReducer from "./features/complaints/complaintsSlice";
import estimatesReducer from "./features/estimates/estimatesSlice";
import ratingsReducer from "./features/ratings/ratingsSlice";
import notificationsReducer from "./features/notifications/notificationsSlice";
import maintenanceReducer from "./features/maintenance/maintenanceSlice";
import usersReducer from "./features/users/usersSlice";

export const store = configureStore({
  reducer: {
    bills: billsReducer,
    payments: paymentsReducer,
    complaints: complaintsReducer,
    estimates: estimatesReducer,
    ratings: ratingsReducer,
    notifications: notificationsReducer,
    maintenance: maintenanceReducer,
    users: usersReducer,
  },
});
