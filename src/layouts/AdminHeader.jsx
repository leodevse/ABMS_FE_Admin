import { useState, useRef, useEffect } from "react";
import { Building2, Bell, User, Settings, LogOut, ChevronDown, X } from "lucide-react";

// Mock notifications – sẽ thay bằng API sau
const MOCK_NOTIFICATIONS = [
    { id: 1, text: "Hóa đơn tháng 2 đã đến hạn", time: "2 giờ trước", read: false },
    { id: 2, text: "Thanh toán đã được duyệt", time: "1 ngày trước", read: false },
    { id: 3, text: "Thông báo bảo trì thang máy", time: "3 ngày trước", read: true },
];

const ADMIN_USER = {
    name: "Administrator",
    email: "admin@abms.vn",
    role: "Admin",
};

function useOutsideClick(ref, onClose) {
    useEffect(() => {
        function handler(e) {
            if (ref.current && !ref.current.contains(e.target)) onClose();
        }
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [ref, onClose]);
}

/* ─── Notification Dropdown ─── */
function NotificationDropdown({ onClose }) {
    const unread = MOCK_NOTIFICATIONS.filter((n) => !n.read).length;

    return (
        <div
            style={{
                position: "absolute",
                top: "calc(100% + 12px)",
                right: 0,
                width: 360,
                background: "white",
                borderRadius: "0.75rem",
                boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                border: "1px solid var(--color-border)",
                zIndex: 500,
                overflow: "hidden",
                animation: "slideUp 0.18s ease",
            }}
        >
            {/* Header */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "1rem 1.25rem 0.75rem",
                    borderBottom: "1px solid var(--color-border)",
                }}
            >
                <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>Thông báo</span>
                <button className="icon-btn" onClick={onClose} style={{ border: "none" }}>
                    <X size={16} />
                </button>
            </div>

            {/* List */}
            <div>
                {MOCK_NOTIFICATIONS.map((n) => (
                    <div
                        key={n.id}
                        style={{
                            display: "flex",
                            gap: "0.875rem",
                            padding: "0.875rem 1.25rem",
                            background: n.read ? "transparent" : "#eff6ff",
                            borderBottom: "1px solid var(--color-border)",
                            cursor: "pointer",
                            transition: "background 0.12s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#f1f5f9")}
                        onMouseLeave={(e) =>
                            (e.currentTarget.style.background = n.read ? "transparent" : "#eff6ff")
                        }
                    >
                        {/* Dot */}
                        <div
                            style={{
                                width: 10,
                                height: 10,
                                borderRadius: "50%",
                                background: n.read ? "#cbd5e1" : "var(--color-primary)",
                                marginTop: 5,
                                flexShrink: 0,
                            }}
                        />
                        <div>
                            <div
                                style={{
                                    fontSize: "0.875rem",
                                    fontWeight: n.read ? 400 : 600,
                                    color: "var(--color-text)",
                                }}
                            >
                                {n.text}
                            </div>
                            <div style={{ fontSize: "0.775rem", color: "var(--color-text-muted)", marginTop: 2 }}>
                                {n.time}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div style={{ padding: "0.875rem 1.25rem", textAlign: "center" }}>
                <button
                    style={{
                        background: "none",
                        border: "none",
                        color: "var(--color-primary)",
                        fontWeight: 600,
                        fontSize: "0.875rem",
                        cursor: "pointer",
                    }}
                >
                    Xem tất cả thông báo
                </button>
            </div>
        </div>
    );
}

/* ─── Profile Dropdown ─── */
function ProfileDropdown({ onClose }) {
    const items = [
        { icon: User, label: "Thông tin cá nhân", danger: false },
        { icon: Settings, label: "Cài đặt tài khoản", danger: false },
    ];

    return (
        <div
            style={{
                position: "absolute",
                top: "calc(100% + 12px)",
                right: 0,
                width: 280,
                background: "white",
                borderRadius: "0.75rem",
                boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                border: "1px solid var(--color-border)",
                zIndex: 500,
                overflow: "hidden",
                animation: "slideUp 0.18s ease",
            }}
        >
            {/* User info */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    padding: "1rem 1.25rem",
                    background: "#eff6ff",
                    borderBottom: "1px solid var(--color-border)",
                }}
            >
                <div
                    style={{
                        width: 42,
                        height: 42,
                        borderRadius: "50%",
                        background: "var(--color-primary)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontWeight: 700,
                        fontSize: "1rem",
                        flexShrink: 0,
                    }}
                >
                    A
                </div>
                <div>
                    <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--color-text)" }}>
                        {ADMIN_USER.name}
                    </div>
                    <div style={{ fontSize: "0.775rem", color: "var(--color-text-muted)" }}>
                        {ADMIN_USER.email}
                    </div>
                </div>
            </div>

            {/* Menu items */}
            <div style={{ padding: "0.4rem 0" }}>
                {items.map(({ icon: Icon, label }) => (
                    <button
                        key={label}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.75rem",
                            width: "100%",
                            padding: "0.75rem 1.25rem",
                            background: "none",
                            border: "none",
                            color: "var(--color-text)",
                            fontSize: "0.875rem",
                            cursor: "pointer",
                            textAlign: "left",
                            transition: "background 0.12s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#f1f5f9")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                    >
                        <Icon size={16} color="var(--color-text-muted)" />
                        {label}
                    </button>
                ))}

                <div style={{ borderTop: "1px solid var(--color-border)", margin: "0.4rem 0" }} />

                {/* Logout */}
                <button
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                        width: "100%",
                        padding: "0.75rem 1.25rem",
                        background: "none",
                        border: "none",
                        color: "var(--color-danger)",
                        fontSize: "0.875rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "background 0.12s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#fef2f2")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                    onClick={() => {
                        localStorage.removeItem("abms_token");
                        onClose();
                    }}
                >
                    <LogOut size={16} />
                    Đăng xuất
                </button>
            </div>
        </div>
    );
}

