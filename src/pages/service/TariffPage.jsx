import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Save, ChevronDown, ChevronRight, CheckCircle, CircleSlash } from "lucide-react";
import { tariffApi, serviceApi } from "../../services/serviceApi";
import toast from "react-hot-toast";

const fmt = (n) => (n !== undefined && n !== null ? String(n) : "");

/* ── TierRow with VAT (read-only) ─────────────────────────── */
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

/* ── History row with expandable tier detail ────────────────── */
function TariffHistoryRow({ t, isTier, unit }) {
    const [expanded, setExpanded] = useState(false);
    const hasTiers = isTier && t.tiers?.length > 0;
    const status = getTariffStatus(t);

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
                <td style={{ width: 24, padding: "0.75rem 0.5rem" }}>
                    {(hasTiers || t.price != null) ? (
                        expanded
                            ? <ChevronDown size={14} color="var(--color-primary)" />
                            : <ChevronRight size={14} color="var(--color-text-muted)" />
                    ) : null}
                </td>
                <td style={{ padding: "0.75rem 0.5rem" }}>{t.effectiveFrom}</td>
                <td style={{ padding: "0.75rem 0.5rem" }}>{t.effectiveTo ?? "–"}</td>
                <td style={{ padding: "0.75rem 0.5rem", textAlign: "right", color: "var(--color-text-muted)" }}>
                    {hasTiers
                        ? `${t.tiers.length} bậc`
                        : t.price != null
                            ? `${Number(t.price).toLocaleString("vi-VN")} ₫`
                            : "–"}
                </td>
                <td style={{ padding: "0.75rem 0.5rem" }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                        VAT {t.vatRate ?? 10}%
                    </span>
                </td>
                <td style={{ padding: "0.75rem 0.5rem" }}>
                    <span className={`badge ${status.cls}`}>
                        {status.label}
                    </span>
                </td>
            </tr>
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

function getTariffStatus(t) {
    if (t.isActive) {
        return { label: "Đang áp dụng", cls: "badge--active" };
    }
    const today = new Date().toISOString().slice(0, 10);
    const from = (t.effectiveFrom ?? "").slice(0, 10);
    if (from > today) {
        return { label: "Sắp có hiệu lực", cls: "badge--upcoming" };
    }
    return { label: "Hết hiệu lực", cls: "badge--inactive" };
}

const EMPTY_TIER = { minVal: "", maxVal: "", price: "" };
const sortTiers = (list) =>
    [...list].sort((a, b) => (parseFloat(a.minVal) || 0) - (parseFloat(b.minVal) || 0));


export default function TariffPage() {
    const { serviceId } = useParams();
    const navigate = useNavigate();

    const [service, setService] = useState(null);
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

    const isTier = service?.billingMethod === "TIER";

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch service info
                const resSvc = await serviceApi.getById(serviceId);
                const svc = resSvc.data?.result;
                if (!svc) {
                    toast.error("Không tìm thấy dịch vụ");
                    setTimeout(() => navigate("/service-config"), 1500);
                    return;
                }
                setService(svc);

                // Fetch tariffs
                const resTariffs = await tariffApi.getTariffs(serviceId);
                const list = resTariffs.data?.result ?? [];
                setTariffs(list);

                if (list.length > 0) {
                    const latest = list.find((t) => t.isActive) ?? list[0];
                    setPrice(fmt(latest.price));
                    setVatRate(fmt(latest.vatRate ?? "10"));

                    if (svc.billingMethod === "TIER" && latest.tiers?.length > 0) {
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
            } catch (err) {
                toast.error("Lỗi khi tải dữ liệu");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [serviceId, navigate]);

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
        if (!effectiveFrom) { toast.error("Vui lòng chọn ngày áp dụng"); return; }

        if (isTier) {
            if (tiers.some((t) => !t.price)) {
                toast.error("Vui lòng nhập đơn giá cho tất cả các bậc");
                return;
            }
        } else {
            if (!price) { toast.error("Vui lòng nhập đơn giá"); return; }
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
            await tariffApi.addTariff(serviceId, payload);
            toast.success("Cập nhật biểu giá thành công");
            setTimeout(() => navigate("/service-config"), 1000);
        } catch (err) {
            toast.error(err.response?.data?.message ?? "Lưu biểu giá thất bại");
        } finally {
            setSaving(false);
        }
    };

    if (loading && !service) {
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
                        <h1 className="page-header__title">Cấu hình biểu giá: {service?.name}</h1>
                        <p className="page-header__subtitle">
                            Mã: <code style={{ background: "#f1f5f9", padding: "0 4px", borderRadius: 3 }}>{service?.code}</code>
                            &nbsp;·&nbsp;
                            {service?.billingMethod === "TIER"
                                ? "Bậc thang"
                                : service?.billingMethod === "FIXED"
                                    ? "Phí cố định"
                                    : service?.billingMethod === "AREA"
                                        ? "Theo diện tích"
                                        : service?.billingMethod}
                        </p>
                    </div>
                </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: "1200px", margin: "0 auto" }}>
                {/* Configuration Form */}
                <div className="card">
                    <div className="card__header" style={{ borderBottom: "1px solid var(--color-border)", padding: "1rem 1.5rem" }}>
                        <h3 style={{ fontWeight: 600 }}>Thiết lập biểu giá mới</h3>
                    </div>
                    <form onSubmit={handleSave} style={{ padding: "1.5rem" }}>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Ngày áp dụng <span>*</span></label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={effectiveFrom}
                                    onChange={(e) => setEffectiveFrom(e.target.value)}
                                />
                            </div>
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

                        {/* FIXED / AREA */}
                        {!isTier && (
                            <div className="form-group">
                                <label className="form-label">
                                    Đơn giá (VND / {service?.unit || (service?.billingMethod === "AREA" ? "m²" : "đơn vị")}) <span>*</span>
                                </label>
                                <input
                                    className="form-input"
                                    type="number"
                                    min={0} step={1}
                                    placeholder="vd. 12.000"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    style={{ textAlign: "right", fontSize: "1.1rem", fontWeight: 600 }}
                                />
                                {price && (() => {
                                    const base = Number(price);
                                    const vat = parseFloat(vatRate) || 0;
                                    const afterVat = base * (1 + vat / 100);
                                    return (
                                        <div style={{
                                            marginTop: 15,
                                            padding: "1rem",
                                            background: "#f8fafc",
                                            borderRadius: "var(--radius)",
                                            border: "1px solid var(--color-border)",
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: "0.5rem"
                                        }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                                                <span>Giá trước VAT:</span>
                                                <span><strong>{base.toLocaleString("vi-VN")} ₫</strong></span>
                                            </div>
                                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1rem", color: "var(--color-primary)", fontWeight: 600, borderTop: "1px dashed #cbd5e1", paddingTop: "0.5rem", marginTop: "0.25rem" }}>
                                                <span>Tổng cộng (sau VAT {vat}%):</span>
                                                <span>{afterVat.toLocaleString("vi-VN", { maximumFractionDigits: 0 })} ₫</span>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        )}

                        {/* TIER */}
                        {isTier && (
                            <div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.75rem" }}>
                                    <label className="form-label" style={{ marginBottom: 0 }}>
                                        Bảng bậc thang giá <span>*</span>
                                    </label>
                                    <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                                        ⚠ Đơn giá nhập là giá chưa bao gồm VAT
                                    </span>
                                </div>
                                <div style={{ overflowX: "auto", border: "1px solid var(--color-border)", borderRadius: "var(--radius)" }}>
                                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                        <thead>
                                            <tr style={{ background: "#f8fafc", borderBottom: "1px solid var(--color-border)" }}>
                                                {[
                                                    { label: "Từ", align: "right" },
                                                    { label: "Đến", align: "right" },
                                                    { label: "Đơn giá", align: "right" },
                                                    { label: `Sau VAT`, align: "right" },
                                                    { label: "", align: "center" },
                                                ].map(({ label, align }) => (
                                                    <th key={label} style={{
                                                        padding: "0.6rem 0.75rem",
                                                        textAlign: align,
                                                        fontSize: "0.7rem",
                                                        fontWeight: 700,
                                                        color: "var(--color-text-muted)",
                                                        textTransform: "uppercase",
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
                                    style={{ marginTop: "1rem" }}
                                    onClick={addTier}
                                >
                                    <Plus size={14} /> Thêm bậc thang
                                </button>
                            </div>
                        )}

                        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginTop: "1.5rem" }}>
                            <input
                                type="checkbox"
                                id="notifyR"
                                checked={notifyResident}
                                onChange={(e) => setNotifyResident(e.target.checked)}
                                style={{ width: 16, height: 16, cursor: "pointer" }}
                            />
                            <label htmlFor="notifyR" style={{ fontSize: "0.875rem", cursor: "pointer", userSelect: "none" }}>
                                Thông báo đến cư dân về thay đổi giá này
                            </label>
                        </div>

                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "2rem", paddingTop: "1.5rem", borderTop: "1px solid var(--color-border)" }}>
                            <button type="button" className="btn btn-secondary" onClick={() => navigate("/service-config")}>
                                Hủy
                            </button>
                            <button type="submit" className="btn btn-primary" disabled={saving}>
                                <Save size={15} />
                                {saving ? "Đang lưu..." : "Lưu cấu hình"}
                            </button>
                        </div>
                    </form>
                </div>

                {/* History Section */}
                <div className="card">
                    <div className="card__header" style={{ borderBottom: "1px solid var(--color-border)", padding: "1rem 1.5rem" }}>
                        <h3 style={{ fontWeight: 600 }}>Lịch sử biểu giá</h3>
                    </div>
                    <div style={{ padding: "1rem" }}>
                        {tariffs.length === 0 ? (
                            <p style={{ textAlign: "center", color: "var(--color-text-muted)", fontSize: "0.85rem", padding: "1rem" }}>
                                Chưa có dữ liệu lịch sử.
                            </p>
                        ) : (
                            <div style={{ overflowX: "auto" }}>
                                <table className="data-table" style={{ fontSize: "0.8rem", width: "100%", tableLayout: "auto" }}>
                                    <thead style={{ background: "#f1f5f9" }}>
                                        <tr style={{ color: "var(--color-text-muted)", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                            <th style={{ width: 24, padding: "0.75rem 0.5rem" }}></th>
                                            <th style={{ padding: "0.75rem 0.5rem", fontWeight: 700 }}>Từ ngày</th>
                                            <th style={{ padding: "0.75rem 0.5rem", fontWeight: 700 }}>Đến ngày</th>
                                            <th style={{ padding: "0.75rem 0.5rem", textAlign: "right", fontWeight: 700 }}>Giá/Bậc</th>
                                            <th style={{ padding: "0.75rem 0.5rem", fontWeight: 700 }}>Vat</th>
                                            <th style={{ padding: "0.75rem 0.5rem", fontWeight: 700 }}>Trạng thái</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {tariffs.map((t) => (
                                            <TariffHistoryRow
                                                key={t.id}
                                                t={t}
                                                isTier={isTier}
                                                unit={service?.unit || "đv"}
                                            />
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>

        </div>
    );
}
