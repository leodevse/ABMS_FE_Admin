import { useState, useEffect } from "react";
import { X, Plus, Trash2, Save } from "lucide-react";
import { tariffApi } from "../../api/serviceApi";

const fmt = (n) => (n !== undefined && n !== null ? String(n) : "");

function TierRow({ tier, idx, onChange, onRemove, isLast }) {
    return (
        <tr>
            <td style={{ paddingRight: 8 }}>
                <input
                    className="form-input"
                    type="number"
                    min={0}
                    placeholder="0"
                    value={fmt(tier.minVal)}
                    onChange={(e) => onChange(idx, "minVal", e.target.value)}
                    style={{ textAlign: "right" }}
                />
            </td>
            <td style={{ paddingRight: 8 }}>
                {isLast ? (
                    <input
                        className="form-input"
                        value="∞"
                        disabled
                        style={{ background: "#f1f5f9", textAlign: "center", cursor: "not-allowed" }}
                    />
                ) : (
                    <input
                        className="form-input"
                        type="number"
                        min={0}
                        placeholder="100"
                        value={fmt(tier.maxVal)}
                        onChange={(e) => onChange(idx, "maxVal", e.target.value)}
                        style={{ textAlign: "right" }}
                    />
                )}
            </td>
            <td style={{ paddingRight: 8 }}>
                <input
                    className="form-input"
                    type="number"
                    min={0}
                    placeholder="0"
                    value={fmt(tier.price)}
                    onChange={(e) => onChange(idx, "price", e.target.value)}
                    style={{ textAlign: "right" }}
                />
            </td>
            <td>
                <button
                    type="button"
                    className="icon-btn danger"
                    onClick={() => onRemove(idx)}
                    disabled={idx === 0}
                    title="Xóa bậc"
                >
                    <Trash2 size={14} />
                </button>
            </td>
        </tr>
    );
}

const EMPTY_TIER = { minVal: "", maxVal: "", price: "" };

