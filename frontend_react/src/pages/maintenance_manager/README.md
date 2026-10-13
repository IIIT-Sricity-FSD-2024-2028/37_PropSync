# maintenance_manager – Maintenance Manager (React)

Every Maintenance Manager page from the old HTML version (`front_end/src/maintenance_manager/*.html`) converted to React.
It uses **only** the team's common components for Navbar / Sidebar / Profile / Notifications.

## Folder layout (team structure)

```
src/
├── components/            COMMON (friend)  Navbar.jsx, Sidebar.jsx        ← used, not changed
├── layouts/               COMMON (friend)  UserProfile.jsx, Notifications.jsx ← used, not changed
├── services/
│   ├── notificationService.js   COMMON (friend)                    ← used, not changed
│   └── managerService.js        maintenance_manager API calls (complaints, estimates, bills, maintenance…)
├── routes/
│   ├── AppRoutes.jsx      maintenance_manager routes added (other actors add theirs below)
│   └── ProtectedRoutes.jsx  role check using localStorage "currentUser"
└── pages/maintenance_manager/
    ├── Dashboard/            Dashboard.jsx + components/ (WelcomeBanner, SystemAlerts, PendingComplaintsTable,
    │                         RecentNotifications, StatusOverview, MaintenanceShortcutCard, TopProviderCard)
    ├── Complaints/           Complaints.jsx + components/ (ComplaintFilters, ComplaintsTable)
    ├── ComplaintDetails/     ComplaintDetails.jsx + components/ (ComplaintStepper, ComplaintInfoCard, LifecycleCard,
    │                         WorkProgressCard, TimelineCard, DescriptionCard, ProviderDocumentsCard, PhotoCard)
    ├── AssignProvider/       AssignProvider.jsx + components/ (ComplaintSummaryCard, DueDateCard, ProviderNotesCard,
    │                         ProviderQueue, ProviderQueueItem, AssignSuccessModal)
    ├── ServiceEstimate/      ServiceEstimate.jsx + components/ (PendingEstimateCard, EstimateHistory)
    ├── PaymentHistory/       PaymentHistory.jsx + components/ (BillsSummary, BillCard, PaymentHistoryTable, PaymentModal)
    ├── Maintenance/          Maintenance.jsx + components/ (MaintenanceChargeForm, MaintenanceStats, MaintenancePaymentsTable)
    ├── ProviderPerformance/  ProviderPerformance.jsx + components/ (PerformanceSummary, ProviderPerformanceCard, ReviewList)
    ├── Notifications/        Notifications.jsx  → uses COMMON layouts/Notifications
    ├── Profile/              Profile.jsx        → uses COMMON components/Navbar + layouts/UserProfile
    └── shared/               used only inside maintenance_manager: ManagerLayout (uses COMMON Navbar), KpiCard, Badges, Tabs,
                              Modal, RejectModal, DeadlineModal, ConfirmModal, EmptyRow, BackLink, PageHeader,
                              Toast, useComplaintActions, paths.js, maintenance_manager.css
```

## Where the common components are imported

| Common component | Imported in |
|---|---|
| `components/Navbar.jsx` (+ Sidebar) | `shared/ManagerLayout.jsx` (every manager page), `Profile/Profile.jsx` |
| `layouts/Notifications.jsx` | `Notifications/Notifications.jsx` |
| `layouts/UserProfile.jsx` | `Profile/Profile.jsx` |
| `services/notificationService.js` | `Dashboard/Dashboard.jsx` |

Every such line is marked `// COMMON COMPONENT`.

## Routes (in `routes/AppRoutes.jsx`)

They match the common Sidebar's links for `role="maintenance_manager"`:
`/dashboard  /complaints  /complaint-details?id=  /assign-provider?id=  /service-estimate
/payment-history  /maintenance  /provider-performance  /notifications  /profile`
