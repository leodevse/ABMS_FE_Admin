import { useState, useEffect } from "react";
import { X, Save } from "lucide-react";
import { serviceApi } from "../../api/serviceApi";

// Must match backend enum BillingMethod { FIXED, AREA, METER, TIER }
const BILLING_OPTIONS = [
    { value: "METER", label: "Metered – Tính theo chỉ số" },
    { value: "FIXED", label: "Flat – Phí cố định" },
    { value: "AREA", label: "Area – Theo diện tích (m²)" },
    { value: "TIER", label: "Tiered – Bậc thang" },
];

const DEFAULT_FORM = {
    code: "",
    name: "",
    unit: "",
    billingMethod: "METER",
    isRecurring: true,
    taxable: true,
    description: "",
};

export default function ServiceFormModal({ service, onSaved, onClose, onError }) {
    const isEdit = Boolean(service);
    const [form, setForm] = useState(DEFAULT_FORM);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    // Pre-fill khi edit
    useEffect(() => {
        if (isEdit) {
            setForm({
                code: service.code ?? "",
                name: service.name ?? "",
                unit: service.unit ?? "",
                billingMethod: service.billingMethod ?? "METER",
                isRecurring: service.isRecurring ?? true,
                taxable: service.taxable ?? true,
                description: service.description ?? "",
            });
        }
    }, [isEdit, service]);

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
                await serviceApi.update(service.id, payload);
            } else {
                await serviceApi.create(payload);
            }
            onSaved();
        } catch (err) {
            const msg = err.response?.data?.message ?? "Lưu dịch vụ thất bại";
            onError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal">
                {/* Header */}
                <div className="modal-header">
                    <h2 className="modal-title">
                        {isEdit ? "Chỉnh sửa dịch vụ" : "Thêm dịch vụ mới"}
                    </h2>
                    <button className="icon-btn" onClick={onClose}>
                        <X size={16} />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
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
                            {form.billingMethod === "METER" && "📊 Metered: Tính phí theo chỉ số thực tế (điện, nước). Cần ghi chỉ số hàng tháng."}
                            {form.billingMethod === "FIXED" && "📋 Fixed: Phí cố định mỗi kỳ, không phụ thuộc mức sử dụng."}
                            {form.billingMethod === "AREA" && "📐 Area: Phí tính theo diện tích (ví dụ: phí quản lý theo m²)."}
                            {form.billingMethod === "TIER" && "📈 Tiered: Bậc thang lũy tiến – phí thay đổi theo mức sử dụng. Cần cấu hình biểu giá bậc thang."}
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
                        <div className="form-group" style={{ marginTop: "1rem" }}>
                            <label className="form-label">Mô tả</label>
                            <textarea
                                className="form-textarea"
                                rows={3}
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
                    </div>

                    {/* Footer */}
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Hủy
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            <Save size={15} />
                            {loading ? "Đang lưu..." : isEdit ? "Lưu thay đổi" : "Tạo dịch vụ"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
