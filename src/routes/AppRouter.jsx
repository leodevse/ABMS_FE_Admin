import { createBrowserRouter, Navigate } from "react-router-dom";
import AdminLayout from "../layouts/AdminLayout";
import DashboardPage from "../pages/dashboard/DashboardPage";
import ServiceListPage from "../pages/service/ServiceListPage";
import MeterReadingPage from "../pages/meter/MeterReadingPage";

const AppRouter = createBrowserRouter([
    {
        path: "/",
        element: <AdminLayout />,
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
        ],
    },
]);

export default AppRouter;
