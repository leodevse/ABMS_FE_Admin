import {
    Settings,
    Gauge,
    Wrench,
    LayoutDashboard,
    ArrowRight,
    CheckCircle2,
    Clock,
    AlertCircle,
    PieChart,
    Layers,
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

    const statusData = [
        { key: "PENDING", label: "Chờ xử lý", color: "#f59e0b" },
        { key: "IN_PROGRESS", label: "Đang xử lý", color: "#2563eb" },
        { key: "COMPLETED", label: "Hoàn thành", color: "#16a34a" },
        { key: "CANCELLED", label: "Đã huỷ", color: "#dc2626" },
    ].map((item) => ({
        ...item,
        value: maintenanceStats?.byStatus?.[item.key] ?? 0,
    }));

    const categoryData = [
        { key: "REPAIR", label: "Sửa chữa" },
        { key: "MAINTENANCE", label: "Bảo trì" },
        { key: "SERVICE", label: "Dịch vụ" },
        { key: "CLEANING", label: "Vệ sinh" },
        { key: "OTHER", label: "Khác" },
    ].map((item) => ({
        ...item,
        value: maintenanceStats?.byCategory?.[item.key] ?? 0,
    }));

    const maxStatus = Math.max(1, ...statusData.map((d) => d.value));
    const maxCategory = Math.max(1, ...categoryData.map((d) => d.value));

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

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "2rem" }}>
                <div className="card">
                    <div className="card-body" style={{ borderBottom: "1px solid var(--color-border)", background: "#f8fafc", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <PieChart size={18} />
                        <h3 style={{ fontSize: "0.9rem", fontWeight: 700 }}>Biểu đồ theo trạng thái</h3>
                    </div>
                    <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                        {statusData.map((item) => (
                            <div key={item.key}>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", marginBottom: "0.3rem" }}>
                                    <span style={{ fontWeight: 600 }}>{item.label}</span>
                                    <span>{item.value}</span>
                                </div>
                                <div style={{ height: 8, background: "#e2e8f0", borderRadius: 999 }}>
                                    <div style={{ height: "100%", width: `${(item.value / maxStatus) * 100}%`, background: item.color, borderRadius: 999 }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="card">
                    <div className="card-body" style={{ borderBottom: "1px solid var(--color-border)", background: "#f8fafc", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <Layers size={18} />
                        <h3 style={{ fontSize: "0.9rem", fontWeight: 700 }}>Biểu đồ theo danh mục</h3>
                    </div>
                    <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                        {categoryData.map((item) => (
                            <div key={item.key}>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", marginBottom: "0.3rem" }}>
                                    <span style={{ fontWeight: 600 }}>{item.label}</span>
                                    <span>{item.value}</span>
                                </div>
                                <div style={{ height: 8, background: "#e2e8f0", borderRadius: 999 }}>
                                    <div style={{ height: "100%", width: `${(item.value / maxCategory) * 100}%`, background: "#6366f1", borderRadius: 999 }} />
                                </div>
                            </div>
                        ))}
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
