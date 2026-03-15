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
import ApartmentHistory from "../pages/apartment/ApartmentHistory";
import UserList from "../pages/user/UserList";
import UserForm from "../pages/user/UserForm";
import PaymentTransaction from "../pages/payment/PaymentTransaction";
import PaymentDashboard from "../pages/payment/PaymentDashboard";

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

      // Dashboard
      {
        path: "dashboard",
        element: <DashboardPage />,
      },

      // Services
      {
        path: "service-config",
        element: <ServiceListPage />,
      },

      // Meter
      {
        path: "meter-readings",
        element: <MeterReadingPage />,
      },

      // Maintenance
      {
        path: "maintenance",
        element: <MaintenancePage />,
      },
      {
        path: "maintenance/:id",
        element: <MaintenanceDetail />,
      },

      // Building
      {
        path: "building",
        element: <BuildingList />,
      },
      {
        path: "add-building",
        element: <AddBuilding />,
      },

      // Apartment
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
      },
      {
        path: "apartments/:id/history",
        element: <ApartmentHistory />,
      },

      // Users
      {
        path: "users",
        element: <UserList />,
      },
      {
        path: "users/create",
        element: <UserForm />,
      },
      {
        path: "users/edit/:id",
        element: <UserForm />,
      },

      // Payment
      {
        path: "payment",
        element: <PaymentTransaction />,
      },
      {
        path: "payment/dashboard",
        element: <PaymentDashboard />,
      },
    ],
  },
]);

export default AppRouter;