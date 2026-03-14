import { NavLink } from "react-router-dom";
import {
    LayoutDashboard,
    Settings,
    Gauge,
    Wrench,
    Home,
} from "lucide-react";

const navItems = [
    {
        section: "Tổng quan",
        items: [
            { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
        ],
    },
    {
        section: "Quản lý dịch vụ",
        items: [
            { to: "/service-config", icon: Settings, label: "Cấu hình dịch vụ" },
            { to: "/meter-readings", icon: Gauge, label: "Ghi chỉ số" },
        ],
    },
    {
        section: "Bảo trì",
        items: [
            { to: "/maintenance", icon: Wrench, label: "Yêu cầu bảo trì" },
        ],
    },
    {
        section: "Quản lý tòa nhà",
        items: [
            { to: "/building", icon: Home, label: "quản lý tòa nhà" },
        ],
    },{
        section: "Quản lý giao dịch",
        items: [
            // { to: "/payment/dashboard", icon: Home, label: "Quản lý doanh thu" },
            { to: "/payment", icon: Home, label: "Danh sách giao dịch" },
        ],
    },
];

export default function AdminSidebar() {
    return (
        <aside className="admin-sidebar">
            {navItems.map((group) => (
                <div key={group.section}>
                    <p className="admin-sidebar__section-label">{group.section}</p>
                    {group.items.map(({ to, icon: Icon, label }) => (
                        <NavLink
                            key={to}
                            to={to}
                            className={({ isActive }) =>
                                "admin-sidebar__nav-item" + (isActive ? " active" : "")
                            }
                        >
                            <Icon className="nav-icon" />
                            {label}
                        </NavLink>
                    ))}
                </div>
            ))}

            <div className="admin-sidebar__version">v1.0.0 · ABMS Admin</div>
        </aside>
    );
}
