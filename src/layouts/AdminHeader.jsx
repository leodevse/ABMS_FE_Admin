import { useState, useRef, useEffect } from "react";
import {
  Building2,
  Bell,
  User,
  Settings,
  LogOut,
  ChevronDown,
  X,
} from "lucide-react";

import { jwtDecode } from "jwt-decode";
import { useAuth } from "../context/AuthContext";

// Mock notifications – sẽ thay bằng API sau
const MOCK_NOTIFICATIONS = [
  { id: 1, text: "Hóa đơn tháng 2 đã đến hạn", time: "2 giờ trước", read: false },
  { id: 2, text: "Thanh toán đã được duyệt", time: "1 ngày trước", read: false },
  { id: 3, text: "Thông báo bảo trì thang máy", time: "3 ngày trước", read: true },
];

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
      }}
    >
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
        <button onClick={onClose} style={{ border: "none", background: "none" }}>
          <X size={16} />
        </button>
      </div>

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
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: n.read ? "#cbd5e1" : "var(--color-primary)",
                marginTop: 5,
              }}
            />
            <div>
              <div style={{ fontSize: "0.875rem", fontWeight: n.read ? 400 : 600 }}>
                {n.text}
              </div>
              <div style={{ fontSize: "0.775rem", color: "#64748b" }}>
                {n.time}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Profile Dropdown ─── */
function ProfileDropdown({ onClose, user, logout }) {
  const items = [
    { icon: User, label: "Thông tin cá nhân" },
    { icon: Settings, label: "Cài đặt tài khoản" },
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
      }}
    >
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
          }}
        >
          {user.name?.charAt(0).toUpperCase()}
        </div>

        <div>
          <div style={{ fontWeight: 700 }}>{user.name}</div>
          <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
            {user.email}
          </div>
        </div>
      </div>

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
              border: "none",
              background: "none",
              cursor: "pointer",
            }}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}

        <div style={{ borderTop: "1px solid var(--color-border)" }} />

        <button
          onClick={() => {
            logout();
            onClose();
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            width: "100%",
            padding: "0.75rem 1.25rem",
            border: "none",
            background: "none",
            color: "red",
            cursor: "pointer",
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
  const { token, logout } = useAuth();

  const [showNotif, setShowNotif] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const notifRef = useRef(null);
  const profileRef = useRef(null);

  useOutsideClick(notifRef, () => setShowNotif(false));
  useOutsideClick(profileRef, () => setShowProfile(false));

  const unreadCount = MOCK_NOTIFICATIONS.filter((n) => !n.read).length;

  let user = {
    name: "User",
    email: "",
    role: "",
  };

  if (token) {
    try {
      const decoded = jwtDecode(token);

      user = {
        name: decoded.sub?.split("@")[0],
        email: decoded.sub,
        role: decoded.scope,
      };
    } catch (err) {
      console.error("JWT decode error", err);
    }
  }

  return (
    <header className="admin-header">
      {/* Logo */}
      <a className="admin-header__logo" href="/">
        <div className="admin-header__logo-icon">
          <Building2 size={18} />
        </div>

        <div>
          <div style={{ fontWeight: 700 }}>ABMS Admin</div>
          <div style={{ fontSize: "0.7rem", color: "#64748b" }}>
            Building Management System
          </div>
        </div>
      </a>

      <div className="admin-header__right">
        {/* Notification */}
        <div ref={notifRef} style={{ position: "relative" }}>
          <button
            onClick={() => {
              setShowNotif(!showNotif);
              setShowProfile(false);
            }}
            style={{ background: "none", border: "none", cursor: "pointer" }}
          >
            <Bell size={22} />

            {unreadCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  background: "red",
                  color: "white",
                  fontSize: "0.6rem",
                  borderRadius: "50%",
                  padding: "2px 5px",
                }}
              >
                {unreadCount}
              </span>
            )}
          </button>

          {showNotif && (
            <NotificationDropdown onClose={() => setShowNotif(false)} />
          )}
        </div>

        {/* Profile */}
        <div ref={profileRef} style={{ position: "relative" }}>
          <button
            onClick={() => {
              setShowProfile(!showProfile);
              setShowNotif(false);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              border: "none",
              background: "none",
              cursor: "pointer",
            }}
          >
            <div className="admin-header__avatar">
              {user.name?.charAt(0).toUpperCase()}
            </div>

            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: "0.875rem", fontWeight: 600 }}>
                {user.name}
              </div>
              <div style={{ fontSize: "0.7rem", color: "#64748b" }}>
                {user.role}
              </div>
            </div>

            <ChevronDown size={16} />
          </button>

          {showProfile && (
            <ProfileDropdown
              user={user}
              logout={logout}
              onClose={() => setShowProfile(false)}
            />
          )}
        </div>
      </div>
    </header>
  );
}