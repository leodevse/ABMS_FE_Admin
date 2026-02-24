import {
    Settings,
    Gauge,
    LayoutDashboard,
    ArrowRight,
    CheckCircle2,
    Clock,
    Lock,
} from "lucide-react";
import { Link } from "react-router-dom";

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
];

export default function DashboardPage() {
    const currentPeriod = new Date().toISOString().slice(0, 7); // YYYY-MM

    return (
        <div>
            {/* Page Header */}
            <div className="page-header">
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <LayoutDashboard size={24} />
                    <div>
                        <h1 className="page-header__title">Dashboard</h1>
                        <p className="page-header__subtitle">
                            Tổng quan hệ thống – Kỳ {currentPeriod}
                        </p>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-card__icon stat-card__icon--blue">
                        <Settings size={22} />
                    </div>
                    <div>
                        <div className="stat-card__value">–</div>
                        <div className="stat-card__label">Dịch vụ đang hoạt động</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-card__icon stat-card__icon--yellow">
                        <Clock size={22} />
                    </div>
                    <div>
                        <div className="stat-card__value">–</div>
                        <div className="stat-card__label">Chỉ số chờ xác nhận (DRAFT)</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-card__icon stat-card__icon--green">
                        <CheckCircle2 size={22} />
                    </div>
                    <div>
                        <div className="stat-card__value">–</div>
                        <div className="stat-card__label">Đã xác nhận (CONFIRMED)</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-card__icon" style={{ background: "#f1f5f9", color: "#475569" }}>
                        <Lock size={22} />
                    </div>
                    <div>
                        <div className="stat-card__value">–</div>
                        <div className="stat-card__label">Đã khóa (LOCKED)</div>
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

            {/* Note */}
            <div
                style={{
                    marginTop: "2rem",
                    padding: "1rem 1.25rem",
                    background: "#eff6ff",
                    border: "1px solid #bfdbfe",
                    borderRadius: "var(--radius)",
                    fontSize: "0.83rem",
                    color: "#1d4ed8",
                }}
            >
                💡 <strong>Phase 4:</strong> Dashboard sẽ hiển thị số liệu thực từ API sau khi các module được hoàn thiện.
            </div>
        </div>
    );
}
