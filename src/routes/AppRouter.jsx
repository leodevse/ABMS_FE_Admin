import { createBrowserRouter, Navigate } from "react-router-dom";
import AdminLayout from "../layouts/AdminLayout";
import DashboardPage from "../pages/dashboard/DashboardPage";
import ServiceListPage from "../pages/service/ServiceListPage";
import MeterReadingPage from "../pages/meter/MeterReadingPage";
import MaintenancePage from "../pages/maintenance/MaintenancePage";
import MaintenanceDetail from "../pages/maintenance/MaintenanceDetail";
import Login from "../pages/auth/Login";
import ProtectedRoute from "../context/ProtectedRoute";
import BuildingList from "../pages/building/BuildingList";
import AddBuilding from "../pages/building/AddBuilding";
import ApartmentListByBuilding from "../pages/apartment/ApartmentListByBuilding";
import ApartmentDetail from "../pages/apartment/ApartmentDetail";
import AssignResident from "../pages/apartment/AssignResident";
const AppRouter = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: "dashboard",
        element: <DashboardPage />,
      },
      // ── Phase 2 ──
      {
        path: "service-config",
        element: <ServiceListPage />,
      },
      // ── Phase 3 ──
      {
        path: "meter-readings",
        element: <MeterReadingPage />,
      },
      // ── Phase 4 ──
      {
        path: "maintenance",
        element: <MaintenancePage />,
      },
      {
        path: "maintenance/:id",
        element: <MaintenanceDetail />,
      },
    ],
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: "building", element: <BuildingList /> },
      { path: "add-building", element: <AddBuilding /> },
      {
        path: "buildings/:buildingId/apartments",
        element: <ApartmentListByBuilding />,
      },
      
      {
        path: "apartments/detail/:id",
        element: <ApartmentDetail />,
      },
            {
        path: "assign-resident",
        element: <AssignResident />,
      }
    ],
  },
]);

export default AppRouter;
