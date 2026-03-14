import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
    Gauge, Search, Download, Upload, Save, CheckCircle, Lock,
    AlertCircle, ChevronRight, ChevronDown, ChevronUp, Edit2, FileSpreadsheet, RefreshCw, Plus, X, Camera, Image as ImageIcon
} from "lucide-react";
import * as XLSX from "xlsx";
import { meterReadingApi } from "../../api/meterReadingApi";
import { serviceApi } from "../../api/serviceApi";
import { apartmentApi, fetchApartmentsByBuilding } from "../../api/apartmentApi";
import { fetchBuildings } from "../../services/buildingApi";

// ── helpers ──────────────────────────────────────────────────
const STATUS_BADGE = {
    DRAFT: { text: "Nháp", cls: "badge--inactive" },
    CONFIRMED: { text: "Đã xác nhận", cls: "badge--metered" },
    LOCKED: { text: "Đã khóa", cls: "badge--active" },
    UNRECORDED: { text: "Chưa ghi", cls: "badge--inactive" },
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

/* ─── Manual Add/Edit Modal ─── */
function ManualReadingModal({ service, period, apartments, initialData, onSaved, onClose, onError }) {
    const isReadOnly = initialData && initialData.status !== "DRAFT" && initialData.status !== "UNRECORDED" && initialData.status !== undefined;
    const [selectedApartment, setSelectedApartment] = useState(initialData?.apartmentId || "");
    const [oldIndex, setOldIndex] = useState(initialData?.status !== "UNRECORDED" ? (initialData?.oldIndex || 0) : 0);
    const [newIndex, setNewIndex] = useState(initialData?.newIndex || "");
    const [isMeterReset, setIsMeterReset] = useState(initialData?.isMeterReset || false);
    const [photo, setPhoto] = useState(null);
    const resolveImageUrl = (url) => {
        if (!url) return null;
        if (url.startsWith('http') || url.startsWith('blob:')) return url;
        const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
        const basePath = baseUrl.replace(/\/api\/?$/, '');
        return url.startsWith('/') ? `${basePath}${url}` : `${basePath}/${url}`;
    };
    const [photoPreview, setPhotoPreview] = useState(resolveImageUrl(initialData?.photoUrl));
    const [note, setNote] = useState(initialData?.note || "");
    const [loading, setLoading] = useState(false);

    const parsedNew = parseFloat(newIndex);
    const parsedOld = parseFloat(oldIndex);
    const currentUsage = !isNaN(parsedNew) && !isNaN(parsedOld)
        ? (isMeterReset && parsedNew < parsedOld ? parsedNew : parsedNew - parsedOld)
        : "";

    useEffect(() => {
        if (!initialData || initialData.status === "UNRECORDED") {
            if (selectedApartment && service?.id && period) {
                meterReadingApi.getOldIndex(selectedApartment, service.id, period)
                    .then(res => setOldIndex(res.data?.result?.suggestedOldIndex ?? 0))
                    .catch(() => setOldIndex(0));
            }
        }
    }, [selectedApartment, service, period, initialData]);

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
        if (isReadOnly) { onClose(); return; }
        const isTier = service?.billingMethod === "TIER";

        if (!selectedApartment) {
            onError("Vui lòng chọn căn hộ");
            return;
        }

        if (isTier && newIndex === "") {
            onError("Vui lòng nhập chỉ số mới");
            return;
        }

        const nIdx = isTier ? parseFloat(newIndex) : 0;
        if (isTier && !isMeterReset && nIdx < oldIndex) {
            onError("Chỉ số mới không được nhỏ hơn chỉ số cũ trừ khi đánh dấu 'Thay đồng hồ/Reset'");
            return;
        }

        setLoading(true);
        try {
            const data = {
                apartmentId: selectedApartment,
                serviceId: service.id,
                period,
                oldIndex,
                newIndex: nIdx,
                isMeterReset,
                note
            };
            if (initialData && initialData.id && !initialData.isPlaceholder) {
                await meterReadingApi.update(initialData.id, data, photo);
            } else {
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
                        <h2 className="modal-title">
                            {isReadOnly ? "Chi tiết chỉ số" : (initialData && !initialData.isPlaceholder ? "Chỉnh sửa chỉ số" : "Thêm chỉ số thủ công")}
                        </h2>
                        <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                            Dịch vụ: <strong>{service?.name}</strong> · Kỳ: <strong>{period}</strong>
                        </p>
                    </div>
                    <button className="icon-btn" type="button" onClick={onClose}><X size={16} /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-group">
                            <label className="form-label">Chọn căn hộ</label>
                            <select className="form-select" value={selectedApartment} disabled={!!initialData} onChange={e => setSelectedApartment(e.target.value)} autoFocus>
                                <option value="">-- Danh sách căn hộ --</option>
                                {apartments.map(a => <option key={a.id} value={a.id}>{a.code}</option>)}
                            </select>
                        </div>

                        {service?.billingMethod === "TIER" && (
                            <>
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
                                            disabled={isReadOnly}
                                            style={isReadOnly ? { background: "#f1f5f9" } : {}}
                                        />
                                        {(!isMeterReset && parsedNew < parsedOld) && (
                                            <span style={{ color: "var(--color-warning)", fontSize: "0.8rem", marginTop: "0.25rem", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                                                <AlertCircle size={14} />
                                                Chỉ số mới nhỏ hơn chỉ số cũ. Vui lòng chọn Reset.
                                            </span>
                                        )}
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Tiêu thụ ({service?.unit})</label>
                                        <input
                                            className="form-input"
                                            value={currentUsage !== "" ? currentUsage.toLocaleString() : ""}
                                            disabled
                                            style={{ background: "#f1f5f9", fontWeight: "bold", color: currentUsage < 0 ? "var(--color-danger)" : "#334155" }}
                                        />
                                    </div>
                                </div>

                                <div style={{ display: "flex", gap: "1.5rem", marginTop: "0.5rem", marginBottom: "1rem" }}>
                                    <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: isReadOnly ? "default" : "pointer", fontSize: "0.875rem" }}>
                                        <input
                                            type="checkbox"
                                            checked={isMeterReset}
                                            onChange={e => setIsMeterReset(e.target.checked)}
                                            className="form-checkbox"
                                            disabled={isReadOnly}
                                        />
                                        Thay đồng hồ / Reset về 0
                                    </label>
                                </div>
                            </>
                        )}

                        <div className="form-row">
                            <div className="form-group" style={{ flex: 2 }}>
                                <label className="form-label">Ghi chú / Lý do</label>
                                <textarea
                                    className="form-textarea"
                                    rows={3}
                                    value={note}
                                    onChange={e => setNote(e.target.value)}
                                    placeholder={!isReadOnly ? "Nhập ghi chú hoặc lý do nếu reset chỉ số..." : ""}
                                    disabled={isReadOnly}
                                    style={isReadOnly ? { background: "#f1f5f9" } : {}}
                                />
                            </div>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label className="form-label">Ảnh chứng minh</label>
                                <div
                                    onClick={() => !isReadOnly && document.getElementById("photo-upload").click()}
                                    style={{
                                        border: "2px dashed var(--color-border)",
                                        borderRadius: "0.5rem",
                                        height: "80px",
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        cursor: isReadOnly ? "default" : "pointer",
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
                                            {!isReadOnly && <span style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", marginTop: 4 }}>Tải ảnh</span>}
                                        </>
                                    )}
                                    <input id="photo-upload" type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: "none" }} disabled={isReadOnly} />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="modal-footer">
                        {isReadOnly ? (
                            <button type="button" className="btn btn-primary" onClick={onClose}>Đóng</button>
                        ) : (
                            <>
                                <button type="button" className="btn btn-secondary" onClick={onClose}>Hủy</button>
                                <button type="submit" className="btn btn-primary" disabled={loading}>
                                    <Save size={14} /> {loading ? "Đang lưu..." : "Lưu bản ghi"}
                                </button>
                            </>
                        )}
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
    const [buildings, setBuildings] = useState([]);
    const [selectedBuilding, setSelectedBuilding] = useState("");
    const [buildingApartments, setBuildingApartments] = useState([]);
    const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));
    const [readings, setReadings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editData, setEditData] = useState(null);
    const [toasts, setToasts] = useState([]);

    const [expandedFloors, setExpandedFloors] = useState({});
    const [expandedApts, setExpandedApts] = useState({});
    const fileInputRef = useRef(null);

    const addToast = useCallback((msg, type = "success") => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, msg, type }]);
        setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
    }, []);

    // 1. Tải danh sách Dịch Vụ và Tòa Nhà khi mới quay vào trang
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                // Tải Dịch Vụ
                const resService = await serviceApi.getAll(true);
                const serviceList = resService.data?.result || [];
                setServices(serviceList);
                if (serviceList.length > 0) {
                    setSelectedService(serviceList[0].id);
                }

                // Tải Tòa Nhà
                const resBuilding = await fetchBuildings(0, 1000);
                const buildingList = resBuilding.result?.content || resBuilding.result || resBuilding || [];
                setBuildings(buildingList);
                if (buildingList.length > 0) {
                    setSelectedBuilding(buildingList[0].id);
                }
            } catch (error) {
                addToast("Lỗi khi tải dữ liệu khởi tạo", "error");
            }
        };

        loadInitialData();
    }, [addToast]);

    // 2. Tải danh sách Căn Hộ mỗi khi Tòa Nhà thay đổi
    useEffect(() => {
        if (!selectedBuilding) return;

        const loadApartments = async () => {
            setBuildingApartments([]); // Clear danh sách cũ
            try {
                const res = await fetchApartmentsByBuilding(selectedBuilding);
                setBuildingApartments(res.result || res.data || []);
            } catch (err) {
                console.error("Lỗi khi tải căn hộ:", err);
            }
        };

        loadApartments();
    }, [selectedBuilding]);

    // 3. Tải Chỉ Số Đồng Hồ mỗi khi Kỳ Thanh Toán hoặc Dịch Vụ thay đổi
    const fetchReadings = async () => {
        if (!selectedService || !period) return;
        setLoading(true);
        try {
            const res = await meterReadingApi.getByPeriod(period, selectedService);
            setReadings(res.data?.result || []);
        } catch (err) {
            addToast("Không thể tải dữ liệu chỉ số", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReadings();
    }, [selectedService, period]);

    // Helper functions cho thao tác UI đã bị gỡ bỏ, chỉ giữ lại API Load

    const handleSaveAll = async () => {
        const modified = readings.filter((r) => r.isModified && (r.status === "DRAFT" || r.status === "UNRECORDED"));
        if (modified.length === 0) return;
        setSaving(true);
        try {
            await Promise.all(modified.map((r) => {
                if (r.isPlaceholder) {
                    return meterReadingApi.create({
                        apartmentId: r.apartmentId,
                        serviceId: selectedService,
                        period: period,
                        newIndex: parseFloat(r.newIndex),
                        isMeterReset: !!r.isMeterReset,
                        note: r.note || ""
                    });
                } else {
                    return meterReadingApi.update(r.id, {
                        newIndex: parseFloat(r.newIndex),
                        isMeterReset: !!r.isMeterReset,
                        note: r.note || ""
                    });
                }
            }));
            addToast(`Đã lưu ${modified.length} bản ghi`);
            fetchReadings();
        } catch (err) {
            addToast("Lỗi khi lưu dữ liệu", "error");
        } finally {
            setSaving(false);
        }
    };

    const handleExportTemplate = () => {
        const flatList = groupedReadings.flatMap(g => g.items);
        if (flatList.length === 0) { addToast("Không có dữ liệu để xuất mẫu", "error"); return; }
        const ws = XLSX.utils.json_to_sheet(flatList.map(r => ({
            MaHoDan: r.apartmentCode,
            TenChuHo: r.residentName || "",
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
            setReadings(prev => {
                const newReadings = [...prev];
                data.forEach(match => {
                    const aptCode = match.MaHoDan;
                    const newIdx = parseFloat(match.ChiSoMoi) || 0;
                    const existingIndex = newReadings.findIndex(r => r.apartmentCode === aptCode);
                    if (existingIndex >= 0) {
                        const r = newReadings[existingIndex];
                        newReadings[existingIndex] = { ...r, newIndex: match.ChiSoMoi, usage: newIdx - (r.oldIndex || 0), isModified: true, status: r.status === "UNRECORDED" ? "DRAFT" : r.status };
                    } else {
                        const apt = buildingApartments.find(a => a.code === aptCode);
                        if (apt) {
                            newReadings.push({
                                id: "temp-" + apt.id,
                                apartmentId: apt.id,
                                apartmentCode: apt.code,
                                buildingId: apt.buildingId,
                                period: period,
                                serviceId: selectedService,
                                status: "DRAFT",
                                oldIndex: match.ChiSoCu || 0,
                                newIndex: match.ChiSoMoi,
                                usage: newIdx - (match.ChiSoCu || 0),
                                isModified: true,
                                isPlaceholder: true
                            });
                        }
                    }
                });
                return newReadings;
            });
        };
        reader.readAsBinaryString(file);
        e.target.value = null;
    };

    const getFloorFromCode = (code) => {
        if (!code) return "Khác";
        const parts = code.split('-');
        if (parts.length > 1) {
            const numPart = parts[1];
            if (numPart.length >= 3) {
                return parseInt(numPart.substring(0, numPart.length - 2), 10).toString();
            }
        }
        return "Khác";
    };

    const groupedReadings = useMemo(() => {
        const activeBuilding = buildings.find(b => b.id === selectedBuilding);
        const activeAptCodes = buildingApartments.map(a => a.code);

        const filteredReadings = activeBuilding
            ? readings.filter(r => activeAptCodes.includes(r.apartmentCode))
            : readings;

        let fullList = [...filteredReadings];
        if (activeBuilding && buildingApartments.length > 0) {
            const missingApts = buildingApartments.filter(apt =>
                !filteredReadings.some(r => r.apartmentCode === apt.code || r.apartmentId === apt.id)
            );
            const placeholders = missingApts.map(apt => ({
                id: "temp-" + apt.id,
                apartmentId: apt.id,
                apartmentCode: apt.code,
                buildingId: apt.buildingId,
                period: period,
                serviceId: selectedService,
                status: "UNRECORDED",
                oldIndex: 0,
                newIndex: "",
                usage: 0,
                isModified: false,
                isPlaceholder: true
            }));
            fullList = [...filteredReadings, ...placeholders];
        }

        const groups = {};
        fullList.forEach(r => {
            const floor = r.floor || getFloorFromCode(r.apartmentCode);
            if (!groups[floor]) groups[floor] = [];
            groups[floor].push(r);
        });
        const sortedFloors = Object.keys(groups).sort((a, b) => {
            if (a === "Khác") return 1;
            if (b === "Khác") return -1;
            return parseInt(a) - parseInt(b);
        });
        return sortedFloors.map(floor => ({
            floor,
            items: groups[floor].sort((a, b) => a.apartmentCode.localeCompare(b.apartmentCode))
        }));
    }, [readings, buildings, selectedBuilding, buildingApartments, period, selectedService]);

    const toggleFloor = (floor) => {
        setExpandedFloors(prev => ({ ...prev, [floor]: !prev[floor] }));
    };

    const toggleApt = (id) => {
        setExpandedApts(prev => ({ ...prev, [id]: !prev[id] }));
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
                    <div className="form-group" style={{ marginBottom: 0, minWidth: 200 }}>
                        <label className="form-label">Tòa Nhà</label>
                        <select className="form-select" value={selectedBuilding} onChange={e => setSelectedBuilding(e.target.value)}>
                            {buildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0, minWidth: 150 }}>
                        <label className="form-label">Kỳ Thanh toán</label>
                        <input type="month" className="form-input" value={period} onChange={e => setPeriod(e.target.value)} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0, minWidth: 200 }}>
                        <label className="form-label">Loại dịch vụ</label>
                        <select className="form-select" value={selectedService} onChange={e => setSelectedService(e.target.value)}>
                            {services.map(s => <option key={s.id} value={s.id}>{s.name} ({s.unit})</option>)}
                        </select>
                    </div>
                    <div style={{ marginLeft: "auto", display: "flex", gap: "0.75rem" }}>
                        <button className="btn btn-primary btn-sm" onClick={() => { setEditData(null); setShowAddModal(true); }} disabled={!selectedService}>
                            <Plus size={14} /> Thêm chỉ số
                        </button>
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="toolbar" style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: "1rem" }}>
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

                <div style={{ overflowX: "auto", position: "relative" }}>
                    {loading ? <div style={{ textAlign: "center", padding: "2rem" }}>Đang tải...</div> :
                        groupedReadings.length === 0 ? <div style={{ textAlign: "center", padding: "2rem" }}>Chưa có dữ liệu kỳ {period}.</div> :
                            (
                                <div className="accordion-container" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                                    {groupedReadings.map(group => (
                                        <div key={group.floor} className="floor-group">
                                            <div
                                                className="floor-header"
                                                onClick={() => toggleFloor(group.floor)}
                                                style={{
                                                    display: "flex", justifyContent: "space-between", alignItems: "center",
                                                    padding: "1rem", backgroundColor: "#f8fafc", borderRadius: "0.5rem",
                                                    cursor: "pointer", fontWeight: "bold", border: "1px solid #e2e8f0"
                                                }}
                                            >
                                                <span>Tầng {group.floor}</span>
                                                {expandedFloors[group.floor] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                            </div>

                                            {expandedFloors[group.floor] && (
                                                <div className="floor-content" style={{ display: "flex", flexDirection: "column", padding: "0.5rem 0", gap: "0.5rem", paddingLeft: "1rem", borderLeft: "2px solid #e2e8f0", marginLeft: "1rem", marginTop: "0.5rem" }}>
                                                    {group.items.map(r => (
                                                        <div key={r.id} className={`apt-group ${r.isModified ? "row--modified" : ""}`} style={{ border: "1px solid #e2e8f0", borderRadius: "0.5rem", overflow: "hidden", backgroundColor: "#fff" }}>
                                                            <div
                                                                className="apt-header"
                                                                onClick={() => toggleApt(r.id)}
                                                                style={{
                                                                    display: "flex", justifyContent: "space-between", alignItems: "center",
                                                                    padding: "1rem", cursor: "pointer"
                                                                }}
                                                            >
                                                                <span style={{ fontWeight: 500 }}>
                                                                    Căn hộ {r.apartmentCode}
                                                                    {r.photoUrl && <ImageIcon size={14} color="var(--color-primary)" title="Có ảnh đính kèm" style={{ marginLeft: 8, display: "inline-block", verticalAlign: "middle" }} />}
                                                                </span>
                                                                {expandedApts[r.id] ? <ChevronUp size={20} color="#94a3b8" /> : <ChevronDown size={20} color="#94a3b8" />}
                                                            </div>
                                                            {expandedApts[r.id] && (
                                                                <div className="apt-content" style={{ padding: "1rem", borderTop: "1px solid #e2e8f0", backgroundColor: "#fafafa" }}>
                                                                    <table className="data-table" style={{ border: "none" }}>
                                                                        <thead>
                                                                            <tr>
                                                                                {activeSvc?.billingMethod === "TIER" ? (
                                                                                    <>
                                                                                        <th style={{ textAlign: "center", textTransform: "uppercase", fontSize: "0.75rem", color: "#64748b" }}>CHỈ SỐ CŨ</th>
                                                                                        <th style={{ textAlign: "center", textTransform: "uppercase", fontSize: "0.75rem", color: "#64748b", width: 140 }}>CHỈ SỐ MỚI</th>
                                                                                        <th style={{ textAlign: "center", textTransform: "uppercase", fontSize: "0.75rem", color: "#64748b" }}>TIÊU THỤ</th>
                                                                                    </>
                                                                                ) : (
                                                                                    <>
                                                                                        <th style={{ textAlign: "left", textTransform: "uppercase", fontSize: "0.75rem", color: "#64748b", paddingLeft: "1.5rem" }}>HÌNH THỨC TÍNH</th>
                                                                                        <th style={{ textAlign: "left", textTransform: "uppercase", fontSize: "0.75rem", color: "#64748b" }}>GHI CHÚ</th>
                                                                                    </>
                                                                                )}
                                                                                <th style={{ textAlign: "center", textTransform: "uppercase", fontSize: "0.75rem", color: "#64748b" }}>TRẠNG THÁI</th>
                                                                                <th style={{ textAlign: "center", textTransform: "uppercase", fontSize: "0.75rem", color: "#64748b" }}>ACTIONS</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            <tr>
                                                                                {activeSvc?.billingMethod === "TIER" ? (
                                                                                    <>
                                                                                        <td style={{ textAlign: "center" }}>{r.oldIndex}</td>
                                                                                        <td style={{ textAlign: "center" }}>
                                                                                            {r.newIndex !== "" && r.newIndex !== null ? (
                                                                                                <span style={{ fontWeight: 500, color: "#334155" }}>{r.newIndex}</span>
                                                                                            ) : (
                                                                                                <span style={{ color: "#94a3b8" }}>-</span>
                                                                                            )}
                                                                                        </td>
                                                                                        <td style={{ textAlign: "center", fontWeight: 700, color: "#334155" }}>
                                                                                            {(() => {
                                                                                                if (r.newIndex === "" || r.newIndex === null || r.newIndex === undefined) return "-";
                                                                                                const n = parseFloat(r.newIndex);
                                                                                                const o = parseFloat(r.oldIndex) || 0;
                                                                                                if (isNaN(n)) return "-";
                                                                                                const computedUsage = (r.isMeterReset && n < o) ? n : (n - o);
                                                                                                return <span style={{ color: computedUsage < 0 ? "var(--color-danger)" : "inherit" }}>{computedUsage.toLocaleString()}</span>;
                                                                                            })()}
                                                                                        </td>
                                                                                    </>
                                                                                ) : (
                                                                                    <>
                                                                                        <td style={{ textAlign: "left", paddingLeft: "1.5rem", color: "#475569" }}>
                                                                                            {activeSvc?.billingMethod === "AREA" ? (
                                                                                                <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", background: "#f1f5f9", padding: "0.2rem 0.6rem", borderRadius: "1rem" }}>
                                                                                                    <span style={{ fontSize: "0.75rem", fontWeight: 600 }}>THEO DIỆN TÍCH</span>
                                                                                                </span>
                                                                                            ) : (
                                                                                                <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", background: "#f1f5f9", padding: "0.2rem 0.6rem", borderRadius: "1rem" }}>
                                                                                                    <span style={{ fontSize: "0.75rem", fontWeight: 600 }}>CỐ ĐỊNH</span>
                                                                                                </span>
                                                                                            )}
                                                                                        </td>
                                                                                        <td style={{ textAlign: "left", color: "#64748b", fontSize: "0.85rem" }}>
                                                                                            {r.note || <span style={{ fontStyle: "italic", opacity: 0.5 }}>-</span>}
                                                                                        </td>
                                                                                    </>
                                                                                )}
                                                                                <td style={{ textAlign: "center" }}>
                                                                                    <span className={`badge ${STATUS_BADGE[r.status]?.cls}`}>{STATUS_BADGE[r.status]?.text}</span>
                                                                                </td>
                                                                                <td style={{ textAlign: "center" }}>
                                                                                    <div style={{ display: "flex", gap: "0.4rem", justifyContent: "center" }}>
                                                                                        {r.status === "UNRECORDED" ? (
                                                                                            <button className="icon-btn success" title="Thêm chỉ số" onClick={() => { setEditData(r); setShowAddModal(true); }}>
                                                                                                <Plus size={15} />
                                                                                            </button>
                                                                                        ) : r.status === "DRAFT" ? (
                                                                                            <>
                                                                                                <button className="icon-btn success" title="Xác nhận" onClick={() => meterReadingApi.confirm(r.id).then(fetchReadings)}><CheckCircle size={15} /></button>
                                                                                                <button className="icon-btn primary" title="Sửa" onClick={() => { setEditData(r); setShowAddModal(true); }}><Edit2 size={15} /></button>
                                                                                            </>
                                                                                        ) : r.status === "CONFIRMED" ? (
                                                                                            <>
                                                                                                <button className="icon-btn warning" title="Khóa" onClick={() => meterReadingApi.lock(r.id).then(fetchReadings)}><Lock size={15} /></button>
                                                                                                <button className="icon-btn primary" title="Xem" onClick={() => { setEditData(r); setShowAddModal(true); }}><Edit2 size={15} /></button>
                                                                                            </>
                                                                                        ) : (
                                                                                            <button className="icon-btn primary" title="Xem chi tiết" onClick={() => { setEditData(r); setShowAddModal(true); }}><Edit2 size={15} /></button>
                                                                                        )}
                                                                                    </div>
                                                                                </td>
                                                                            </tr>
                                                                        </tbody>
                                                                    </table>
                                                                    {r.note && r.status !== "UNRECORDED" && (
                                                                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "1rem" }}>
                                                                            <div style={{ flex: 1, padding: "0.75rem", backgroundColor: "#f1f5f9", borderRadius: "0.5rem", fontSize: "0.875rem", color: "#475569" }}>
                                                                                <strong style={{ color: "#334155" }}>Ghi chú:</strong> {r.note}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                </div>
            </div>

            {showAddModal && (
                <ManualReadingModal
                    service={services.find(s => s.id === selectedService)}
                    period={period}
                    apartments={buildingApartments}
                    initialData={editData}
                    onSaved={() => {
                        setShowAddModal(false);
                        fetchReadings();
                        addToast(editData?.id && !editData?.isPlaceholder ? "Cập nhật thành công!" : "Đã thêm chỉ số mới!");
                    }}
                    onClose={() => setShowAddModal(false)}
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
