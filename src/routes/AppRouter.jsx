import { createBrowserRouter, Navigate } from "react-router-dom";
import AdminLayout from "../layouts/AdminLayout";
import DashboardPage from "../pages/dashboard/DashboardPage";
import ServiceListPage from "../pages/service/ServiceListPage";
import MeterReadingPage from "../pages/meter/MeterReadingPage";
import MaintenancePage from "../pages/maintenance/MaintenancePage";
import MaintenanceDetail from "../pages/maintenance/MaintenanceDetail";
import StaffWorkloadPage from "../pages/maintenance/StaffWorkloadPage";
import OverdueRequestsPage from "../pages/maintenance/OverdueRequestsPage";
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
import EditBuilding from "../pages/building/EditBuilding";
import ServiceFormPage from "../pages/service/ServiceFormPage";
import TariffPage from "../pages/service/TariffPage";
import MeterReadingFormPage from "../pages/meter/MeterReadingFormPage";

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
      {
        path: "service-config/create",
        element: <ServiceFormPage />,
      },
      {
        path: "service-config/edit/:id",
        element: <ServiceFormPage />,
      },
      {
        path: "service-config/:serviceId/tariff",
        element: <TariffPage />,
      },
      // Meter Readings
      {
        path: "meter-readings",
        element: <MeterReadingPage />,
      },
      {
        path: "meter-readings/create",
        element: <MeterReadingFormPage />,
      },
      {
        path: "meter-readings/edit/:id",
        element: <MeterReadingFormPage />,
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
      {
        path: "maintenance/workload",
        element: <StaffWorkloadPage />,
      },
      {
        path: "maintenance/overdue",
        element: <OverdueRequestsPage />,
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
      {
        path: "buildings/edit/:id",
        element: <EditBuilding />,
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