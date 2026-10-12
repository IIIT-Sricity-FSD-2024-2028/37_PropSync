import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import AvailableComplaints from "../pages/service_provider/AvailableComplaints.jsx";
import Dashboard from "../pages/service_provider/Dashboard.jsx";
import AssignedTasks from "../pages/service_provider/AssignedTasks.jsx";
import TaskDetails from "../pages/service_provider/TaskDetails.jsx";
import SubmitEstimate from "../pages/service_provider/SubmitEstimate.jsx";
import UpdateStatus from "../pages/service_provider/UpdateStatus.jsx";
import Ratings from "../pages/service_provider/Ratings.jsx";
function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <Navigate
              to="/service-provider/dashboard"
              replace
            />
          }
        />

        <Route
          path="/service-provider/dashboard"
          element={<Dashboard />}
        />

        <Route
        path="/service-provider/available-complaints"
        element={<AvailableComplaints />}
        />
        <Route
        path="/service-provider/assigned-tasks"
        element={<AssignedTasks />}
        />
        <Route
         path="/service-provider/task-details"
         element={<TaskDetails />}
        />
        <Route
        path="/service-provider/submit-estimate"
        element={<SubmitEstimate />}
        />
        <Route
        path="/service-provider/update-status"
        element={<UpdateStatus />}
      />
      <Route
        path="/service-provider/ratings"
        element={<Ratings />}
        />
      
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;