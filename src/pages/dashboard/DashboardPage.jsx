import {
    Settings,
    Gauge,
    Wrench,
    LayoutDashboard,
    ArrowRight,
    CheckCircle2,
    Clock,
    Lock,
    AlertCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import React, { useState, useEffect } from "react";
import maintenanceApi from "../../api/maintenanceApi";

const quickLinks = [
    {
        to: "/service-config",
        icon: Settings,
        label: "Cấu hình dịch vụ",
        desc: "Quản lý loại dịch vụ và biểu giá",
        color: "blue",
    },
    {
        to: "/meter-readings",
        icon: Gauge,
        label: "Ghi chỉ số",
        desc: "Nhập chỉ số điện/nước theo kỳ",
        color: "green",
    },
    {
        to: "/maintenance",
        icon: Wrench,
        label: "Yêu cầu bảo trì",
        desc: "Theo dõi và xử lý yêu cầu bảo trì",
        color: "yellow",
    },
];

export default function DashboardPage() {
    const [maintenanceStats, setMaintenanceStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // In a real app we might fetch stats for other modules too
                const res = await maintenanceApi.getStatistics();
                setMaintenanceStats(res.data.result);
            } catch (error) {
                console.error("Failed to fetch dashboard stats", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    return (
        <div>
            {/* Page Header */}
            <div className="page-header">
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <LayoutDashboard size={24} />
                    <div>
                        <h1 className="page-header__title">Dashboard</h1>
                        <p className="page-header__subtitle">
                            Tổng quan hệ thống
                        </p>
                    </div>
                </div>
            </div>

            <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem", color: "var(--color-text)" }}>
                Thống kê bảo trì
            </h2>
            {/* Stats */}
            <div className="stats-grid" style={{ marginBottom: "2rem" }}>
                <div className="stat-card">
                    <div className="stat-card__icon stat-card__icon--blue">
                        <Wrench size={22} />
                    </div>
                    <div>
                        <div className="stat-card__value">
                            {loading ? "..." : (maintenanceStats?.totalRequests ?? 0)}
                        </div>
                        <div className="stat-card__label">Tổng yêu cầu</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-card__icon stat-card__icon--yellow">
                        <Clock size={22} />
                    </div>
                    <div>
                        <div className="stat-card__value">
                            {loading ? "..." : (maintenanceStats?.byStatus?.PENDING ?? 0)}
                        </div>
                        <div className="stat-card__label">Chờ xử lý</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-card__icon stat-card__icon--green">
                        <CheckCircle2 size={22} />
                    </div>
                    <div>
                        <div className="stat-card__value">
                            {loading ? "..." : (maintenanceStats?.byStatus?.IN_PROGRESS ?? 0)}
                        </div>
                        <div className="stat-card__label">Đang xử lý</div>
                    </div>
                </div>
                
                <div className="stat-card">
                    <div className="stat-card__icon stat-card__icon--red">
                        <AlertCircle size={22} />
                    </div>
                    <div>
                        <div className="stat-card__value">
                            {loading ? "..." : (maintenanceStats?.byStatus?.CANCELLED ?? 0)}
                        </div>
                        <div className="stat-card__label">Đã huỷ</div>
                    </div>
                </div>
            </div>

            {/* Quick Links */}
            <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem", color: "var(--color-text)" }}>
                Truy cập nhanh
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
                {quickLinks.map(({ to, icon: Icon, label, desc, color }) => (
                    <Link
                        key={to}
                        to={to}
                        style={{ textDecoration: "none" }}
                    >
                        <div
                            className="card card-body"
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "1rem",
                                cursor: "pointer",
                                transition: "box-shadow 0.15s",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "var(--shadow-md)")}
                            onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "var(--shadow)")}
                        >
                            <div
                                className={`stat-card__icon stat-card__icon--${color}`}
                                style={{ width: 44, height: 44, borderRadius: 10 }}
                            >
                                <Icon size={20} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 600, color: "var(--color-text)", fontSize: "0.9rem" }}>{label}</div>
                                <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>{desc}</div>
                            </div>
                            <ArrowRight size={16} color="var(--color-text-muted)" />
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
