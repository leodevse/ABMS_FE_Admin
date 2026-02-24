import { Outlet } from "react-router-dom";
import AdminHeader from "./AdminHeader";
import AdminSidebar from "./AdminSidebar";

export default function AdminLayout() {
    return (
        <div className="admin-layout">
            <AdminHeader />
            <div className="admin-body">
                <AdminSidebar />
                <main className="admin-main">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
