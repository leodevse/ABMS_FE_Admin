import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Save, ArrowLeft, Camera, AlertCircle, CheckCircle, Info } from "lucide-react";
import { meterReadingApi } from "../../services/meterReadingApi";
import { serviceApi } from "../../services/serviceApi";
import { fetchApartmentsByBuilding } from "../../api/apartmentApi";

function Toast({ toasts }) {
    return (
        <div className="toast-container">
            {toasts.map((t) => (
                <div key={t.id} className={`toast toast--${t.type}`}>
                    {t.type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                    {t.msg}
                </div>
            ))}
        </div>
    );
}

let toastId = 0;

export default function MeterReadingFormPage() {
    const { id } = useParams(); // For edit
    const navigate = useNavigate();
    const location = useLocation();
    const query = new URLSearchParams(location.search);

    // Context from query params (for new records)
    const qServiceId = query.get("serviceId");
    const qPeriod = query.get("period");
    const qBuildingId = query.get("buildingId");
    const qApartmentId = query.get("apartmentId");

    const isEdit = Boolean(id);
    const [loading, setLoading] = useState(false);
    const [initialFetch, setInitialFetch] = useState(true);
    const [service, setService] = useState(null);
    const [apartments, setApartments] = useState([]);
    
    // Form state
    const [form, setForm] = useState({
        apartmentId: qApartmentId || "",
        serviceId: qServiceId || "",
        period: qPeriod || new Date().toISOString().slice(0, 7),
        oldIndex: 0,
        newIndex: "",
        isMeterReset: false,
        note: ""
    });
    const [photo, setPhoto] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [toasts, setToasts] = useState([]);
    const [isReadOnly, setIsReadOnly] = useState(false);

    const addToast = useCallback((msg, type = "success") => {
        const id = ++toastId;
        setToasts((t) => [...t, { id, msg, type }]);
        setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
    }, []);

    const resolveImageUrl = (url) => {
        if (!url) return null;
        if (url.startsWith('http') || url.startsWith('blob:')) return url;
        const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
        const basePath = baseUrl.replace(/\/api\/?$/, '');
        return url.startsWith('/') ? `${basePath}${url}` : `${basePath}/${url}`;
    };

    // 1. Initial Data Fetching
    useEffect(() => {
        const loadInitialData = async () => {
            setInitialFetch(true);
            try {
                // Fetch current record if editing
                let currentItem = null;
                if (isEdit) {
                    // Try to fetch specific reading if we have ID
                    // Using getByPeriod as a fallback to find it if there's no getById
                    const res = await meterReadingApi.getByPeriod(qPeriod || "", qServiceId || "");
                    currentItem = res.data?.result?.find(r => r.id === id);
                    
                    // If not found in current period/service, we might need a better API call or the user is editing from another context
                    if (!currentItem && id) {
                        // In a real app, you'd have meterReadingApi.getById(id)
                    }
                }

                const activeAptId = currentItem?.apartmentId || qApartmentId;
                const activeBuildingId = currentItem?.buildingId || qBuildingId;
                const activeServiceId = currentItem?.serviceId || qServiceId;
                const activePeriod = currentItem?.period || qPeriod || new Date().toISOString().slice(0, 7);

                // Load Service details
                if (activeServiceId) {
                    const resSvc = await serviceApi.getAll();
                    const svc = resSvc.data?.result?.find(s => s.id === activeServiceId);
                    setService(svc);
                }

                // Load Apartments for the building dropdown
                if (activeBuildingId) {
                    const resApts = await fetchApartmentsByBuilding(activeBuildingId);
                    setApartments(resApts.result || resApts.data || []);
                }

                // Initialize Form
                if (currentItem) {
                    setForm({
                        apartmentId: currentItem.apartmentId || "",
                        serviceId: currentItem.serviceId || "",
                        period: currentItem.period || "",
                        oldIndex: currentItem.oldIndex || 0,
                        newIndex: currentItem.newIndex ?? "",
                        isMeterReset: currentItem.isMeterReset || false,
                        note: currentItem.note || ""
                    });
                    setPhotoPreview(resolveImageUrl(currentItem.photoUrl));
                    setIsReadOnly(currentItem.status !== "DRAFT" && currentItem.status !== "UNRECORDED");
                } else {
                    setForm(prev => ({
                        ...prev,
                        apartmentId: activeAptId || "",
                        serviceId: activeServiceId || "",
                        period: activePeriod,
                    }));
                }
            } catch (err) {
                addToast("Lỗi khi tải dữ liệu", "error");
            } finally {
                setInitialFetch(false);
            }
        };
        loadInitialData();
    }, [id, isEdit, qApartmentId, qBuildingId, qPeriod, qServiceId, addToast]);

    // 2. Fetch Old Index if context changes
    useEffect(() => {
        if (!isEdit && form.apartmentId && form.serviceId && form.period) {
            meterReadingApi.getOldIndex(form.apartmentId, form.serviceId, form.period)
                .then(res => setForm(f => ({ ...f, oldIndex: res.data?.result?.suggestedOldIndex ?? 0 })))
                .catch(() => setForm(f => ({ ...f, oldIndex: 0 })));
        }
    }, [form.apartmentId, form.serviceId, form.period, isEdit]);

    const handlePhotoChange = (e) => {
        if (isReadOnly) return;
        const file = e.target.files[0];
        if (file) {
            setPhoto(file);
            setPhotoPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isReadOnly) { navigate("/meter-readings"); return; }
        if (!form.apartmentId) { addToast("Vui lòng chọn căn hộ", "error"); return; }
        
        const isTiered = service?.billingMethod === "TIER";
        const nIdx = isTiered ? parseFloat(form.newIndex) : 0;

        if (isTiered) {
            if (form.newIndex === "" || form.newIndex === null || isNaN(nIdx)) {
                addToast("Vui lòng nhập chỉ số mới hợp lệ", "error");
                return;
            }
            if (!form.isMeterReset && nIdx < form.oldIndex) {
                addToast("Chỉ số mới không được nhỏ hơn chỉ số cũ trừ khi Reset", "error");
                return;
            }
        }

        setLoading(true);
        try {
            const payload = {
                apartmentId: form.apartmentId,
                serviceId: form.serviceId,
                period: form.period,
                oldIndex: form.oldIndex,
                newIndex: nIdx,
                isMeterReset: form.isMeterReset,
                note: form.note
            };
            
            if (isEdit) {
                await meterReadingApi.update(id, payload, photo);
                addToast("Cập nhật chỉ số thành công");
            } else {
                await meterReadingApi.create(payload, photo);
                addToast("Lưu chỉ số thành công");
            }
            setTimeout(() => navigate("/meter-readings"), 1000);
        } catch (err) {
            addToast(err.response?.data?.message || "Thao tác thất bại", "error");
        } finally {
            setLoading(false);
        }
    };

    // UI Calculations
    const isTierVal = service?.billingMethod === "TIER";
    const parsedNew = parseFloat(form.newIndex);
    const parsedOld = parseFloat(form.oldIndex);
    const currentUsage = !isNaN(parsedNew) && !isNaN(parsedOld)
        ? (form.isMeterReset && parsedNew < parsedOld ? parsedNew : parsedNew - parsedOld)
        : null;

    if (initialFetch) {
        return <div style={{ padding: "2rem", textAlign: "center" }}>Đang tải...</div>;
    }

    return (
        <div className="meter-reading-form-page">
            <div className="page-header">
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => navigate("/meter-readings")}>
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h1 className="page-header__title">
                            {isReadOnly ? "Chi tiết chỉ số" : isEdit ? "Chỉnh sửa chỉ số" : "Ghi chỉ số mới"}
                        </h1>
                        <p className="page-header__subtitle">
                            Dịch vụ: <strong>{service?.name}</strong> · Kỳ: <strong>{form.period}</strong>
                        </p>
                    </div>
                </div>
            </div>

            <div className="card" style={{ maxWidth: 900, margin: "0 auto" }}>
                <form onSubmit={handleSubmit} style={{ padding: "2rem" }}>
                    <div className="form-group">
                        <label className="form-label">Căn hộ <span>*</span></label>
                        <select 
                            className="form-select" 
                            value={form.apartmentId} 
                            disabled={isEdit || isReadOnly} 
                            onChange={e => setForm(f => ({ ...f, apartmentId: e.target.value }))}
                        >
                            <option value="">-- Chọn căn hộ --</option>
                            {apartments.map(a => <option key={a.id} value={a.id}>{a.code}</option>)}
                        </select>
                    </div>

                    {isTierVal && (
                        <div style={{ background: "#f8fafc", padding: "1.5rem", borderRadius: "var(--radius)", border: "1px solid var(--color-border)", margin: "1.5rem 0" }}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Chỉ số cũ ({service?.unit})</label>
                                    <input className="form-input" value={form.oldIndex} disabled style={{ background: "#e2e8f0", fontWeight: 600 }} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Chỉ số mới ({service?.unit}) <span>*</span></label>
                                    <input
                                        className="form-input"
                                        type="number"
                                        step="0.01"
                                        value={form.newIndex}
                                        onChange={e => setForm(f => ({ ...f, newIndex: e.target.value }))}
                                        placeholder="0.00"
                                        disabled={isReadOnly}
                                        style={isReadOnly ? { background: "#e2e8f0" } : { fontWeight: 600 }}
                                    />
                                    {(!form.isMeterReset && parsedNew < parsedOld) && (
                                        <div style={{ color: "#b45309", fontSize: "0.75rem", marginTop: "0.5rem", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                                            <AlertCircle size={14} />
                                            Chỉ số mới nhỏ hơn chỉ số cũ. Vui lòng kiểm tra hoặc chọn Reset.
                                        </div>
                                    )}
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Tiêu thụ ({service?.unit})</label>
                                    <div className="form-input" style={{ background: "#f1f5f9", fontWeight: 700, display: "flex", alignItems: "center", color: (currentUsage !== null && currentUsage < 0) ? "var(--color-danger)" : "#1e293b" }}>
                                        {currentUsage !== null ? currentUsage.toLocaleString() : "—"}
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginTop: "1rem" }}>
                                <label style={{ display: "flex", alignItems: "center", gap: "0.6rem", cursor: isReadOnly ? "default" : "pointer" }}>
                                    <input
                                        type="checkbox"
                                        checked={form.isMeterReset}
                                        onChange={e => setForm(f => ({ ...f, isMeterReset: e.target.checked }))}
                                        style={{ width: 18, height: 18 }}
                                        disabled={isReadOnly}
                                    />
                                    <span style={{ fontSize: "0.9rem", userSelect: "none" }}>Thay đồng hồ / Reset về 0 (Số tiêu thụ sẽ được tính lại từ đầu)</span>
                                </label>
                            </div>
                        </div>
                    )}

                    {!isTierVal && (
                        <div style={{ marginBottom: "1.5rem", padding: "1rem", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "12px", color: "#1e40af", display: "flex", gap: "0.75rem" }}>
                            <Info size={20} />
                            <div>
                                <p style={{ fontWeight: 600, fontSize: "0.9rem" }}>Dịch vụ tính phí theo {service?.billingMethod === "AREA" ? "Diện tích" : "Cố định"}</p>
                                <p style={{ fontSize: "0.8rem", opacity: 0.9 }}>Không cần nhập chỉ số đo lường. Hệ thống sẽ tự động tính phí khi chốt sổ.</p>
                            </div>
                        </div>
                    )}

                    <div className="form-row">
                        <div className="form-group" style={{ flex: 2 }}>
                            <label className="form-label">Ghi chú / Lý do</label>
                            <textarea
                                className="form-textarea"
                                rows={4}
                                value={form.note}
                                onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                                placeholder="Ghi chú thêm về lần ghi này..."
                                disabled={isReadOnly}
                                style={isReadOnly ? { background: "#f1f5f9" } : {}}
                            />
                        </div>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label className="form-label">Ảnh chứng minh</label>
                            <div
                                onClick={() => !isReadOnly && document.getElementById("photo-page-upload").click()}
                                style={{
                                    border: "2px dashed var(--color-border)",
                                    borderRadius: "var(--radius)",
                                    aspectRatio: "4/3",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    cursor: isReadOnly ? "default" : "pointer",
                                    overflow: "hidden",
                                    position: "relative",
                                    background: photoPreview ? "#000" : "#f8fafc",
                                    transition: "all 0.2s"
                                }}
                                className={!isReadOnly ? "hover-upload" : ""}
                            >
                                {photoPreview ? (
                                    <img src={photoPreview} style={{ width: "100%", height: "100%", objectFit: "contain" }} alt="Evidence" />
                                ) : (
                                    <>
                                        <Camera size={32} color="#94a3b8" />
                                        {!isReadOnly && <span style={{ fontSize: "0.8rem", color: "#64748b", marginTop: 10 }}>Chạm để tải ảnh</span>}
                                    </>
                                )}
                                <input id="photo-page-upload" type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: "none" }} disabled={isReadOnly} />
                                
                                {photoPreview && !isReadOnly && (
                                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(0,0,0,0.5)", color: "#fff", padding: "4px", textAlign: "center", fontSize: "0.7rem" }}>
                                        Thay đổi ảnh
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "2rem", paddingTop: "1.5rem", borderTop: "1px solid var(--color-border)" }}>
                        <button type="button" className="btn btn-secondary" onClick={() => navigate("/meter-readings")}>
                            {isReadOnly ? "Quay lại" : "Hủy"}
                        </button>
                        {!isReadOnly && (
                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                <Save size={16} />
                                {loading ? "Đang lưu..." : "Lưu bản ghi"}
                            </button>
                        )}
                    </div>
                </form>
            </div>

            <Toast toasts={toasts} />
            <style>{`
                .hover-upload:hover { border-color: var(--color-primary); background: #f1f5f9; }
            `}</style>
        </div>
    );
}
