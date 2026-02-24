import { NavLink } from "react-router-dom";
import {
    LayoutDashboard,
    Settings,
    Gauge,
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
