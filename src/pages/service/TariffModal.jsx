import { useState, useEffect } from "react";
import { X, Plus, Trash2, Save, ChevronDown, ChevronRight } from "lucide-react";
import { tariffApi } from "../../api/serviceApi";

const fmt = (n) => (n !== undefined && n !== null ? String(n) : "");

/* ── Tier input row ─────────────────────────────────────────── */
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

/* ── History row with expandable tier detail ────────────────── */
function TariffHistoryRow({ t, isTier, unit }) {
    const [expanded, setExpanded] = useState(false);
    const hasTiers = isTier && t.tiers?.length > 0;
    const status = getTariffStatus(t);

    // sort tiers by minVal for display
    const sortedTiers = hasTiers
        ? [...t.tiers].sort((a, b) => (a.minVal ?? 0) - (b.minVal ?? 0))
        : [];

    return (
        <>
            <tr
                style={{ cursor: hasTiers || t.price != null ? "pointer" : "default", userSelect: "none" }}
                onClick={() => setExpanded((v) => !v)}
                title={hasTiers ? "Click để xem chi tiết bậc thang" : ""}
            >
                {/* expand icon */}
                <td style={{ width: 24, paddingRight: 4 }}>
                    {(hasTiers || t.price != null) ? (
                        expanded
                            ? <ChevronDown size={14} color="var(--color-primary)" />
                            : <ChevronRight size={14} color="var(--color-text-muted)" />
                    ) : null}
                </td>
                <td>{t.effectiveFrom}</td>
                <td>{t.effectiveTo ?? "–"}</td>
                <td style={{ textAlign: "right", color: "var(--color-text-muted)" }}>
                    {hasTiers
                        ? `${t.tiers.length} bậc`
                        : t.price != null
                            ? `${Number(t.price).toLocaleString("vi-VN")} ₫`
                            : "–"}
                </td>
                <td>
                    <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                        VAT {t.vatRate ?? 10}%
                    </span>
                </td>
                <td>
                    <span className={`badge ${status.cls}`}>
                        {status.label}
                    </span>
                </td>
            </tr>

            {/* ── Expanded detail ── */}
            {expanded && (
                <tr>
                    <td colSpan={6} style={{ padding: "0 0 0.75rem 2rem", background: "#f8fafc" }}>
                        {hasTiers ? (
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem" }}>
                                <thead>
                                    <tr style={{ color: "var(--color-text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                                        <th style={{ padding: "0.35rem 0.75rem", textAlign: "right", width: "30%" }}>Từ ({unit})</th>
                                        <th style={{ padding: "0.35rem 0.75rem", textAlign: "right", width: "30%" }}>Đến ({unit})</th>
                                        <th style={{ padding: "0.35rem 0.75rem", textAlign: "right" }}>Đơn giá (VND/{unit})</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedTiers.map((tier, i) => (
                                        <tr key={i} style={{ borderTop: "1px solid var(--color-border)" }}>
                                            <td style={{ padding: "0.3rem 0.75rem", textAlign: "right" }}>
                                                {tier.minVal ?? 0}
                                            </td>
                                            <td style={{ padding: "0.3rem 0.75rem", textAlign: "right" }}>
                                                {tier.maxVal == null ? "∞" : tier.maxVal}
                                            </td>
                                            <td style={{ padding: "0.3rem 0.75rem", textAlign: "right", fontWeight: 600, color: "var(--color-primary)" }}>
                                                {Number(tier.price).toLocaleString("vi-VN")} ₫
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p style={{ margin: "0.4rem 0", fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                                Đơn giá: <strong>{Number(t.price).toLocaleString("vi-VN")} ₫</strong> / {unit || "đơn vị"}
                                &nbsp;·&nbsp; VAT: {t.vatRate ?? 10}%
                            </p>
                        )}
                    </td>
                </tr>
            )}
        </>
    );
}

/* ── Helpers ────────────────────────────────────────────────── */
const EMPTY_TIER = { minVal: "", maxVal: "", price: "" };

/* ── TierRow có thêm cột "Giá sau VAT" (chỉ đọc) ─────────── */
function TierRowWithVat({ tier, idx, vatRate, onChange, onRemove, isLast }) {
    const basePrice = parseFloat(tier.price) || 0;
    const afterVat = basePrice > 0 ? basePrice * (1 + vatRate / 100) : null;

    return (
        <tr>
            <td style={{ padding: "0.35rem 0.75rem 0.35rem 0" }}>
                <input
                    className="form-input"
                    type="number" min={0} placeholder="0"
                    value={fmt(tier.minVal)}
                    onChange={(e) => onChange(idx, "minVal", e.target.value)}
                    style={{ textAlign: "right" }}
                />
            </td>
            <td style={{ padding: "0.35rem 0.75rem" }}>
                {isLast ? (
                    <input className="form-input" value="∞" disabled
                        style={{ background: "#f1f5f9", textAlign: "center", cursor: "not-allowed" }} />
                ) : (
                    <input
                        className="form-input"
                        type="number" min={0} placeholder="100"
                        value={fmt(tier.maxVal)}
                        onChange={(e) => onChange(idx, "maxVal", e.target.value)}
                        style={{ textAlign: "right" }}
                    />
                )}
            </td>
            <td style={{ padding: "0.35rem 0.75rem" }}>
                <input
                    className="form-input"
                    type="number" min={0} placeholder="0"
                    value={fmt(tier.price)}
                    onChange={(e) => onChange(idx, "price", e.target.value)}
                    style={{ textAlign: "right" }}
                />
            </td>
            <td style={{ padding: "0.35rem 0.75rem", textAlign: "right", fontSize: "0.88rem", fontWeight: 700, color: "var(--color-primary)", whiteSpace: "nowrap" }}>
                {afterVat != null
                    ? afterVat.toLocaleString("vi-VN", { maximumFractionDigits: 0 }) + " ₫"
                    : <span style={{ color: "#cbd5e1" }}>–</span>}
            </td>
            <td style={{ padding: "0.35rem 0.35rem 0.35rem 0", textAlign: "center" }}>
                <button type="button" className="icon-btn danger"
                    onClick={() => onRemove(idx)} disabled={idx === 0} title="Xóa bậc">
                    <Trash2 size={14} />
                </button>
            </td>
        </tr>
    );
}

/** Tính trạng thái hiển thị của 1 biểu giá dựa vào isActive + effectiveFrom */
function getTariffStatus(t) {
    if (t.isActive) {
        return { label: "Đang áp dụng", cls: "badge--active" };
    }
    // So sánh effectiveFrom với ngày hôm nay (chỉ so ngày, bỏ giờ)
    const today = new Date().toISOString().slice(0, 10);
    const from = (t.effectiveFrom ?? "").slice(0, 10);
    if (from > today) {
        return { label: "Sắp có hiệu lực", cls: "badge--upcoming" };
    }
    return { label: "Hết hiệu lực", cls: "badge--inactive" };
}

/** Sort tiers array by minVal ascending */
const sortTiers = (list) =>
    [...list].sort((a, b) => (parseFloat(a.minVal) || 0) - (parseFloat(b.minVal) || 0));

/* ── Main Modal ─────────────────────────────────────────────── */
export default function TariffModal({ service, onSaved, onClose, onError }) {
    const isTier = service?.billingMethod === "TIER";

    const [tariffs, setTariffs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form state
    const [effectiveFrom, setEffectiveFrom] = useState(
        new Date().toISOString().slice(0, 10)
    );
    const [price, setPrice] = useState("");
    const [vatRate, setVatRate] = useState("10");
    const [notifyResident, setNotifyResident] = useState(false);
    const [tiers, setTiers] = useState([
        { minVal: "0", maxVal: "50", price: "" },
        { minVal: "51", maxVal: "100", price: "" },
        { minVal: "101", maxVal: "", price: "" },
    ]);

    // Load & pre-fill from active tariff
    useEffect(() => {
        const fetchTariffs = async () => {
            setLoading(true);
            try {
                const res = await tariffApi.getTariffs(service.id);
                const list = res.data?.result ?? [];
                setTariffs(list);

                if (list.length > 0) {
                    const latest = list.find((t) => t.isActive) ?? list[0];
                    setPrice(fmt(latest.price));
                    setVatRate(fmt(latest.vatRate ?? "10"));

                    if (isTier && latest.tiers?.length > 0) {
                        // ✅ Sort by minVal so the form shows tiers in ascending order
                        const sorted = sortTiers(
                            latest.tiers.map((t) => ({
                                minVal: fmt(t.minVal),
                                maxVal: fmt(t.maxVal),
                                price: fmt(t.price),
                            }))
                        );
                        setTiers(sorted);
                    }
                }
            } catch {
                // no existing tariff – OK
            } finally {
                setLoading(false);
            }
        };
        fetchTariffs();
    }, [service.id, isTier]);

    // Tier helpers
    const updateTier = (idx, field, value) =>
        setTiers((ts) => ts.map((t, i) => (i === idx ? { ...t, [field]: value } : t)));

    const addTier = () => {
        setTiers((ts) => {
            const lastMax = ts[ts.length - 1]?.maxVal;
            const nextMin = lastMax ? String(Number(lastMax) + 1) : "0";
            return [
                ...ts.slice(0, -1),
                { minVal: nextMin, maxVal: "", price: "" },
                { ...EMPTY_TIER, minVal: "" },
            ];
        });
    };

    const removeTier = (idx) => {
        if (tiers.length <= 1) return;
        setTiers((ts) => ts.filter((_, i) => i !== idx));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!effectiveFrom) { onError("Vui lòng chọn ngày áp dụng"); return; }

        if (isTier) {
            if (tiers.some((t) => !t.price)) {
                onError("Vui lòng nhập đơn giá cho tất cả các bậc");
                return;
            }
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
            onError(err.response?.data?.message ?? "Lưu biểu giá thất bại");
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
                        <h2 className="modal-title">Cấu hình biểu giá: {service.name}</h2>
                        <p style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", marginTop: 2 }}>
                            Mã: <code style={{ background: "#f1f5f9", padding: "0 4px", borderRadius: 3 }}>{service.code}</code>
                            &nbsp;·&nbsp;
                            {service.billingMethod === "TIER"
                                ? "Bậc thang"
                                : service.billingMethod === "FIXED"
                                    ? "Phí cố định"
                                    : service.billingMethod === "AREA"
                                        ? "Theo diện tích"
                                        : service.billingMethod}
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
                                {/* Info banner */}
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
                                        <label className="form-label">Ngày áp dụng <span>*</span></label>
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
                                            min={0} max={100} step={0.01}
                                            value={vatRate}
                                            onChange={(e) => setVatRate(e.target.value)}
                                            style={{ textAlign: "right" }}
                                        />
                                    </div>
                                </div>

                                {/* ── FIXED ── */}
                                {!isTier && service.billingMethod !== "AREA" && (
                                    <div className="form-group">
                                        <label className="form-label">
                                            Đơn giá (VND/{service.unit || "đơn vị"}) <span>*</span>
                                        </label>
                                        <input
                                            className="form-input"
                                            type="number"
                                            min={0} step={1}
                                            placeholder="vd. 100.000"
                                            value={price}
                                            onChange={(e) => setPrice(e.target.value)}
                                            style={{ textAlign: "right", fontSize: "1.05rem" }}
                                        />
                                        {price && (() => {
                                            const base = Number(price);
                                            const vat = parseFloat(vatRate) || 0;
                                            const afterVat = base * (1 + vat / 100);
                                            return (
                                                <div style={{ marginTop: 6, fontSize: "0.8rem", display: "flex", flexDirection: "column", gap: 2 }}>
                                                    <span style={{ color: "var(--color-text-muted)" }}>
                                                        Giá gốc:&nbsp;<strong>{base.toLocaleString("vi-VN")} ₫</strong> / {service.unit || "đơn vị"}
                                                    </span>
                                                    {vat > 0 && (
                                                        <span style={{ color: "var(--color-primary)", fontWeight: 600 }}>
                                                            Giá sau VAT ({vat}%):&nbsp;<strong>{afterVat.toLocaleString("vi-VN", { maximumFractionDigits: 0 })} ₫</strong> / {service.unit || "đơn vị"}
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        })()}
                                    </div>
                                )}

                                {/* ── AREA ── */}
                                {!isTier && service.billingMethod === "AREA" && (
                                    <div>
                                        {/* Info box riêng cho AREA */}
                                        <div style={{
                                            padding: "0.65rem 1rem",
                                            background: "#fffbeb",
                                            border: "1px solid #fde68a",
                                            borderRadius: "var(--radius)",
                                            fontSize: "0.79rem",
                                            color: "#92400e",
                                            marginBottom: "0.85rem",
                                        }}>
                                            📐 <strong>Tính theo diện tích:</strong> Phí mỗi căn = Đơn giá × Diện tích căn hộ (m²).
                                            Ví dụ: 12.000 ₫/m² × 75 m² = <strong>900.000 ₫</strong>/kỳ.
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">
                                                Đơn giá (VND / m²) <span>*</span>
                                            </label>
                                            <input
                                                className="form-input"
                                                type="number"
                                                min={0} step={1}
                                                placeholder="vd. 12.000"
                                                value={price}
                                                onChange={(e) => setPrice(e.target.value)}
                                                style={{ textAlign: "right", fontSize: "1.05rem" }}
                                            />
                                            {price && (() => {
                                                const base = Number(price);
                                                const vat = parseFloat(vatRate) || 0;
                                                const afterVat = base * (1 + vat / 100);
                                                return (
                                                    <div style={{ marginTop: 6, fontSize: "0.8rem", display: "flex", flexDirection: "column", gap: 2 }}>
                                                        <span style={{ color: "var(--color-text-muted)" }}>
                                                            Giá gốc:&nbsp;<strong>{base.toLocaleString("vi-VN")} ₫</strong> / m²
                                                        </span>
                                                        {vat > 0 && (
                                                            <span style={{ color: "var(--color-primary)", fontWeight: 600 }}>
                                                                Giá sau VAT ({vat}%):&nbsp;<strong>{afterVat.toLocaleString("vi-VN", { maximumFractionDigits: 0 })} ₫</strong> / m²
                                                            </span>
                                                        )}
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                )}

                                {/* ── TIER ── */}
                                {isTier && (
                                    <div>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.6rem" }}>
                                            <label className="form-label" style={{ marginBottom: 0 }}>
                                                Bảng bậc thang giá (VND / {service.unit || "đơn vị"}) <span>*</span>
                                            </label>
                                            <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                                                ⚠ Đơn giá nhập là giá chưa bao gồm VAT {vatRate || 0}%
                                            </span>
                                        </div>
                                        <div style={{ overflowX: "auto" }}>
                                            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                                <thead>
                                                    <tr style={{ background: "#f8fafc", borderBottom: "2px solid var(--color-border)" }}>
                                                        {[
                                                            { label: "Từ (sử dụng)", align: "right" },
                                                            { label: "Đến (sử dụng)", align: "right" },
                                                            { label: "Đơn giá (VND)", align: "right" },
                                                            { label: `Sau VAT ${vatRate || 0}%`, align: "right", highlight: true },
                                                            { label: "", align: "center" },
                                                        ].map(({ label, align, highlight }) => (
                                                            <th key={label} style={{
                                                                padding: "0.5rem 0.75rem",
                                                                textAlign: align,
                                                                fontSize: "0.75rem",
                                                                fontWeight: 600,
                                                                color: highlight ? "var(--color-primary)" : "var(--color-text-muted)",
                                                                textTransform: "uppercase",
                                                                whiteSpace: "nowrap",
                                                                letterSpacing: "0.03em",
                                                            }}>
                                                                {label}
                                                            </th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {tiers.map((tier, idx) => (
                                                        <TierRowWithVat
                                                            key={idx}
                                                            tier={tier}
                                                            idx={idx}
                                                            vatRate={parseFloat(vatRate) || 0}
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
                                            <Plus size={14} /> Thêm bậc
                                        </button>
                                    </div>
                                )}

                                {/* Notify */}
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

                                {/* ── History table ── */}
                                {tariffs.length > 0 && (
                                    <div style={{ marginTop: "1.5rem" }}>
                                        <h4 style={{ fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.5rem", color: "var(--color-primary)" }}>
                                            Lịch sử biểu giá
                                        </h4>
                                        <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginBottom: "0.5rem" }}>
                                            Click vào dòng để xem chi tiết bậc thang
                                        </p>
                                        <table className="data-table" style={{ fontSize: "0.8rem" }}>
                                            <thead>
                                                <tr>
                                                    <th style={{ width: 24 }}></th>
                                                    <th>Từ ngày</th>
                                                    <th>Đến ngày</th>
                                                    <th style={{ textAlign: "right" }}>
                                                        {isTier ? "Số bậc" : "Đơn giá"}
                                                    </th>
                                                    <th>VAT</th>
                                                    <th>Trạng thái</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {tariffs.map((t) => (
                                                    <TariffHistoryRow
                                                        key={t.id}
                                                        t={t}
                                                        isTier={isTier}
                                                        unit={service.unit || "đơn vị"}
                                                    />
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
