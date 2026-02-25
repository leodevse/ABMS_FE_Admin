import { useState, useEffect, useCallback, useRef } from "react";
import {
    Gauge, Search, Download, Upload, Save, CheckCircle, Lock,
    AlertCircle, ChevronRight, FileSpreadsheet, RefreshCw, Plus, X, Camera, Image as ImageIcon
} from "lucide-react";
import * as XLSX from "xlsx";
import { meterReadingApi } from "../../api/meterReadingApi";
import { serviceApi } from "../../api/serviceApi";
import { apartmentApi } from "../../api/apartmentApi";

// ── helpers ──────────────────────────────────────────────────
const STATUS_BADGE = {
    DRAFT: { text: "Nháp", cls: "badge--inactive" },
    CONFIRMED: { text: "Đã xác nhận", cls: "badge--metered" },
    LOCKED: { text: "Đã khóa", cls: "badge--active" },
};

function Toast({ toasts, onRemove }) {
    return (
        <div className="toast-container">
            {toasts.map((t) => (
                <div key={t.id} className={`toast toast--${t.type}`} onClick={() => onRemove(t.id)}>
                    {t.type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                    {t.msg}
                </div>
            ))}
        </div>
    );
}

/* ─── Manual Add / Edit Modal ─── */
function ManualReadingModal({ service, period, reading, onSaved, onClose, onError }) {
    const isEdit = !!reading;
    const isLocked = isEdit && reading?.status !== "DRAFT";
    const canEdit = !isLocked;

    const [apartments, setApartments] = useState([]);
    const [selectedApartment, setSelectedApartment] = useState(reading?.apartmentId || "");
    const [oldIndex, setOldIndex] = useState(reading?.oldIndex || 0);
    const [newIndex, setNewIndex] = useState(reading?.newIndex ?? "");
    const [isMeterReset, setIsMeterReset] = useState(!!reading?.isMeterReset);
    const [photo, setPhoto] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(reading?.photoUrl || null);
    const [note, setNote] = useState(reading?.note || "");
    const [loading, setLoading] = useState(false);

    // Khi mở modal edit, đảm bảo fill đúng dữ liệu hiện tại (kể cả ảnh cũ)
    useEffect(() => {
        if (!isEdit) return;
        setSelectedApartment(reading?.apartmentId || "");
        setOldIndex(reading?.oldIndex || 0);
        setNewIndex(reading?.newIndex ?? "");
        setIsMeterReset(!!reading?.isMeterReset);
        setNote(reading?.note || "");
        setPhoto(null);
        setPhotoPreview(reading?.photoUrl || null);
    }, [isEdit, reading]);

    // Chỉ load danh sách căn hộ + gợi ý chỉ số khi tạo mới.
    useEffect(() => {
        if (!isEdit) {
            apartmentApi.getAll().then(res => setApartments(res.data?.result || []));
        }
    }, [isEdit]);

    useEffect(() => {
        if (!isEdit && selectedApartment && service?.id && period) {
            meterReadingApi.getOldIndex(selectedApartment, service.id, period)
                .then(res => setOldIndex(res.data?.result?.suggestedOldIndex || 0));
        }
    }, [isEdit, selectedApartment, service, period]);

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setPhoto(file);
            setPhotoPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (isLocked) {
            onError("Bản ghi đã xác nhận/khóa nên không thể chỉnh sửa");
            return;
        }

        if (!newIndex) {
            onError("Vui lòng nhập chỉ số mới");
            return;
        }

        if (!isEdit && !selectedApartment) {
            onError("Vui lòng chọn căn hộ");
            return;
        }

        const nIdx = parseFloat(newIndex);
        if (!isMeterReset && nIdx < oldIndex) {
            onError("Chỉ số mới không được nhỏ hơn chỉ số cũ trừ khi đánh dấu 'Thay đồng hồ/Reset'");
            return;
        }

        setLoading(true);
        try {
            if (isEdit) {
                // Cập nhật bản ghi hiện có
                await meterReadingApi.update(reading.id, {
                    newIndex: nIdx,
                    isMeterReset,
                    note,
                }, photo);
            } else {
                // Tạo mới
                const data = {
                    apartmentId: selectedApartment,
                    serviceId: service.id,
                    period,
                    oldIndex,
                    newIndex: nIdx,
                    isMeterReset,
                    note,
                };
                await meterReadingApi.create(data, photo);
            }
            onSaved();
        } catch (err) {
            onError(err.response?.data?.message || "Lưu chỉ số thất bại");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modal modal--lg">
                <div className="modal-header">
                    <div>
                        <h2 className="modal-title">{isEdit ? "Chỉnh sửa chỉ số thủ công" : "Thêm chỉ số thủ công"}</h2>
                        <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                            Dịch vụ: <strong>{service?.name}</strong> · Kỳ: <strong>{period}</strong>
                        </p>
                    </div>
                    <button className="icon-btn" onClick={onClose}><X size={16} /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        {isLocked && (
                            <div style={{
                                padding: "0.6rem 0.9rem",
                                background: "#fff7ed",
                                border: "1px solid #fed7aa",
                                borderRadius: "0.5rem",
                                color: "#9a3412",
                                fontSize: "0.85rem",
                                marginBottom: "0.75rem",
                            }}>
                                Bản ghi đã <strong>{reading?.status === "LOCKED" ? "khóa" : "xác nhận"}</strong>, không thể chỉnh sửa.
                            </div>
                        )}
                        <div className="form-group">
                            <label className="form-label">Chọn căn hộ</label>
                            {isEdit ? (
                                <input
                                    className="form-input"
                                    value={reading.apartmentCode}
                                    disabled
                                    style={{ background: "#f1f5f9" }}
                                />
                            ) : (
                                <select
                                    className="form-select"
                                    value={selectedApartment}
                                    onChange={e => setSelectedApartment(e.target.value)}
                                    autoFocus
                                    disabled={!canEdit}
                                >
                                    <option value="">-- Danh sách căn hộ --</option>
                                    {apartments.map(a => <option key={a.id} value={a.id}>{a.code}</option>)}
                                </select>
                            )}
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Chỉ số cũ ({service?.unit})</label>
                                <input className="form-input" value={oldIndex} disabled style={{ background: "#f1f5f9" }} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Chỉ số mới ({service?.unit})</label>
                                <input
                                    className="form-input"
                                    type="number"
                                    step="0.01"
                                    value={newIndex}
                                    onChange={e => setNewIndex(e.target.value)}
                                    placeholder="0.00"
                                    disabled={!canEdit}
                                />
                            </div>
                        </div>

                        <div style={{ display: "flex", gap: "1.5rem", marginTop: "0.5rem", marginBottom: "1rem" }}>
                            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.875rem" }}>
                                <input
                                    type="checkbox"
                                    checked={isMeterReset}
                                    onChange={e => setIsMeterReset(e.target.checked)}
                                    className="form-checkbox"
                                    disabled={!canEdit}
                                />
                                Thay đồng hồ / Reset về 0
                            </label>
                        </div>

                        <div className="form-row">
                            <div className="form-group" style={{ flex: 2 }}>
                                <label className="form-label">Ghi chú / Lý do</label>
                                <textarea
                                    className="form-textarea"
                                    rows={3}
                                    value={note}
                                    onChange={e => setNote(e.target.value)}
                                    placeholder="Nhập ghi chú hoặc lý do nếu reset chỉ số..."
                                    disabled={!canEdit}
                                />
                            </div>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label className="form-label">Ảnh chứng minh</label>
                                <div
                                    onClick={() => canEdit && document.getElementById("photo-upload").click()}
                                    style={{
                                        border: "2px dashed var(--color-border)",
                                        borderRadius: "0.5rem",
                                        height: "80px",
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        cursor: canEdit ? "pointer" : "not-allowed",
                                        overflow: "hidden",
                                        position: "relative",
                                        background: photoPreview ? "none" : "#f8fafc"
                                    }}
                                >
                                    {photoPreview ? (
                                        <img src={photoPreview} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="Preview" />
                                    ) : (
                                        <>
                                            <Camera size={20} color="var(--color-text-muted)" />
                                            <span style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", marginTop: 4 }}>Tải ảnh</span>
                                        </>
                                    )}
                                    <input id="photo-upload" type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: "none" }} disabled={!canEdit} />
                                </div>
                                {isEdit && reading?.photoUrl && (
                                    <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: 6 }}>
                                        Ảnh hiện tại (bấm để thay ảnh)
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Hủy</button>
                        <button type="submit" className="btn btn-primary" disabled={loading || !canEdit}>
                            <Save size={14} /> {loading ? "Đang lưu..." : "Lưu bản ghi"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ─── Main Page ─── */
export default function MeterReadingPage() {
    const [services, setServices] = useState([]);
    const [selectedService, setSelectedService] = useState("");
    const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));
    const [readings, setReadings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingReading, setEditingReading] = useState(null);
    const [toasts, setToasts] = useState([]);
    const fileInputRef = useRef(null);
    const newIndexRefs = useRef({});

    const addToast = useCallback((msg, type = "success") => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, msg, type }]);
        setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
    }, []);

    const fetchServices = useCallback(async () => {
        try {
            const res = await serviceApi.getAll(true);
            const allActive = res.data?.result || [];
            // Chỉ lấy các dịch vụ có tính theo chỉ số (METER/TIER).
            // Vẫn hỗ trợ các giá trị cũ METERED/TIERED nếu có dữ liệu legacy.
            const allowed = ["METER", "TIER", "METERED", "TIERED"];
            const filterable = allActive.filter(s =>
                allowed.includes(s.billingMethod?.toUpperCase())
            );
            setServices(filterable);
            if (filterable.length > 0 && !selectedService) {
                setSelectedService(filterable[0].id);
            }
        } catch (err) {
            addToast("Không thể tải danh sách dịch vụ", "error");
        }
    }, [addToast, selectedService]);

    const fetchReadings = useCallback(async () => {
        if (!selectedService || !period) return;
        setLoading(true);
        try {
            const res = await meterReadingApi.getByPeriod(period, selectedService);
            const raw = res.data?.result || [];
            // Luôn tính sẵn tiêu thụ để hiển thị, ngay cả trước khi sửa.
            const mapped = raw.map(r => {
                const newIdx = parseFloat(r.newIndex ?? 0) || 0;
                const oldIdx = r.oldIndex || 0;
                let usage = r.usage;
                if (usage === undefined || usage === null) {
                    if (r.isMeterReset && newIdx < oldIdx) {
                        usage = newIdx;
                    } else {
                        usage = newIdx - oldIdx;
                    }
                }
                return { ...r, newIndex: r.newIndex ?? "", usage };
            });
            setReadings(mapped);
        } catch (err) {
            addToast("Không thể tải dữ liệu chỉ số", "error");
        } finally {
            setLoading(false);
        }
    }, [selectedService, period, addToast]);

    useEffect(() => { fetchServices(); }, [fetchServices]);
    useEffect(() => { fetchReadings(); }, [fetchReadings]);

    const handleIndexChange = (id, value) => {
        setReadings((prev) =>
            prev.map((r) => {
                if (r.id === id) {
                    const newIdx = parseFloat(value) || 0;
                    let usage = newIdx - (r.oldIndex || 0);
                    if (r.isMeterReset && newIdx < r.oldIndex) {
                        usage = newIdx; // Logic reset: tiêu thụ bằng đúng chỉ số mới
                    }
                    return { ...r, newIndex: value, usage, isModified: true };
                }
                return r;
            })
        );
    };

    const toggleReset = (id) => {
        setReadings(prev => prev.map(r => {
            if (r.id === id) {
                const resetValue = !r.isMeterReset;
                const nIdx = parseFloat(r.newIndex) || 0;
                const usage = resetValue && nIdx < r.oldIndex ? nIdx : (nIdx - (r.oldIndex || 0));
                return { ...r, isMeterReset: resetValue, usage, isModified: true };
            }
            return r;
        }));
    };

    const handleSaveAll = async () => {
        const modified = readings.filter((r) => r.isModified && r.status === "DRAFT");
        setSaving(true);
        try {
            await Promise.all(modified.map((r) =>
                meterReadingApi.update(r.id, {
                    newIndex: parseFloat(r.newIndex),
                    isMeterReset: r.isMeterReset,
                    note: r.note
                })
            ));
            addToast(`Đã lưu ${modified.length} bản ghi`);
            fetchReadings();
        } catch (err) {
            addToast("Lỗi khi lưu dữ liệu", "error");
        } finally {
            setSaving(false);
        }
    };

    const handleExportTemplate = () => {
        if (readings.length === 0) { addToast("Không có dữ liệu để xuất mẫu", "error"); return; }
        const ws = XLSX.utils.json_to_sheet(readings.map(r => ({
            MaHoDan: r.apartmentCode,
            TenChuHo: r.residentName,
            ChiSoCu: r.oldIndex,
            ChiSoMoi: ""
        })));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Template");
        XLSX.writeFile(wb, `Mau_Ghi_Chi_So_${period}.xlsx`);
    };

    const handleExcelImport = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const data = XLSX.utils.sheet_to_json(XLSX.read(event.target.result, { type: "binary" }).Sheets[0]);
            setReadings(prev => prev.map(r => {
                const match = data.find(d => d.MaHoDan === r.apartmentCode);
                if (match) {
                    const newIdx = parseFloat(match.ChiSoMoi) || 0;
                    return { ...r, newIndex: match.ChiSoMoi, usage: newIdx - (r.oldIndex || 0), isModified: true };
                }
                return r;
            }));
        };
        reader.readAsBinaryString(file);
        e.target.value = null;
    };

    const activeSvc = services.find(s => s.id === selectedService);

    return (
        <div className="meter-reading-page">
            <div className="page-header">
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <Gauge size={24} />
                    <div>
                        <h1 className="page-header__title">Ghi chỉ số dịch vụ</h1>
                        <p className="page-header__subtitle">Theo dõi và nhập chỉ số đo lường</p>
                    </div>
                </div>
            </div>

            <div className="card" style={{ marginBottom: "1.5rem", padding: "1rem 1.5rem" }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "1.5rem", alignItems: "flex-end" }}>
                    <div className="form-group" style={{ marginBottom: 0, minWidth: 150 }}>
                        <label className="form-label">Kỳ kế toán</label>
                        <input type="month" className="form-input" value={period} onChange={e => setPeriod(e.target.value)} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0, minWidth: 200 }}>
                        <label className="form-label">Loại dịch vụ</label>
                        <select className="form-select" value={selectedService} onChange={e => setSelectedService(e.target.value)}>
                            {services.map(s => <option key={s.id} value={s.id}>{s.name} ({s.unit})</option>)}
                        </select>
                    </div>
                    <div style={{ marginLeft: "auto", display: "flex", gap: "0.75rem" }}>
                        <button
                            className="btn btn-primary btn-sm"
                            onClick={() => {
                                setEditingReading(null);
                                setShowAddModal(true);
                            }}
                            disabled={!selectedService}
                        >
                            <Plus size={14} /> Thêm chỉ số
                        </button>
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="toolbar">
                    <div className="toolbar__search">
                        <Search className="search-icon" />
                        <input className="form-input" placeholder="Tìm căn hộ..." />
                    </div>
                    <div className="toolbar__actions">
                        <button className="btn btn-secondary btn-sm" onClick={handleExportTemplate}><Download size={14} /> Xuất mẫu</button>
                        <button className="btn btn-secondary btn-sm" onClick={() => fileInputRef.current?.click()}><Upload size={14} /> Excel</button>
                        <input type="file" ref={fileInputRef} style={{ display: "none" }} accept=".xlsx,.xls" onChange={handleExcelImport} />
                        <button className="btn btn-primary btn-sm" disabled={saving || readings.filter(r => r.isModified).length === 0} onClick={handleSaveAll}>
                            <Save size={14} /> {saving ? "Đang lưu..." : "Lưu tất cả"}
                        </button>
                    </div>
                </div>

                <div style={{ overflowX: "auto" }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Căn hộ</th>
                                <th>Chỉ số cũ</th>
                                <th style={{ width: 140 }}>Chỉ số mới</th>
                                <th>Tiêu thụ</th>
                                <th>Status</th>
                                <th>Ghi chú / Reset</th>
                                <th style={{ textAlign: "center" }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? <tr><td colSpan={7} style={{ textAlign: "center", padding: "2rem" }}>Đang tải...</td></tr> :
                                readings.length === 0 ? <tr><td colSpan={7} style={{ textAlign: "center", padding: "2rem" }}>Chưa có dữ liệu kỳ {period}.</td></tr> :
                                    readings.map(r => (
                                        <tr key={r.id} className={r.isModified ? "row--modified" : ""}>
                                            <td>
                                                <div style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                                    {r.apartmentCode}
                                                    {r.photoUrl && <ImageIcon size={14} color="var(--color-primary)" title="Có ảnh đính kèm" />}
                                                </div>
                                            </td>
                                            <td>{r.oldIndex}</td>
                                            <td>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    className="form-input form-input--sm"
                                                    value={r.newIndex}
                                                    disabled={r.status !== "DRAFT"}
                                                    onChange={e => handleIndexChange(r.id, e.target.value)}
                                                    ref={el => {
                                                        if (el) {
                                                            newIndexRefs.current[r.id] = el;
                                                        }
                                                    }}
                                                />
                                            </td>
                                            <td style={{ fontWeight: 700, color: r.usage < 0 ? "var(--color-danger)" : "var(--color-primary)" }}>{r.usage?.toLocaleString()}</td>
                                            <td><span className={`badge ${STATUS_BADGE[r.status]?.cls}`}>{STATUS_BADGE[r.status]?.text}</span></td>
                                            <td>
                                                <input
                                                    className="form-input form-input--sm"
                                                    value={r.note || ""}
                                                    disabled={r.status !== "DRAFT"}
                                                    onChange={e => {
                                                        setReadings(prev => prev.map(x => x.id === r.id ? { ...x, note: e.target.value, isModified: true } : x));
                                                    }}
                                                />
                                            </td>
                                            <td>
                                                <div style={{ display: "flex", gap: "0.4rem", justifyContent: "center" }}>
                                                    {r.status === "DRAFT" && (
                                                        <>
                                                            <button
                                                                className="icon-btn"
                                                                title="Chỉnh sửa chỉ số"
                                                                onClick={() => {
                                                                    setEditingReading(r);
                                                                    setShowAddModal(true);
                                                                }}
                                                            >
                                                                ✏
                                                            </button>
                                                            <button
                                                                className={`icon-btn ${r.isMeterReset ? "warning" : ""}`}
                                                                title="Đánh dấu thay đồng hồ / Reset"
                                                                onClick={() => toggleReset(r.id)}
                                                            >
                                                                R
                                                            </button>
                                                            <button
                                                                className="icon-btn success"
                                                                title="Xác nhận chỉ số"
                                                                onClick={() => meterReadingApi.confirm(r.id).then(fetchReadings)}
                                                            >
                                                                <CheckCircle size={15} />
                                                            </button>
                                                        </>
                                                    )}
                                                    {r.status === "CONFIRMED" && <button className="icon-btn warning" onClick={() => meterReadingApi.lock(r.id).then(fetchReadings)}><Lock size={15} /></button>}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {showAddModal && (
                <ManualReadingModal
                    service={activeSvc}
                    period={period}
                    reading={editingReading}
                    onSaved={() => {
                        setShowAddModal(false);
                        setEditingReading(null);
                        fetchReadings();
                        addToast(editingReading ? "Đã cập nhật chỉ số" : "Đã thêm chỉ số mới");
                    }}
                    onClose={() => {
                        setShowAddModal(false);
                        setEditingReading(null);
                    }}
                    onError={msg => addToast(msg, "error")}
                />
            )}

            <Toast toasts={toasts} onRemove={id => setToasts(prev => prev.filter(t => t.id !== id))} />
            <style>{`
        .row--modified { background-color: #f0f9ff; }
        .form-checkbox { width: 16px; height: 16px; cursor: pointer; }
      `}</style>
        </div>
    );
}
