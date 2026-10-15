# PropSync — Property Maintenance & Service Coordination System

## 1. Project Overview

PropSync is a full-stack web application for coordinating property maintenance activities among property owners, maintenance managers, service providers, and administrators.

The application supports complaint management, service provider assignment, service estimates, maintenance workflows, and payment-related operations.

## 2. Technology Stack

- **Frontend:** React, JavaScript, HTML, and CSS
- **Backend:** NestJS and TypeScript
- **API Communication:** REST APIs using Fetch
- **Backend Data Storage:** In-memory data structures

## 3. Prerequisites

Install the following before running the application:

- Node.js and npm
- A code editor such as Visual Studio Code
- A web browser

## 4. Installation and Execution

### Step 1: Extract the ZIP

Extract the submitted ZIP file and open the project directory in your terminal.

### Step 2: Start the Backend

Navigate to the backend directory:

```bash
cd backend
npm install
npm run start:dev
```

Keep the backend terminal running.

Verify the backend API URL and port from the project configuration.

### Step 3: Start the React Frontend

Open a second terminal:

```bash
cd frontend_react
npm install
npm run dev
```

Open the local URL printed by the frontend development server.

**Note:** Use the actual directory names and npm scripts present in the project. Configure the frontend API base URL to match the backend.

## 5. Testing Instructions

1. **Start the Backend and Frontend:** Run both applications and open the React frontend in a browser.

2. **Verify API Calls Using Swagger and the UI:**
   - Open the Swagger documentation at the configured URL, typically `http://localhost:3000/api`.
   - Execute the relevant API endpoints and inspect the request parameters, response status codes, and returned JSON data.
   - Perform the corresponding actions in the React UI.
   - Verify that the API response is correctly reflected in the UI, including complaint lists, task details, ratings, and status updates where applicable.
   - Compare Swagger responses with the displayed UI data to verify frontend-backend integration.

3. **Test Complaint Search and Filtering:** Verify that search fields and filters display the correct complaints and assigned tasks.

4. **Test Form Input Handling and Validation:** Check required fields, invalid inputs, document selection, and form submission wherever applicable.

5. **Verify Error Handling:** Test appropriate failure scenarios and check that API errors are handled correctly and meaningful messages are displayed in the UI.

## 6. Individual Contribution

My individual contribution focused on developing and integrating the Service Provider section of the React frontend.

### Files Developed or Modified

- `frontend_react/src/pages/service_provider/AvailableComplaints.jsx` — Available complaints list, data fetching, filtering, complaint details, and interest/rejection actions.
- `frontend_react/src/pages/service_provider/AssignedTasks.jsx` — Assigned task list, task fetching, search and filters, and navigation to task actions.
- `frontend_react/src/pages/service_provider/Dashboard.jsx` — Provider dashboard, task summaries, notifications, and complaint actions.
- `frontend_react/src/pages/service_provider/Ratings.jsx` — Provider ratings and feedback, summary statistics, and filters.
- `frontend_react/src/pages/service_provider/SubmitEstimate.jsx` — Estimate form, validation, document selection, and estimate submission.
- `frontend_react/src/pages/service_provider/TaskDetails.jsx` — Task detail view and estimate information.
- `frontend_react/src/pages/service_provider/UpdateStatus.jsx` — Task eligibility checks, progress and bill form, attachment handling, and bill submission.
- `frontend_react/src/pages/service_provider/styles.css` — Styling used by the Service Provider pages.
- `frontend_react/src/routes/AppRoutes.jsx` — Service Provider route definitions and route protection integration. The shared `Sidebar`, `Navbar`, and `RoleLayout` are existing application components and are not claimed as my implementation.

### React Concepts Implemented

- **React Components:** Implementing the Service Provider page components and their local UI helpers.
- **Props and Component Communication:** Using props where the Service Provider pages render local helper components (for example, icon type or rating data). The page-level task and form state is mainly managed locally; these pages do not use a shared callback-prop system to communicate with one another.
- **State Management:** Managing UI state using `useState`.
- **Event Handling:** Handling user interactions, button clicks, filters, and form submissions.
- **Controlled Forms:** Managing form inputs and validation wherever applicable.
- **Side Effects:** Fetching data and synchronizing the UI with backend APIs using `useEffect`, wherever applicable.
- **List Rendering and Filtering:** Displaying and filtering data using `map()` and `filter()`.
- **API Integration:** Fetching backend data, submitting user actions, and reflecting API responses in the UI.
