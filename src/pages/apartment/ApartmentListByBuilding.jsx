import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
    Search, Filter, ChevronLeft, ChevronRight, 
    Layers, BedDouble, Info, Loader2, Maximize2, RefreshCw
} from "lucide-react";
import { fetchApartmentsWithFilters } from "../../services/apartmentApi";

export default function ApartmentListByBuilding() {
    const { buildingId } = useParams();
    const navigate = useNavigate();

    // 1. STATE QUẢN LÝ DỮ LIỆU TỪ BACKEND
    const [apartments, setApartments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [totalPages, setTotalPages] = useState(0);
    const [currentPage, setCurrentPage] = useState(0);
    const [pageSize] = useState(10);
    
    // 2. STATE QUẢN LÝ BỘ LỌC (Sẽ được gửi làm Request Params)
    const [filters, setFilters] = useState({
        code: "",
        status: "",
        bedroomCount: "",
        floorNumber: ""
    });

    // 3. HÀM GỌI API - TRUYỀN TOÀN BỘ FILTER VỀ BACKEND
    const loadApartments = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                buildingId,
                page: currentPage,
                size: pageSize,
                // Chỉ đính kèm vào params nếu filter có giá trị
                ...(filters.code && { code: filters.code }),
                ...(filters.status && { status: filters.status }),
                ...(filters.bedroomCount && { bedroomCount: filters.bedroomCount }),
                ...(filters.floorNumber && { floorNumber: filters.floorNumber }),
                sort: "floorNumber,asc"
            };
            
            // API này sẽ gọi: GET /api/apartments/search/filter?buildingId=...&code=...&status=...
            const data = await fetchApartmentsWithFilters(params);
            
            if (data.result) {
                setApartments(data.result.content || []);
                setTotalPages(data.result.totalPages || 0);
            }
        } catch (err) {
            console.error("Lỗi khi fetch dữ liệu từ Backend:", err);
        } finally {
            setLoading(false);
        }
    }, [buildingId, currentPage, pageSize, filters]);

    // Tự động gọi lại Backend mỗi khi currentPage hoặc filters thay đổi
    useEffect(() => {
        loadApartments();
    }, [loadApartments]);

    // Xử lý thay đổi filter: Reset về trang 0 và cập nhật state filter
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setCurrentPage(0); 
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    // Hàm nút "Làm mới" - Xóa sạch filter và gọi lại Backend
    const handleReset = () => {
        setFilters({ code: "", status: "", bedroomCount: "", floorNumber: "" });
        setCurrentPage(0);
    };

    return (
        <div className="maintenance-detail-container" style={{ padding: "1.5rem", width: "100%", maxWidth: "none", minHeight: "100vh", boxSizing: "border-box" }}>
            
            {/* 1. PAGE HEADER */}
            <div className="page-header" style={{ marginBottom: "1.5rem", borderRadius: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                        <button 
                            className="btn btn-ghost btn-icon" 
                            onClick={() => navigate('/buildings')}
                            style={{ color: "white", borderColor: "rgba(255,255,255,0.3)" }}
                        >
                            <ChevronLeft size={24} />
                        </button>
                        <div>
                            <h1 className="page-header__title">Quản lý Căn hộ</h1>
                            <p className="page-header__subtitle">Dữ liệu trực tuyến từ máy chủ | Building ID: {buildingId.substring(0,8)}...</p>
                        </div>
                    </div>
                    <button className="btn btn-primary" onClick={handleReset} style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.4)" }}>
                        <RefreshCw size={18} style={{marginRight: "8px"}} /> Làm mới bộ lọc
                    </button>
                </div>
            </div>

            {/* 2. FILTER BAR (SERVER-SIDE FILTERING) */}
            <div className="card" style={{ marginBottom: "1.5rem", border: "1px solid var(--color-border)" }}>
                <div className="card-body" style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "center" }}>
                    
                    {/* Search Code - Backend LIKE query */}
                    <div style={{ position: "relative", flex: 2, minWidth: "250px" }}>
                        <Search style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} size={16} />
                        <input
                            name="code"
                            type="text"
                            className="form-input"
                            style={{ paddingLeft: "2.5rem" }}
                            placeholder="Tìm mã căn hộ (Gửi yêu cầu tới Backend)..."
                            value={filters.code}
                            onChange={handleFilterChange}
                        />
                    </div>

                    {/* Filter Floor */}
                    <div style={{ flex: 1, minWidth: "120px", position: "relative" }}>
                        <Layers style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)", zIndex: 1 }} size={16} />
                        <input
                            name="floorNumber"
                            type="number"
                            className="form-input"
                            style={{ paddingLeft: "2.5rem" }}
                            placeholder="Tầng..."
                            value={filters.floorNumber}
                            onChange={handleFilterChange}
                        />
                    </div>

                    {/* Filter Status Enum */}
                    <div style={{ flex: 1, minWidth: "180px" }}>
                        <select name="status" className="form-input" value={filters.status} onChange={handleFilterChange}>
                            <option value="">-- Trạng thái --</option>
                            <option value="AVAILABLE">Sẵn sàng (Available)</option>
                            <option value="OCCUPIED">Đã có người (Occupied)</option>
                            <option value="MAINTENANCE">Đang bảo trì</option>
                            <option value="RESERVED">Đã đặt chỗ</option>
                        </select>
                    </div>

                    {/* Filter Bedrooms */}
                    <div style={{ flex: 1, minWidth: "150px" }}>
                        <select name="bedroomCount" className="form-input" value={filters.bedroomCount} onChange={handleFilterChange}>
                            <option value="">-- Số phòng ngủ --</option>
                            <option value="1">1 Phòng ngủ</option>
                            <option value="2">2 Phòng ngủ</option>
                            <option value="3">3 Phòng ngủ</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* 3. DATA TABLE */}
            <div className="card">
                <div className="card-body p-0" style={{ overflowX: "auto" }}>
                    <table className="data-table" style={{ width: "100%" }}>
                        <thead>
                            <tr>
                                <th style={{ paddingLeft: "1.5rem", width: "20%" }}>Mã căn hộ</th>
                                <th style={{ width: "15%" }}>Vị trí tầng</th>
                                <th style={{ width: "20%" }}>Cấu hình</th>
                                <th style={{ width: "15%" }}>Diện tích</th>
                                <th style={{ width: "15%" }}>Trạng thái</th>
                                <th style={{ textAlign: "right", paddingRight: "1.5rem" }}>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: "center", padding: "5rem" }}>
                                        <Loader2 size={32} className="animate-spin" style={{ color: "var(--color-primary)", margin: "0 auto 1rem" }} />
                                        <p style={{ color: "var(--color-text-muted)", fontWeight: 500 }}>Đang truy vấn dữ liệu từ Backend...</p>
                                    </td>
                                </tr>
                            ) : apartments.length === 0 ? (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: "center", padding: "5rem", color: "var(--color-text-muted)" }}>
                                        Không tìm thấy kết quả nào từ máy chủ.
                                    </td>
                                </tr>
                            ) : (
                                apartments.map((apt) => (
                                    <tr key={apt.id} className="table-row-hover">
                                        <td style={{ paddingLeft: "1.5rem" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                                <div style={{ background: "var(--color-bg-light)", padding: "0.4rem 0.6rem", borderRadius: "8px", fontWeight: 800, fontSize: "0.75rem", color: "var(--color-primary)", border: "1px solid var(--color-border)" }}>
                                                    {apt.code}
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 600 }}>
                                                <Layers size={14} color="var(--color-text-muted)" />
                                                Tầng {apt.floorNumber}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                                <BedDouble size={16} color="var(--color-text-muted)" />
                                                <span style={{ fontWeight: 500 }}>{apt.bedroomCount} Phòng ngủ</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 700 }}>{apt.areaSqm} m²</div>
                                        </td>
                                        <td>
                                            <span className={`badge ${
                                                apt.status === 'AVAILABLE' ? 'badge--active' : 
                                                apt.status === 'OCCUPIED' ? 'badge--confirmed' : 
                                                apt.status === 'MAINTENANCE' ? 'badge--draft' : 'badge--inactive'
                                            }`}>
                                                {apt.status}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: "right", paddingRight: "1.5rem" }}>
                                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
                                                <button className="btn btn-ghost btn-icon" onClick={() => navigate(`/apartments/detail/${apt.id}`)} title="Xem chi tiết">
                                                    <Info size={18} />
                                                </button>
                                                <button className="btn btn-ghost btn-icon" style={{color: "var(--color-primary)"}} onClick={() => navigate(`/apartments/edit/${apt.id}`)} title="Quản lý">
                                                    <Maximize2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* PAGINATION - SERVER SIDE */}
                <div className="card-body" style={{ background: "#f8fafc", borderTop: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 1.5rem" }}>
                    <span style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
                        Dữ liệu trang <strong>{currentPage + 1}</strong> / {totalPages}
                    </span>
                    <div style={{ display: "flex", gap: "0.75rem" }}>
                        <button 
                            disabled={currentPage === 0 || loading} 
                            onClick={() => setCurrentPage(p => p - 1)} 
                            className="btn btn-ghost"
                            style={{ background: "white", border: "1px solid var(--color-border)" }}
                        >
                            <ChevronLeft size={18} /> Trang trước
                        </button>
                        <button 
                            disabled={currentPage >= totalPages - 1 || loading} 
                            onClick={() => setCurrentPage(p => p + 1)} 
                            className="btn btn-ghost"
                            style={{ background: "white", border: "1px solid var(--color-border)" }}
                        >
                            Trang sau <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
                .maintenance-detail-container { animation: fadeIn 0.3s ease-in-out; background-color: #f1f5f9; }
                .table-row-hover:hover { background-color: #f8fafc !important; }
                .animate-spin { animation: spin 1s linear infinite; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                
                .form-input { 
                    width: 100%; 
                    padding: 0.65rem 1rem; 
                    border: 1px solid var(--color-border); 
                    border-radius: 10px; 
                    outline: none;
                    font-size: 0.9rem;
                    transition: all 0.2s;
                    background: white;
                }
                .form-input:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }
            `}</style>
        </div>
    );
}