export default function TariffModal({ service, onSaved, onClose, onError }) {
    const isTier = service?.billingMethod === "TIER";

    const [tariffs, setTariffs] = useState([]); // history
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form state
    const [effectiveFrom, setEffectiveFrom] = useState(
        new Date().toISOString().slice(0, 10) // today
    );
    const [price, setPrice] = useState(""); // flat/metered
    const [vatRate, setVatRate] = useState("10");
    const [notifyResident, setNotifyResident] = useState(false);
    const [tiers, setTiers] = useState([
        { minVal: "0", maxVal: "50", price: "" },
        { minVal: "51", maxVal: "100", price: "" },
        { minVal: "101", maxVal: "", price: "" },
    ]);

    // Load existing tariffs
    useEffect(() => {
        const fetchTariffs = async () => {
            setLoading(true);
            try {
                const res = await tariffApi.getTariffs(service.id);
                const list = res.data?.result ?? [];
                setTariffs(list);
                // Pre-fill from current/latest tariff
                if (list.length > 0) {
                    const latest = list.find((t) => t.isActive) ?? list[0];
                    setPrice(fmt(latest.price));
                    setVatRate(fmt(latest.vatRate ?? "10"));
                    if (isTier && latest.tiers?.length > 0) {
                        setTiers(
                            latest.tiers.map((t) => ({
                                minVal: fmt(t.minVal),
                                maxVal: fmt(t.maxVal),
                                price: fmt(t.price),
                            }))
                        );
                    }
                }
            } catch {
                // no existing tariff – that's OK
            } finally {
                setLoading(false);
            }
        };
        fetchTariffs();
    }, [service.id, isTier]);

    // Tier helpers
    const updateTier = (idx, field, value) => {
        setTiers((ts) => ts.map((t, i) => (i === idx ? { ...t, [field]: value } : t)));
    };

    const addTier = () => {
        const lastMax = tiers[tiers.length - 1]?.maxVal;
        const nextMin = lastMax ? String(Number(lastMax) + 1) : "0";
        setTiers((ts) => [
            ...ts.slice(0, -1).map((t, i) => (i === ts.length - 2 ? { ...t } : t)),
            { minVal: nextMin, maxVal: "", price: "" },
            { ...EMPTY_TIER, minVal: "" },
        ]);
    };

    const removeTier = (idx) => {
        if (tiers.length <= 1) return;
        setTiers((ts) => ts.filter((_, i) => i !== idx));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!effectiveFrom) { onError("Vui lòng chọn ngày áp dụng"); return; }

        if (isTier) {
            const invalid = tiers.some((t) => !t.price);
            if (invalid) { onError("Vui lòng nhập đơn giá cho tất cả các bậc"); return; }
        } else {
            if (!price) { onError("Vui lòng nhập đơn giá"); return; }
        }

        setSaving(true);
        try {
            const payload = {
                effectiveFrom,
                vatRate: parseFloat(vatRate) || 10,
                price: isTier ? 0 : parseFloat(price),
                currency: "VND",
                tiers: isTier
                    ? tiers.map((t, i) => ({
                        minVal: parseFloat(t.minVal) || 0,
                        maxVal: i === tiers.length - 1 ? null : parseFloat(t.maxVal),
                        price: parseFloat(t.price),
                    }))
                    : [],
            };
            await tariffApi.addTariff(service.id, payload);
            onSaved();
        } catch (err) {
            const msg = err.response?.data?.message ?? "Lưu biểu giá thất bại";
            onError(msg);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal modal--lg">
                {/* Header */}
                <div className="modal-header">
                    <div>
                        <h2 className="modal-title">
                            Cấu hình biểu giá: {service.name}
                        </h2>
                        <p style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", marginTop: 2 }}>
                            Mã: <code style={{ background: "#f1f5f9", padding: "0 4px", borderRadius: 3 }}>{service.code}</code>
                            &nbsp;·&nbsp;
                            {service.billingMethod === "TIER"
                                ? "Bậc thang"
                                : service.billingMethod === "FIXED"
                                    ? "Phí cố định"
                                    : service.billingMethod === "AREA"
                                        ? "Theo diện tích"
                                        : "Tính theo chỉ số"}
                        </p>
                    </div>
                    <button className="icon-btn" onClick={onClose}>
                        <X size={16} />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSave}>
                    <div className="modal-body">
                        {loading ? (
                            <div style={{ textAlign: "center", padding: "2rem", color: "var(--color-text-muted)" }}>
                                Đang tải biểu giá hiện tại...
                            </div>
                        ) : (
                            <>
                                {/* Tariff history badge */}
                                {tariffs.length > 0 && (
                                    <div style={{
                                        padding: "0.6rem 1rem",
                                        background: "#f0fdf4",
                                        border: "1px solid #bbf7d0",
                                        borderRadius: "var(--radius)",
                                        fontSize: "0.8rem",
                                        color: "#15803d",
                                        marginBottom: "1rem",
                                    }}>
                                        ✓ Đã có <strong>{tariffs.length}</strong> biểu giá. Tạo mới sẽ áp dụng từ ngày đã chọn.
                                    </div>
                                )}

                                <div className="form-row">
                                    {/* Effective date */}
                                    <div className="form-group">
                                        <label className="form-label">
                                            Ngày áp dụng <span>*</span>
                                        </label>
                                        <input
                                            type="date"
                                            className="form-input"
                                            value={effectiveFrom}
                                            onChange={(e) => setEffectiveFrom(e.target.value)}
                                        />
                                    </div>

                                    {/* VAT rate */}
                                    <div className="form-group">
                                        <label className="form-label">Thuế VAT (%)</label>
                                        <input
                                            className="form-input"
                                            type="number"
                                            min={0}
                                            max={100}
                                            step={0.01}
                                            value={vatRate}
                                            onChange={(e) => setVatRate(e.target.value)}
                                            style={{ textAlign: "right" }}
                                        />
                                    </div>
                                </div>

                                {/* ── FLAT / METERED ── */}
                                {!isTier && (
                                    <div className="form-group">
                                        <label className="form-label">
                                            Đơn giá (VND/{service.unit || "đơn vị"}) <span>*</span>
                                        </label>
                                        <input
                                            className="form-input"
                                            type="number"
                                            min={0}
                                            step={1}
                                            placeholder="vd. 3.500"
                                            value={price}
                                            onChange={(e) => setPrice(e.target.value)}
                                            style={{ textAlign: "right", fontSize: "1.05rem" }}
                                        />
                                        {price && (
                                            <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginTop: 4 }}>
                                                = {Number(price).toLocaleString("vi-VN")} ₫ / {service.unit || "đơn vị"}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* ── TIERED ── */}
                                {isTier && (
                                    <div>
                                        <label className="form-label" style={{ marginBottom: "0.6rem" }}>
                                            Bảng bậc thang giá (VND / {service.unit || "đơn vị"}) <span>*</span>
                                        </label>
                                        <div style={{ overflowX: "auto" }}>
                                            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                                <thead>
                                                    <tr style={{ background: "#f8fafc", borderBottom: "2px solid var(--color-border)" }}>
                                                        {["Từ (sử dụng)", "Đến (sử dụng)", "Đơn giá (VND)", ""].map((h) => (
                                                            <th key={h} style={{ padding: "0.5rem 0.5rem", textAlign: "left", fontSize: "0.78rem", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase" }}>
                                                                {h}
                                                            </th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {tiers.map((tier, idx) => (
                                                        <TierRow
                                                            key={idx}
                                                            tier={tier}
                                                            idx={idx}
                                                            onChange={updateTier}
                                                            onRemove={removeTier}
                                                            isLast={idx === tiers.length - 1}
                                                        />
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        <button
                                            type="button"
                                            className="btn btn-ghost btn-sm"
                                            style={{ marginTop: "0.75rem" }}
                                            onClick={addTier}
                                        >
                                            <Plus size={14} />
                                            Thêm bậc
                                        </button>
                                    </div>
                                )}

                                {/* Notify checkbox */}
                                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginTop: "1rem" }}>
                                    <input
                                        type="checkbox"
                                        id="notifyR"
                                        checked={notifyResident}
                                        onChange={(e) => setNotifyResident(e.target.checked)}
                                        style={{ width: 16, height: 16, cursor: "pointer" }}
                                    />
                                    <label htmlFor="notifyR" style={{ fontSize: "0.875rem", cursor: "pointer", userSelect: "none" }}>
                                        Thông báo đến cư dân về thay đổi giá
                                    </label>
                                </div>

                                {/* History table */}
                                {tariffs.length > 0 && (
                                    <div style={{ marginTop: "1.5rem" }}>
                                        <h4 style={{ fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.5rem", color: "var(--color-text-muted)" }}>
                                            Lịch sử biểu giá
                                        </h4>
                                        <table className="data-table" style={{ fontSize: "0.8rem" }}>
                                            <thead>
                                                <tr>
                                                    <th>Từ ngày</th>
                                                    <th>Đến ngày</th>
                                                    <th style={{ textAlign: "right" }}>Đơn giá</th>
                                                    <th>Trạng thái</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {tariffs.map((t) => (
                                                    <tr key={t.id}>
                                                        <td>{t.effectiveFrom}</td>
                                                        <td>{t.effectiveTo ?? "–"}</td>
                                                        <td style={{ textAlign: "right" }}>
                                                            {t.price != null ? `${Number(t.price).toLocaleString("vi-VN")} ₫` : (t.tiers?.length > 0 ? `${t.tiers.length} bậc` : "–")}
                                                        </td>
                                                        <td>
                                                            <span className={`badge ${t.isActive ? "badge--active" : "badge--inactive"}`}>
                                                                {t.isActive ? "Đang áp dụng" : "Hết hiệu lực"}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Hủy
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={saving || loading}>
                            <Save size={15} />
                            {saving ? "Đang lưu..." : "Lưu cấu hình"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
