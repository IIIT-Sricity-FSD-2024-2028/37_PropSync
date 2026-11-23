# PropSync Backend

This is the backend service for the PropSync application. It is built using the [NestJS](https://nestjs.com/) framework and is designed to provide APIs for property management, user management, complaints, estimates, bills, payments, maintenance, and notifications.

## Project Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Environment Variables:**
   Copy the example environment file and adjust the values as necessary.
   ```bash
   cp .env.example .env
   ```

## Running the Application

```bash
# development
npm run start

```

The application will start on the port defined in your `.env` file (default is `3000`).

## Swagger API Documentation

This project uses Swagger for API documentation. 
Once the application is running, you can access the Swagger UI at:
- `http://localhost:<PORT>/api/docs`

## Tests

```bash
# unit tests
npm run test

# e2e tests
npm run test:e2e

# test coverage
npm run test:cov
```

## Structure overview
- `src/` - Application source code (controllers, modules, services)
- `test/` - E2E tests
- `uploads/` - Directory where uploaded files are stored (excluded from Git)


## Complaint estimates and provider selection

Providers now apply by submitting `POST /estimates` as multipart data with
`complaintId`, `estimatedCost`, `notes`, and `document`. The existing `role` and
`x-user-id` headers identify the provider. `providerId` remains an optional
compatibility field and must match that session. PDF, Word, and Excel documents
are limited to 5 MB. New applications leave the complaint approved/unassigned.
Bare `sp-interest` / `sp-accept` aliases cannot create an estimate-free application.

`GET /complaints/:id/queue` returns the existing `queue` plus `applications`
(each containing provider details and its estimate) and estimate-free
`legacyProviders`. Only the complaint's manager or its community administrator
can read this response. `GET /estimates` and provider/id reads are actor-scoped.
Documents are downloaded through `GET /estimates/:id/document` with actor headers;
the raw uploads/estimates directory is no longer public.

`PATCH /complaints/:id/assign/:providerId` accepts optional `deadline` and
`managerNote`. It assigns a queued provider, approves their valid pending estimate,
sets selected-estimate complaint flags, preserves the deadline, records other
candidates as `not_selected`, and starts the existing `in_progress` lifecycle.
`PATCH /estimates/:id/review` with `approved: false` rejects only that candidate.
Approval through the old review URL delegates to joint selection for unassigned
complaints. Assigned legacy complaints retain their old submission/review path.

Each estimate retains its complaint/provider IDs and unique provider application.
`selectionStatus` distinguishes candidate, selected, rejected, and not_selected;
only the selected estimate has `approved: true`. Estimates linked to active applications or assignments cannot be deleted;
selection and rejection preserve decision history.

Atomic operations use synchronous in-memory repository snapshots and rollback,
including notifications and uploaded-file cleanup. Like the existing application,
records are not durable across server restarts and are not shared between server
processes. Database persistence would require database transactions and uniqueness
constraints. Authentication still follows the project's existing trusted-header
convention; this change does not introduce a token-based authentication system.

Verification: `npm test -- --runInBand`; `npm run test:e2e -- --runInBand
service-provider-persistence`; `npm run build`. Frontend validation tests run via
`npm test` in `frontend_react`.

### Files changed for this workflow

- `backend/README.md`
- `backend/src/main.ts`
- `backend/src/modules/bills/bills.controller.ts`
- `backend/src/modules/bills/bills.service.ts`
- `backend/src/modules/complaints/complaints.controller.ts`
- `backend/src/modules/complaints/complaints.module.ts`
- `backend/src/modules/complaints/complaints.service.spec.ts`
- `backend/src/modules/complaints/complaints.service.ts`
- `backend/src/modules/complaints/dto/complaint.dto.ts`
- `backend/src/modules/estimates/dto/estimate.dto.ts`
- `backend/src/modules/estimates/estimates.controller.ts`
- `backend/src/modules/estimates/estimates.module.ts`
- `backend/src/modules/estimates/estimates.service.spec.ts`
- `backend/src/modules/estimates/estimates.service.ts`
- `backend/test/service-provider-persistence.e2e-spec.ts`
- `frontend_react/package.json`
- `frontend_react/src/components/service_provider/EstimateDocumentLink.jsx`
- `frontend_react/src/components/service_provider/EstimateForm.jsx`
- `frontend_react/src/pages/maintenance_manager/AssignProvider/AssignProvider.jsx`
- `frontend_react/src/pages/maintenance_manager/AssignProvider/components/ProviderQueue.jsx`
- `frontend_react/src/pages/maintenance_manager/AssignProvider/components/ProviderQueueItem.jsx`
- `frontend_react/src/pages/maintenance_manager/AssignProvider/components/ProviderSelection.jsx`
- `frontend_react/src/pages/maintenance_manager/ComplaintDetails/ComplaintDetails.jsx`
- `frontend_react/src/pages/maintenance_manager/ComplaintDetails/components/ComplaintStepper.jsx`
- `frontend_react/src/pages/maintenance_manager/ComplaintDetails/components/ProviderDocumentsCard.jsx`
- `frontend_react/src/pages/maintenance_manager/Dashboard/Dashboard.jsx`
- `frontend_react/src/pages/maintenance_manager/ServiceEstimate/ServiceEstimate.jsx`
- `frontend_react/src/pages/maintenance_manager/ServiceEstimate/components/EstimateHistory.jsx`
- `frontend_react/src/pages/maintenance_manager/ServiceEstimate/components/PendingEstimateCard.jsx`
- `frontend_react/src/pages/service_provider/AvailableComplaints.jsx`
- `frontend_react/src/pages/service_provider/SubmitEstimate.jsx`
- `frontend_react/src/pages/service_provider/TaskDetails.jsx`
- `frontend_react/src/pages/service_provider/UpdateStatus.jsx`
- `frontend_react/src/pages/service_provider/styles.css`
- `frontend_react/src/routes/AppRoutes.jsx`
- `frontend_react/src/services/estimateWorkflow.js`
- `frontend_react/src/services/managerService.js`
- `frontend_react/tests/estimateWorkflow.test.js`

### Verification results

Both production builds pass. Backend unit tests: 43 passed; complaint-estimate
HTTP tests: 6 passed; frontend validation/outcome tests: 3 passed. All changed
JavaScript/JSX files pass ESLint. The full frontend lint reports 103 existing
errors and one warning (unchanged HEAD reports 121 errors and one warning).
The complete HTTP suite has 12 passing tests and two unrelated failures in
`regression-multi-admin.e2e-spec.ts`; both failures were reproduced on unchanged
HEAD. Vite retains its existing large-chunk warning. Browser access was unavailable,
so desktop/mobile visual verification remains outstanding.
