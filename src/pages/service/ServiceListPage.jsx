import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Settings, RefreshCw, CircleSlash, CheckCircle } from "lucide-react";
import { serviceApi } from "../../api/serviceApi";
import ServiceFormModal from "./ServiceFormModal";
import TariffModal from "./TariffModal";

// ── helpers ──────────────────────────────────────────────────
const BILLING_LABEL = {
    METERED: { text: "Metered", cls: "badge--metered" },
    FLAT: { text: "Flat", cls: "badge--flat" },
    TIER: { text: "Tiered", cls: "badge--tier" },
};

function Toast({ toasts }) {
    return (
        <div className="toast-container">
            {toasts.map((t) => (
                <div key={t.id} className={`toast toast--${t.type}`}>
                    {t.type === "success" ? (
                        <CheckCircle size={16} color="var(--color-success)" />
                    ) : (
                        <CircleSlash size={16} color="var(--color-danger)" />
                    )}
                    {t.msg}
                </div>
            ))}
        </div>
    );
}

let toastId = 0;

export default function ServiceListPage() {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");

    // Modal state
    const [formModal, setFormModal] = useState({ open: false, service: null }); // null = create
    const [tariffModal, setTariffModal] = useState({ open: false, service: null });

    // Toast
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((msg, type = "success") => {
        const id = ++toastId;
        setToasts((t) => [...t, { id, msg, type }]);
        setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
    }, []);

    // ── fetch ──────────────────────────────────────────────────
    const fetchServices = useCallback(async () => {
        setLoading(true);
        try {
            const res = await serviceApi.getAll();
            setServices(res.data?.result ?? []);
        } catch (err) {
            addToast("Không thể tải danh sách dịch vụ", "error");
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        fetchServices();
    }, [fetchServices]);

    // ── filter ────────────────────────────────────────────────
    const filtered = services.filter((s) => {
        const q = search.toLowerCase();
        return (
            s.name?.toLowerCase().includes(q) || s.code?.toLowerCase().includes(q)
        );
    });

    // ── toggle active ─────────────────────────────────────────
    const handleToggleActive = async (svc) => {
        try {
            if (svc.isActive) {
                await serviceApi.deactivate(svc.id);
                addToast(`Đã vô hiệu hóa dịch vụ "${svc.name}"`);
            } else {
                await serviceApi.activate(svc.id);
                addToast(`Đã kích hoạt dịch vụ "${svc.name}"`);
            }
            fetchServices();
        } catch (err) {
            const msg = err.response?.data?.message ?? "Thao tác thất bại";
            addToast(msg, "error");
        }
    };

    // ── modal callbacks ───────────────────────────────────────
    const onFormSaved = () => {
        setFormModal({ open: false, service: null });
        addToast(
            formModal.service ? "Cập nhật dịch vụ thành công" : "Tạo dịch vụ thành công"
        );
        fetchServices();
    };

    const onTariffSaved = () => {
        setTariffModal({ open: false, service: null });
        addToast("Cập nhật biểu giá thành công");
        fetchServices();
    };

    // ─────────────────────────────────────────────────────────
    return (
        <div>
            {/* Page Header */}
            <div className="page-header">
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <Settings size={24} />
                    <div>
                        <h1 className="page-header__title">Quản lý dịch vụ</h1>
                        <p className="page-header__subtitle">
                            Cấu hình loại dịch vụ và thiết lập biểu giá
                        </p>
                    </div>
                </div>
            </div>

            {/* Table Card */}
            <div className="card">
                {/* Toolbar */}
                <div className="toolbar">
                    <div className="toolbar__search">
                        <Search className="search-icon" />
                        <input
                            className="form-input"
                            placeholder="Tìm theo tên hoặc mã..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="toolbar__actions">
                        <button
                            className="btn btn-secondary btn-sm"
                            onClick={fetchServices}
                            disabled={loading}
                            title="Làm mới"
                        >
                            <RefreshCw size={15} style={loading ? { animation: "spin 1s linear infinite" } : {}} />
                        </button>
                        <button
                            className="btn btn-primary btn-sm"
                            onClick={() => setFormModal({ open: true, service: null })}
                        >
                            <Plus size={16} />
                            Thêm dịch vụ
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div style={{ overflowX: "auto" }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Tên dịch vụ</th>
                                <th>Mã</th>
                                <th>Đơn vị</th>
                                <th>Loại tính giá</th>
                                <th>Định kỳ</th>
                                <th>Trạng thái</th>
                                <th style={{ textAlign: "center" }}>Biểu giá</th>
                                <th style={{ textAlign: "center" }}>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && (
                                <tr>
                                    <td colSpan={8} style={{ textAlign: "center", padding: "2.5rem", color: "var(--color-text-muted)" }}>
                                        <RefreshCw size={20} style={{ animation: "spin 1s linear infinite", marginRight: 8 }} />
                                        Đang tải...
                                    </td>
                                </tr>
                            )}
                            {!loading && filtered.length === 0 && (
                                <tr>
                                    <td colSpan={8} style={{ textAlign: "center", padding: "2.5rem", color: "var(--color-text-muted)" }}>
                                        Không tìm thấy dịch vụ nào.
                                    </td>
                                </tr>
                            )}
                            {!loading &&
                                filtered.map((svc) => {
                                    const billing = BILLING_LABEL[svc.billingMethod] ?? {
                                        text: svc.billingMethod,
                                        cls: "",
                                    };
                                    return (
                                        <tr key={svc.id}>
                                            <td style={{ fontWeight: 600 }}>{svc.name}</td>
                                            <td>
                                                <code style={{ fontSize: "0.8rem", background: "#f1f5f9", padding: "0.1rem 0.4rem", borderRadius: 4 }}>
                                                    {svc.code}
                                                </code>
                                            </td>
                                            <td>{svc.unit ?? "–"}</td>
                                            <td>
                                                <span className={`badge ${billing.cls}`}>{billing.text}</span>
                                            </td>
                                            <td>{svc.isRecurring ? "✓" : "–"}</td>
                                            <td>
                                                <span className={`badge ${svc.isActive ? "badge--active" : "badge--inactive"}`}>
                                                    {svc.isActive ? "Active" : "Inactive"}
                                                </span>
                                            </td>
                                            {/* Pricing config */}
                                            <td style={{ textAlign: "center" }}>
                                                <button
                                                    className="btn btn-ghost btn-sm"
                                                    onClick={() => setTariffModal({ open: true, service: svc })}
                                                    title="Cấu hình biểu giá"
                                                >
                                                    Biểu giá
                                                </button>
                                            </td>
                                            {/* Actions */}
                                            <td>
                                                <div style={{ display: "flex", gap: "0.4rem", justifyContent: "center" }}>
                                                    {/* Edit */}
                                                    <button
                                                        className="icon-btn"
                                                        title="Chỉnh sửa"
                                                        onClick={() => setFormModal({ open: true, service: svc })}
                                                    >
                                                        ✏
                                                    </button>
                                                    {/* Toggle activate/deactivate */}
                                                    <button
                                                        className={`icon-btn ${svc.isActive ? "danger" : "success"}`}
                                                        title={svc.isActive ? "Vô hiệu hóa" : "Kích hoạt"}
                                                        onClick={() => handleToggleActive(svc)}
                                                    >
                                                        <CircleSlash size={15} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                        </tbody>
                    </table>
                </div>

                {/* Footer count */}
                {!loading && filtered.length > 0 && (
                    <div style={{ padding: "0.75rem 1.5rem", fontSize: "0.8rem", color: "var(--color-text-muted)", borderTop: "1px solid var(--color-border)" }}>
                        Hiển thị {filtered.length} / {services.length} dịch vụ
                        {search && ` (đang lọc theo "${search}")`}
                    </div>
                )}
            </div>

            {/* Modals */}
            {formModal.open && (
                <ServiceFormModal
                    service={formModal.service}
                    onSaved={onFormSaved}
                    onClose={() => setFormModal({ open: false, service: null })}
                    onError={(msg) => addToast(msg, "error")}
                />
            )}
            {tariffModal.open && (
                <TariffModal
                    service={tariffModal.service}
                    onSaved={onTariffSaved}
                    onClose={() => setTariffModal({ open: false, service: null })}
                    onError={(msg) => addToast(msg, "error")}
                />
            )}

            <Toast toasts={toasts} />

            <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
        </div>
    );
}
