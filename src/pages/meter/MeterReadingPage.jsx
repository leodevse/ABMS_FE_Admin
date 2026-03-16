import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
    Gauge, Search, Download, Upload, Save, CheckCircle, Lock,
    AlertCircle, ChevronDown, ChevronUp, Edit2, RefreshCw, Plus, Image as ImageIcon
} from "lucide-react";
import * as XLSX from "xlsx";
import { meterReadingApi } from "../../services/meterReadingApi";
import { serviceApi } from "../../services/serviceApi";
import { fetchApartmentsByBuilding } from "../../api/apartmentApi";
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

/* ─── Main Page ─── */
export default function MeterReadingPage() {
    const navigate = useNavigate();
    const [services, setServices] = useState([]);
    const [selectedService, setSelectedService] = useState("");
    const [buildings, setBuildings] = useState([]);
    const [selectedBuilding, setSelectedBuilding] = useState("");
    const [buildingApartments, setBuildingApartments] = useState([]);
    const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));
    const [readings, setReadings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [toasts, setToasts] = useState([]);

    const [expandedFloors, setExpandedFloors] = useState({});
    const [expandedApts, setExpandedApts] = useState({});
    const fileInputRef = useRef(null);

    const addToast = useCallback((msg, type = "success") => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, msg, type }]);
        setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
    }, []);

    // 1. Load Services and Buildings
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const resService = await serviceApi.getAll(true);
                const serviceList = resService.data?.result || [];
                setServices(serviceList);
                if (serviceList.length > 0) setSelectedService(serviceList[0].id);

                const resBuilding = await fetchBuildings(0, 1000);
                const buildingList = resBuilding.result?.content || resBuilding.result || resBuilding || [];
                setBuildings(buildingList);
                if (buildingList.length > 0) setSelectedBuilding(buildingList[0].id);
            } catch (error) {
                addToast("Lỗi khi tải dữ liệu khởi tạo", "error");
            }
        };
        loadInitialData();
    }, [addToast]);

    // 2. Load Apartments when building changes
    useEffect(() => {
        if (!selectedBuilding) return;
        const loadApartments = async () => {
            setBuildingApartments([]);
            try {
                const res = await fetchApartmentsByBuilding(selectedBuilding);
                setBuildingApartments(res.result || res.data || []);
            } catch (err) {
                console.error("Lỗi khi tải căn hộ:", err);
            }
        };
        loadApartments();
    }, [selectedBuilding]);

    // 3. Load Readings when service or period changes
    const fetchReadings = useCallback(async () => {
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
    }, [selectedService, period, addToast]);

    useEffect(() => {
        fetchReadings();
    }, [fetchReadings]);

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

    const toggleFloor = (floor) => setExpandedFloors(prev => ({ ...prev, [floor]: !prev[floor] }));
    const toggleApt = (id) => setExpandedApts(prev => ({ ...prev, [id]: !prev[id] }));

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
                        <button className="btn btn-primary btn-sm" onClick={() => navigate(`/meter-readings/create?serviceId=${selectedService}&period=${period}&buildingId=${selectedBuilding}`)} disabled={!selectedService}>
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
                                                                                <th style={{ textAlign: "center", textTransform: "uppercase", fontSize: "0.75rem", color: "#64748b" }}>HÀNH ĐỘNG</th>
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
                                                                                            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", background: "#f1f5f9", padding: "0.2rem 0.6rem", borderRadius: "1rem" }}>
                                                                                                <span style={{ fontSize: "0.75rem", fontWeight: 600 }}>{activeSvc?.billingMethod === "AREA" ? "THEO DIỆN TÍCH" : "CỐ ĐỊNH"}</span>
                                                                                            </span>
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
                                                                                            <button className="icon-btn success" title="Thêm chỉ số" onClick={() => navigate(`/meter-readings/create?serviceId=${selectedService}&period=${period}&buildingId=${selectedBuilding}&apartmentId=${r.apartmentId}`)}>
                                                                                                <Plus size={15} />
                                                                                            </button>
                                                                                        ) : r.status === "DRAFT" ? (
                                                                                            <>
                                                                                                <button className="icon-btn success" title="Xác nhận" onClick={() => meterReadingApi.confirm(r.id).then(fetchReadings)}><CheckCircle size={15} /></button>
                                                                                                <button className="icon-btn primary" title="Sửa" onClick={() => navigate(`/meter-readings/edit/${r.id}?serviceId=${selectedService}&period=${period}&buildingId=${selectedBuilding}`)}><Edit2 size={15} /></button>
                                                                                            </>
                                                                                        ) : r.status === "CONFIRMED" ? (
                                                                                            <>
                                                                                                <button className="icon-btn warning" title="Khóa" onClick={() => meterReadingApi.lock(r.id).then(fetchReadings)}><Lock size={15} /></button>
                                                                                                <button className="icon-btn primary" title="Xem/Sửa" onClick={() => navigate(`/meter-readings/edit/${r.id}?serviceId=${selectedService}&period=${period}&buildingId=${selectedBuilding}`)}><Edit2 size={15} /></button>
                                                                                            </>
                                                                                        ) : (
                                                                                            <button className="icon-btn primary" title="Xem chi tiết" onClick={() => navigate(`/meter-readings/edit/${r.id}?serviceId=${selectedService}&period=${period}&buildingId=${selectedBuilding}`)}><Edit2 size={15} /></button>
                                                                                        )}
                                                                                    </div>
                                                                                </td>
                                                                            </tr>
                                                                        </tbody>
                                                                    </table>
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

            <Toast toasts={toasts} onRemove={id => setToasts(prev => prev.filter(t => t.id !== id))} />
            <style>{`
                .row--modified { background-color: #f0f9ff; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
