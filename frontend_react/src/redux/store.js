import { configureStore } from "@reduxjs/toolkit";
// import billsReducer from "./features/bills/billsSlice.js";
// import paymentsReducer from "./features/payments/paymentsSlice.js";
import complaintsReducer from "./features/complaints/complaintsSlice.js";
// import estimatesReducer from "./features/estimates/estimatesSlice.js";
// import ratingsReducer from "./features/ratings/ratingsSlice.js";
// import notificationsReducer from "./features/notifications/notificationsSlice.js";
// import maintenanceReducer from "./features/maintenance/maintenanceSlice.js";
// import usersReducer from "./features/users/usersSlice.js";

export const store = configureStore({
  reducer: {
    // bills: billsReducer,
    // payments: paymentsReducer,
    complaints: complaintsReducer,
    // estimates: estimatesReducer,
    // ratings: ratingsReducer,
    // notifications: notificationsReducer,
    // maintenance: maintenanceReducer,
    // users: usersReducer,
  },
});
