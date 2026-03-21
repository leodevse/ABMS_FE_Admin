import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
    Gauge, Search, Download, Upload, Save, CheckCircle, Lock,
    AlertCircle, ChevronDown, ChevronUp, Edit2, RefreshCw, Plus, Image as ImageIcon,
    ChevronLeft, ChevronRight
} from "lucide-react";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import { meterReadingApi } from "../../services/meterReadingApi";
import { serviceApi } from "../../services/serviceApi";
import { fetchApartmentsWithFilters, fetchBuildingFloors, fetchApartmentsByBuilding } from "../../services/apartmentApi";
import { fetchBuildings } from "../../services/buildingApi";

// ── helpers ──────────────────────────────────────────────────
const STATUS_BADGE = {
    DRAFT: { text: "Nháp", cls: "badge--inactive" },
    CONFIRMED: { text: "Đã xác nhận", cls: "badge--metered" },
    LOCKED: { text: "Đã khóa", cls: "badge--active" },
    UNRECORDED: { text: "Chưa ghi", cls: "badge--inactive" },
};


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

    const [expandedFloors, setExpandedFloors] = useState({});
    const [expandedApts, setExpandedApts] = useState({});
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ totalPages: 0, totalElements: 0, pageSize: 5 });
    const [availableFloors, setAvailableFloors] = useState([]);
    const [floorIndex, setFloorIndex] = useState(0);
    const [filters, setFilters] = useState({ code: "" });
    const fileInputRef = useRef(null);


    const location = useLocation();
    const query = new URLSearchParams(location.search);
    const qServiceId = query.get("serviceId");
    const qBuildingId = query.get("buildingId");
    const qPeriod = query.get("period");

    // 1. Load Services and Buildings
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const resService = await serviceApi.getAll(true);
                const serviceList = resService.data?.result || [];
                setServices(serviceList);
                if (serviceList.length > 0) {
                    setSelectedService(qServiceId || serviceList[0].id);
                }

                const resBuilding = await fetchBuildings(0, 1000);
                const buildingList = resBuilding.result?.content || resBuilding.result || resBuilding || [];
                setBuildings(buildingList);
                if (buildingList.length > 0) {
                    setSelectedBuilding(qBuildingId || buildingList[0].id);
                }

                if (qPeriod) setPeriod(qPeriod);
            } catch (error) {
                toast.error("Lỗi khi tải dữ liệu khởi tạo");
            }
        };
        loadInitialData();
    }, []);

    // 2. Load Floors when building changes
    useEffect(() => {
        if (!selectedBuilding) {
            setAvailableFloors([]);
            setFloorIndex(0);
            return;
        }
        const loadFloors = async () => {
            try {
                const res = await fetchBuildingFloors(selectedBuilding);
                const floors = res.result || [];
                setAvailableFloors(floors);
                setFloorIndex(0);
                setPage(1);
            } catch (err) {
                console.error("Lỗi khi tải danh sách tầng:", err);
            }
        };
        loadFloors();
    }, [selectedBuilding]);

    // 2.2. Load Apartments when building, floorIndex, page or filters change
    useEffect(() => {
        if (!selectedBuilding || availableFloors.length === 0) return;

        const loadApts = async () => {
            try {
                const floor = availableFloors[floorIndex];
                const res = await fetchApartmentsWithFilters({
                    buildingId: selectedBuilding,
                    floorNumber: floor,
                    page: page - 1,
                    size: 5,
                    ...(filters.code && { code: filters.code }),
                });
                const pagingResult = res.result || {};
                setBuildingApartments(pagingResult.content || []);
                setPagination({
                    totalPages: pagingResult.totalPages || 0,
                    totalElements: pagingResult.totalElements || 0,
                    pageSize: pagingResult.size || 5
                });
            } catch (err) {
                console.error("Lỗi khi tải căn hộ:", err);
            }
        };
        loadApts();
    }, [selectedBuilding, availableFloors, floorIndex, page, filters]);

    // 3. Load Readings when service or period changes
    const fetchReadings = useCallback(async () => {
        if (!selectedService || !period) return;
        setLoading(true);
        try {
            const res = await meterReadingApi.getByPeriod(period, selectedService);
            setReadings(res.data?.result || []);
        } catch (err) {
            toast.error("Không thể tải dữ liệu chỉ số");
        } finally {
            setLoading(false);
        }
    }, [selectedService, period]);

    useEffect(() => {
        fetchReadings();
    }, [fetchReadings]);

    const handleSaveAll = async () => {
        const modified = readings.filter((r) => r.isModified && (r.status === "DRAFT" || r.status === "UNRECORDED"));
        if (modified.length === 0) return;
        setSaving(true);
        try {
            await Promise.all(modified.map((r) => {
                const isTemp = String(r.id).startsWith("temp-");
                const payload = {
                    apartmentId: r.apartmentId,
                    serviceId: selectedService,
                    period: period,
                    newIndex: parseFloat(r.newIndex),
                    isMeterReset: !!r.isMeterReset,
                    note: r.note || ""
                };

                if (isTemp) {
                    return meterReadingApi.create(payload);
                } else {
                    return meterReadingApi.update(r.id, payload);
                }
            }));
            toast.success(`Đã lưu ${modified.length} bản ghi`);
            fetchReadings();
        } catch (err) {
            toast.error("Lỗi khi lưu dữ liệu");
        } finally {
            setSaving(false);
        }
    };

    const handleExportTemplate = async () => {
        if (!selectedBuilding) { toast.error("Vui lòng chọn tòa nhà để xuất mẫu"); return; }
        setLoading(true);
        try {
            // Fetch all apartments for building to have a complete template
            const resApts = await fetchApartmentsByBuilding(selectedBuilding);
            const allApts = resApts.result || [];

            if (allApts.length === 0) {
                toast.error("Tòa nhà chưa có dữ liệu căn hộ");
                return;
            }

            // Create flat list for Excel
            const data = allApts.map(apt => {
                // Find current reading if exists to pre-fill OLD index
                const r = readings.find(read => read.apartmentId === apt.id);
                return {
                    "Tầng": apt.floorNumber,
                    "Mã căn hộ": apt.code,
                    "Tên cư dân": apt.residentName || "Chưa có",
                    "Chỉ số cũ": r ? r.oldIndex : 0,
                    "Chỉ số mới": r ? (r.newIndex || "") : ""
                };
            });

            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Mau_Ghi_Chi_So");

            const buildingName = buildings.find(b => b.id === selectedBuilding)?.name || "Building";
            const serviceName = services.find(s => s.id === selectedService)?.name || "Service";
            XLSX.writeFile(wb, `Mau_Ghi_Chi_So_${buildingName}_${serviceName}_${period}.xlsx`);
            toast.success("Đã xuất mẫu Excel cho tòa nhà");
        } catch (err) {
            console.error("Export template error:", err);
            toast.error("Lỗi khi tạo file mẫu Excel");
        } finally {
            setLoading(false);
        }
    };

    const handleExcelImport = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const workbook = XLSX.read(event.target.result, { type: "binary" });
                const ws = workbook.Sheets[workbook.SheetNames[0]];
                const data = XLSX.utils.sheet_to_json(ws);

                if (data.length === 0) {
                    toast.error("File Excel không có dữ liệu");
                    return;
                }

                // Để import được các căn hộ chưa có bản ghi, ta cần danh sách căn hộ toàn tòa nhà
                let allApts = [];
                try {
                    const resApts = await fetchApartmentsByBuilding(selectedBuilding);
                    allApts = resApts.result || [];
                } catch (err) {
                    console.error("Lỗi tải danh sách căn hộ khi import:", err);
                }

                setReadings(prev => {
                    const nextReadings = [...prev];
                    let matchCount = 0;

                    data.forEach(row => {
                        const aptCode = String(row["Mã căn hộ"] || row["MaHoDan"] || row["Căn hộ"] || "").trim();
                        const newIdxStr = row["Chỉ số mới"] !== undefined ? row["Chỉ số mới"] : row["ChiSoMoi"];

                        if (aptCode && newIdxStr !== undefined && newIdxStr !== "") {
                            const newIdxNum = parseFloat(newIdxStr);
                            if (!isNaN(newIdxNum)) {
                                // 1. Tìm trong readings đã có
                                const idx = nextReadings.findIndex(r => String(r.apartmentCode).trim() === aptCode);

                                if (idx >= 0) {
                                    const r = nextReadings[idx];
                                    nextReadings[idx] = {
                                        ...r,
                                        newIndex: String(newIdxNum),
                                        usage: newIdxNum - (r.oldIndex || 0),
                                        isModified: true,
                                        status: r.status === "UNRECORDED" ? "DRAFT" : r.status
                                    };
                                    matchCount++;
                                } else {
                                    // 2. Tìm trong danh sách căn hộ để tạo mới bản ghi DRAFT
                                    const apt = allApts.find(a => String(a.code).trim() === aptCode);
                                    if (apt) {
                                        nextReadings.push({
                                            id: "temp-import-" + apt.id,
                                            apartmentId: apt.id,
                                            apartmentCode: apt.code,
                                            residentName: apt.residentName,
                                            buildingId: apt.buildingId,
                                            period: period,
                                            serviceId: selectedService,
                                            oldIndex: 0,
                                            newIndex: String(newIdxNum),
                                            usage: newIdxNum,
                                            status: "DRAFT",
                                            isModified: true,
                                            isPlaceholder: false
                                        });
                                        matchCount++;
                                    }
                                }
                            }
                        }
                    });

                    if (matchCount > 0) {
                        toast.success(`Đã cập nhật ${matchCount} chỉ số từ Excel`);
                    } else {
                        toast.error("Không tìm thấy mã căn hộ tương ứng trong danh sách");
                    }
                    return nextReadings;
                });
            } catch (err) {
                console.error("Import error:", err);
                toast.error("Lỗi khi đọc file Excel. Vui lòng kiểm tra lại định dạng.");
            }
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
        // Map để tra cứu tầng từ ID căn hộ
        const aptToFloor = {};
        buildingApartments.forEach(a => aptToFloor[a.id] = a.floorNumber);

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
                floor: apt.floorNumber, // Thêm dữ liệu tầng vào placeholder
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
            // Lấy tầng từ dữ liệu căn hộ nạp vào hoặc logic cũ
            const floor = r.floor || aptToFloor[r.apartmentId] || getFloorFromCode(r.apartmentCode);
            if (!groups[floor]) groups[floor] = [];
            groups[floor].push(r);
        });
        const sortedFloors = Object.keys(groups).sort((a, b) => {
            if (a === "Khác") return 1;
            if (b === "Khác") return -1;
            const fa = parseInt(a);
            const fb = parseInt(b);
            if (isNaN(fa)) return a.localeCompare(b);
            if (isNaN(fb)) return a.localeCompare(b);
            return fa - fb;
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
                        <select className="form-select" value={selectedBuilding} onChange={e => { setSelectedBuilding(e.target.value); setPage(1); }}>
                            <option value="">Chọn tòa nhà</option>
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
                    {/* <div style={{ marginLeft: "auto", display: "flex", gap: "0.75rem" }}>
                        <button className="btn btn-primary btn-sm" onClick={() => navigate(`/meter-readings/create?serviceId=${selectedService}&period=${period}&buildingId=${selectedBuilding}`)} disabled={!selectedService}>
                            <Plus size={14} /> Thêm chỉ số
                        </button>
                    </div> */}
                </div>
            </div>

            <div className="card" style={{ display: "flex", flexDirection: "column", minHeight: "500px" }}>
                <div className="toolbar" style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: "1rem", flexWrap: "wrap", gap: "1rem" }}>
                    <div style={{ display: "flex", gap: "0.75rem", flex: 1, minWidth: "300px" }}>
                        <div className="toolbar__search" style={{ flex: 1 }}>
                            <Search className="search-icon" />
                            <input
                                className="form-input"
                                placeholder="Mã căn hộ..."
                                value={filters.code}
                                onChange={e => { setFilters(prev => ({ ...prev, code: e.target.value })); setPage(1); }}
                            />
                        </div>
                        <div style={{ minWidth: "150px" }}>
                            <select
                                className="form-select"
                                value={floorIndex}
                                onChange={e => { setFloorIndex(parseInt(e.target.value)); setPage(1); }}
                            >
                                {availableFloors.map((f, i) => <option key={f} value={i}>Tầng {f}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="toolbar__actions">
                        <button className="btn btn-secondary btn-sm" onClick={() => { setFilters({ code: "" }); setFloorIndex(0); setPage(1); }} title="Xóa bộ lọc">Xóa lọc</button>
                        <button className="btn btn-secondary btn-sm" onClick={handleExportTemplate}><Download size={14} /> Xuất mẫu</button>
                        <button className="btn btn-secondary btn-sm" onClick={() => fileInputRef.current?.click()}><Upload size={14} /> Excel</button>
                        <input type="file" ref={fileInputRef} style={{ display: "none" }} accept=".xlsx,.xls" onChange={handleExcelImport} />
                        <button className="btn btn-primary btn-sm" disabled={saving || readings.filter(r => r.isModified).length === 0} onClick={handleSaveAll}>
                            <Save size={14} /> {saving ? "Đang lưu..." : "Lưu tất cả"}
                        </button>
                    </div>
                </div>

                <div style={{ overflowX: "auto", position: "relative", flex: 1 }}>
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
                                                                                                                                                                                                 {!String(r.id).startsWith("temp-") && (
                                                                                                     <button className="icon-btn success" title="Xác nhận" onClick={() => meterReadingApi.confirm(r.id).then(fetchReadings)}><CheckCircle size={15} /></button>
                                                                                                 )}
                                                                                                                                                                                                 <button 
                                                                                                     className="icon-btn primary" 
                                                                                                     title="Sửa" 
                                                                                                     onClick={() => {
                                                                                                         if (String(r.id).startsWith("temp-")) {
                                                                                                             navigate(`/meter-readings/create?serviceId=${selectedService}&period=${period}&buildingId=${selectedBuilding}&apartmentId=${r.apartmentId}&newIndex=${r.newIndex}&note=${r.note || ""}`);
                                                                                                         } else {
                                                                                                             navigate(`/meter-readings/edit/${r.id}?serviceId=${selectedService}&period=${period}&buildingId=${selectedBuilding}`);
                                                                                                         }
                                                                                                     }}
                                                                                                 >
                                                                                                     <Edit2 size={15} />
                                                                                                 </button>
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
                {/* Pagination Footer */}
                <div style={{
                    padding: "1rem 1.5rem",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderTop: "1px solid #e2e8f0",
                    backgroundColor: "#f8fafc"
                }}>
                    <div style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
                        Tầng <strong>{availableFloors[floorIndex]}</strong> · Dữ liệu trang <strong>{page}</strong> / {pagination.totalPages} · Tổng số {pagination.totalElements} căn hộ
                    </div>

                    <div style={{ display: "flex", gap: "0.5rem" }}>
                        {/* Floor Navigation */}
                        <button
                            className="btn btn-ghost btn-sm"
                            disabled={floorIndex === 0 || loading}
                            onClick={() => { setFloorIndex(i => i - 1); setPage(1); }}
                            style={{ background: "white", border: "1px solid var(--color-border)" }}
                            title="Tầng trước"
                        >
                            <ChevronUp size={18} />
                        </button>

                        <div style={{ borderLeft: "1px solid #e2e8f0", margin: "0 4px" }}></div>

                        <button
                            className="btn btn-ghost btn-sm"
                            disabled={page === 1 || loading}
                            onClick={() => setPage(p => p - 1)}
                            style={{ background: "white", border: "1px solid var(--color-border)" }}
                        >
                            <ChevronLeft size={18} /> Trang trước
                        </button>

                        <button
                            className="btn btn-ghost btn-sm"
                            disabled={page >= pagination.totalPages || loading}
                            onClick={() => setPage(p => p + 1)}
                            style={{ background: "white", border: "1px solid var(--color-border)" }}
                        >
                            Trang sau <ChevronRight size={18} />
                        </button>

                        <div style={{ borderLeft: "1px solid #e2e8f0", margin: "0 4px" }}></div>

                        <button
                            className="btn btn-ghost"
                            disabled={floorIndex >= availableFloors.length - 1 || loading}
                            onClick={() => { setFloorIndex(i => i + 1); setPage(1); }}
                            style={{ background: "white", border: "1px solid var(--color-border)" }}
                            title="Tầng sau"
                        >
                            <ChevronDown size={18} />
                        </button>
                    </div>
                </div>
            </div>


            <style>{`
                .row--modified { background-color: #f0f9ff; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