/* ─── Main Header ─── */
export default function AdminHeader() {
    const [showNotif, setShowNotif] = useState(false);
    const [showProfile, setShowProfile] = useState(false);

    const notifRef = useRef(null);
    const profileRef = useRef(null);

    useOutsideClick(notifRef, () => setShowNotif(false));
    useOutsideClick(profileRef, () => setShowProfile(false));

    const unreadCount = MOCK_NOTIFICATIONS.filter((n) => !n.read).length;

    return (
        <header className="admin-header">
            {/* Logo */}
            <a className="admin-header__logo" href="/">
                <div className="admin-header__logo-icon">
                    <Building2 size={18} />
                </div>
                <div>
                    <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--color-primary)" }}>
                        ABMS Admin
                    </div>
                    <div style={{ fontSize: "0.65rem", color: "var(--color-text-muted)", fontWeight: 400 }}>
                        Building Management System
                    </div>
                </div>
            </a>

            {/* Right section */}
            <div className="admin-header__right">

                {/* ── Divider ── */}
                <div style={{ width: 1, height: 32, background: "#e2e8f0", margin: "0 0.25rem" }} />

                {/* ── Notification Bell ── */}
                <div ref={notifRef} style={{ position: "relative" }}>
                    <button
                        onClick={() => { setShowNotif((p) => !p); setShowProfile(false); }}
                        style={{
                            position: "relative",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            padding: "0.4rem",
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: showNotif ? "var(--color-primary)" : "var(--color-text-muted)",
                            transition: "color 0.15s",
                        }}
                    >
                        <Bell size={22} />
                        {unreadCount > 0 && (
                            <span
                                style={{
                                    position: "absolute",
                                    top: 2,
                                    right: 2,
                                    width: 17,
                                    height: 17,
                                    background: "var(--color-danger)",
                                    color: "white",
                                    fontSize: "0.65rem",
                                    fontWeight: 700,
                                    borderRadius: "50%",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    border: "2px solid white",
                                }}
                            >
                                {unreadCount}
                            </span>
                        )}
                    </button>
                    {showNotif && <NotificationDropdown onClose={() => setShowNotif(false)} />}
                </div>

                {/* ── Divider ── */}
                <div style={{ width: 1, height: 32, background: "#e2e8f0", margin: "0 0.25rem" }} />

                {/* ── Profile ── */}
                <div ref={profileRef} style={{ position: "relative" }}>
                    <button
                        onClick={() => { setShowProfile((p) => !p); setShowNotif(false); }}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            padding: "0.35rem 0.5rem",
                            borderRadius: "0.5rem",
                            transition: "background 0.15s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#f1f5f9")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                    >
                        <div className="admin-header__avatar">A</div>
                        <div style={{ textAlign: "left" }}>
                            <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-text)", lineHeight: 1.2 }}>
                                {ADMIN_USER.name}
                            </div>
                            <div style={{ fontSize: "0.7rem", color: "var(--color-text-muted)" }}>
                                {ADMIN_USER.role}
                            </div>
                        </div>
                        <ChevronDown
                            size={16}
                            color="var(--color-text-muted)"
                            style={{
                                transform: showProfile ? "rotate(180deg)" : "rotate(0deg)",
                                transition: "transform 0.2s",
                            }}
                        />
                    </button>
                    {showProfile && <ProfileDropdown onClose={() => setShowProfile(false)} />}
                </div>

            </div>
        </header>
    );
}
