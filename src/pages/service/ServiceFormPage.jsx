import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Save, ArrowLeft, CheckCircle, CircleSlash } from "lucide-react";
import { serviceApi } from "../../services/serviceApi";

const BILLING_OPTIONS = [
    { value: "FIXED", label: "Fixed – Phí cố định" },
    { value: "AREA", label: "Area – Theo diện tích" },
    { value: "TIER", label: "Tier – Bậc thang lũy tiến" },
];

const DEFAULT_FORM = {
    code: "",
    name: "",
    unit: "",
    billingMethod: "FIXED",
    isRecurring: true,
    taxable: true,
    description: "",
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

export default function ServiceFormPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = Boolean(id);

    const [form, setForm] = useState(DEFAULT_FORM);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(isEdit);
    const [errors, setErrors] = useState({});
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((msg, type = "success") => {
        const id = ++toastId;
        setToasts((t) => [...t, { id, msg, type }]);
        setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
    }, []);

    // Load data if edit
    useEffect(() => {
        if (isEdit) {
            const fetchService = async () => {
                try {
                    const res = await serviceApi.getAll();
                    const allServices = res.data?.result ?? [];
                    const service = allServices.find(s => s.id === id);
                    if (service) {
                        setForm({
                            code: service.code ?? "",
                            name: service.name ?? "",
                            unit: service.unit ?? "",
                            billingMethod: service.billingMethod ?? "FIXED",
                            isRecurring: service.isRecurring ?? true,
                            taxable: service.taxable ?? true,
                            description: service.description ?? "",
                        });
                    } else {
                        addToast("Không tìm thấy dịch vụ", "error");
                        setTimeout(() => navigate("/service-config"), 1500);
                    }
                } catch (err) {
                    addToast("Lỗi khi tải thông tin dịch vụ", "error");
                } finally {
                    setFetching(false);
                }
            };
            fetchService();
        }
    }, [id, isEdit, navigate, addToast]);

    const set = (field, value) => {
        setForm((f) => ({ ...f, [field]: value }));
        setErrors((e) => ({ ...e, [field]: undefined }));
    };

    const validate = () => {
        const e = {};
        if (!form.code.trim()) e.code = "Mã dịch vụ không được để trống";
        if (form.code.length > 50) e.code = "Mã dịch vụ tối đa 50 ký tự";
        if (!form.name.trim()) e.name = "Tên dịch vụ không được để trống";
        if (form.name.length > 100) e.name = "Tên dịch vụ tối đa 100 ký tự";
        if (form.unit.length > 20) e.unit = "Đơn vị tối đa 20 ký tự";
        if (form.description.length > 500) e.description = "Mô tả tối đa 500 ký tự";
        return e;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length > 0) { setErrors(errs); return; }

        setLoading(true);
        try {
            const payload = {
                code: form.code.trim(),
                name: form.name.trim(),
                unit: form.unit.trim() || undefined,
                billingMethod: form.billingMethod,
                isRecurring: form.isRecurring,
                taxable: form.taxable,
                description: form.description.trim() || undefined,
            };
            if (isEdit) {
                await serviceApi.update(id, payload);
                addToast("Cập nhật dịch vụ thành công");
            } else {
                await serviceApi.create(payload);
                addToast("Tạo dịch vụ thành công");
            }
            setTimeout(() => navigate("/service-config"), 1000);
        } catch (err) {
            const msg = err.response?.data?.message ?? "Thao tác thất bại";
            addToast(msg, "error");
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return <div style={{ padding: "2rem", textAlign: "center" }}>Đang tải...</div>;
    }

    return (
        <div>
            {/* Page Header */}
            <div className="page-header">
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => navigate("/service-config")}>
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h1 className="page-header__title">
                            {isEdit ? "Chỉnh sửa dịch vụ" : "Thêm dịch vụ mới"}
                        </h1>
                        <p className="page-header__subtitle">
                            {isEdit ? `Chỉnh sửa thông tin cho mã: ${form.code}` : "Nhập thông tin để tạo dịch vụ mới"}
                        </p>
                    </div>
                </div>
            </div>

            <div className="card" style={{ maxWidth: 800, margin: "0 auto" }}>
                <form onSubmit={handleSubmit} style={{ padding: "1.5rem" }}>
                    <div className="form-row">
                        {/* Service Name */}
                        <div className="form-group">
                            <label className="form-label">
                                Tên dịch vụ <span>*</span>
                            </label>
                            <input
                                className="form-input"
                                placeholder="vd. Điện, Nước, Đỗ xe..."
                                value={form.name}
                                onChange={(e) => set("name", e.target.value)}
                                autoFocus
                            />
                            {errors.name && <p style={{ color: "var(--color-danger)", fontSize: "0.78rem", marginTop: 4 }}>{errors.name}</p>}
                        </div>

                        {/* Service Code */}
                        <div className="form-group">
                            <label className="form-label">
                                Mã dịch vụ <span>*</span>
                                <span style={{ fontWeight: 400, color: "var(--color-text-muted)", marginLeft: 4 }}>(Unique)</span>
                            </label>
                            <input
                                className="form-input"
                                placeholder="vd. SVC_ELEC"
                                value={form.code}
                                onChange={(e) => set("code", e.target.value.toUpperCase())}
                                disabled={isEdit}
                                style={isEdit ? { background: "#f1f5f9", cursor: "not-allowed" } : {}}
                            />
                            {isEdit && (
                                <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: 3 }}>
                                    Mã không thể thay đổi sau khi tạo
                                </p>
                            )}
                            {errors.code && <p style={{ color: "var(--color-danger)", fontSize: "0.78rem", marginTop: 4 }}>{errors.code}</p>}
                        </div>
                    </div>

                    <div className="form-row">
                        {/* Unit */}
                        <div className="form-group">
                            <label className="form-label">Đơn vị đo</label>
                            <input
                                className="form-input"
                                placeholder="vd. kWh, m³, Tháng"
                                value={form.unit}
                                onChange={(e) => set("unit", e.target.value)}
                            />
                            {errors.unit && <p style={{ color: "var(--color-danger)", fontSize: "0.78rem", marginTop: 4 }}>{errors.unit}</p>}
                        </div>

                        {/* Billing Method */}
                        <div className="form-group">
                            <label className="form-label">
                                Phương thức tính giá <span>*</span>
                            </label>
                            <select
                                className="form-select"
                                value={form.billingMethod}
                                onChange={(e) => set("billingMethod", e.target.value)}
                            >
                                {BILLING_OPTIONS.map((o) => (
                                    <option key={o.value} value={o.value}>
                                        {o.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Billing method info box */}
                    <div style={{
                        padding: "0.75rem 1rem",
                        background: "#eff6ff",
                        border: "1px solid #bfdbfe",
                        borderRadius: "var(--radius)",
                        fontSize: "0.8rem",
                        color: "#1e40af",
                        marginBottom: "1rem",
                    }}>
                        {form.billingMethod === "FIXED" && "📋 Fixed: Phí cố định mỗi kỳ, không phụ thuộc mức sử dụng (VD: phí gửi xe, wifi)."}
                        {form.billingMethod === "AREA" && "📐 Area: Tính phí theo diện tích căn hộ (VD: phí quản lý tính theo m²)."}
                        {form.billingMethod === "TIER" && "📈 Tier: Bậc thang lũy tiến, phí thay đổi theo mức tiêu thụ. Dùng cho điện, nước. Cần cấu hình biểu giá bậc thang."}
                    </div>

                    <div className="form-row" style={{ gridTemplateColumns: "1fr 1fr" }}>
                        {/* isRecurring */}
                        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                            <input
                                type="checkbox"
                                id="isRecurring"
                                checked={form.isRecurring}
                                onChange={(e) => set("isRecurring", e.target.checked)}
                                style={{ width: 16, height: 16, cursor: "pointer" }}
                            />
                            <label htmlFor="isRecurring" style={{ fontSize: "0.875rem", cursor: "pointer", userSelect: "none" }}>
                                Thu theo kỳ định kỳ
                            </label>
                        </div>
                        {/* taxable */}
                        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                            <input
                                type="checkbox"
                                id="taxable"
                                checked={form.taxable}
                                onChange={(e) => set("taxable", e.target.checked)}
                                style={{ width: 16, height: 16, cursor: "pointer" }}
                            />
                            <label htmlFor="taxable" style={{ fontSize: "0.875rem", cursor: "pointer", userSelect: "none" }}>
                                Áp dụng thuế VAT
                            </label>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="form-group" style={{ marginTop: "1.5rem" }}>
                        <label className="form-label">Mô tả</label>
                        <textarea
                            className="form-textarea"
                            rows={4}
                            placeholder="Mô tả thêm về dịch vụ (không bắt buộc)..."
                            value={form.description}
                            onChange={(e) => set("description", e.target.value)}
                            style={{ resize: "vertical" }}
                        />
                        <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: 3 }}>
                            {form.description.length}/500
                        </p>
                        {errors.description && <p style={{ color: "var(--color-danger)", fontSize: "0.78rem", marginTop: 4 }}>{errors.description}</p>}
                    </div>

                    {/* Footer Actions */}
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "2rem", paddingTop: "1.5rem", borderTop: "1px solid var(--color-border)" }}>
                        <button type="button" className="btn btn-secondary" onClick={() => navigate("/service-config")}>
                            Hủy
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            <Save size={15} />
                            {loading ? "Đang lưu..." : isEdit ? "Lưu thay đổi" : "Tạo dịch vụ"}
                        </button>
                    </div>
                </form>
            </div>

            <Toast toasts={toasts} />
        </div>
    );
}
