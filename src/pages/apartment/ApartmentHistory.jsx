import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
    ChevronLeft, Calendar, User, Search, 
    ArrowUpDown, Filter, Loader2, Clock 
} from "lucide-react";
import { getResidencyHistoryPaged } from "../../services/apartmentApi";

export default function ApartmentHistory() {
    const { id } = useParams();
    const navigate = useNavigate();
    
    // State quản lý dữ liệu và phân trang
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totalPages, setTotalPages] = useState(0);
    const [currentPage, setCurrentPage] = useState(0);
    
    // State quản lý Filter & Sort
    const [filterType, setFilterType] = useState("");
    const [sortConfig, setSortConfig] = useState("assignedAt,desc");

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const params = {
                page: currentPage,
                size: 10,
                sort: sortConfig,
                type: filterType || null
            };
            const res = await getResidencyHistoryPaged(id, params);
            // res.result.content chứa danh sách history
            setData(res.result.content);
            setTotalPages(res.result.totalPages);
        } catch (err) {
            console.error("Lỗi khi lấy lịch sử cư trú:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { 
        fetchHistory(); 
    }, [id, currentPage, filterType, sortConfig]);

    const handleSort = (field) => {
        const order = sortConfig.includes("asc") ? "desc" : "asc";
        setSortConfig(`${field},${order}`);
    };

    // Hàm format ngày tháng để code sạch hơn
    const formatDate = (dateString) => {
        if (!dateString) return "—";
        return new Date(dateString).toLocaleDateString("vi-VN");
    };

    return (
        <div style={{ padding: "1.5rem", backgroundColor: "#f1f5f9", minHeight: "100vh" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
                <button 
                    className="btn btn-ghost" 
                    onClick={() => navigate(-1)} 
                    style={{ background: "white", display: "flex", alignItems: "center", gap: "5px", padding: "8px 15px", borderRadius: "8px", border: "1px solid #e2e8f0" }}
                >
                    <ChevronLeft size={20} /> Quay lại
                </button>
                <h1 style={{ fontSize: "1.5rem", fontWeight: 800 }}>Lịch sử cư trú căn hộ</h1>
            </div>

            {/* Toolbar: Filter & Sort */}
            <div className="card shadow-sm" style={{ marginBottom: "1.5rem", padding: "1rem", backgroundColor: "white", borderRadius: "12px" }}>
                <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Filter size={18} color="#64748b" />
                        <select 
                            className="form-input" 
                            style={{ width: "200px", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                            value={filterType}
                            onChange={(e) => {setFilterType(e.target.value); setCurrentPage(0);}}
                        >
                            <option value="">Tất cả loại cư dân</option>
                            <option value="OWNER">Chủ sở hữu</option>
                            <option value="TENANT">Người thuê</option>
                            <option value="FAMILY">Thành viên</option>
                        </select>
                    </div>
                    
                    <div style={{ flex: 1 }}></div>

                    <div style={{ fontSize: "0.85rem", color: "#64748b" }}>
                        Sắp xếp theo: 
                        <button 
                            onClick={() => handleSort("assignedAt")} 
                            style={{ marginLeft: "8px", border: "none", background: "none", cursor: "pointer", fontWeight: 700, color: "#2563eb", display: "inline-flex", alignItems: "center", gap: "4px" }}
                        >
                            Ngày vào <ArrowUpDown size={14} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content Table */}
            <div className="card shadow-sm" style={{ backgroundColor: "white", borderRadius: "12px", overflow: "hidden" }}>
                <div className="card-body p-0">
                    <table className="data-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                            <tr>
                                <th style={{ padding: "12px", textAlign: "left" }}>Cư dân</th>
                                <th style={{ padding: "12px", textAlign: "left" }}>Loại</th>
                                <th style={{ padding: "12px", textAlign: "left" }}><Clock size={14} style={{ verticalAlign: "middle", marginRight: "4px" }}/> Ngày chuyển vào</th>
                                <th style={{ padding: "12px", textAlign: "left" }}><LogOut size={14} style={{ verticalAlign: "middle", marginRight: "4px" }}/> Ngày chuyển đi</th>
                                <th style={{ padding: "12px", textAlign: "left" }}>Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: "center", padding: "3rem" }}>
                                        <Loader2 className="animate-spin" style={{ margin: "0 auto" }} />
                                    </td>
                                </tr>
                            ) : data.length > 0 ? (
                                data.map(item => {
                                    // LOGIC QUAN TRỌNG: Nếu không có ngày rời đi HOẶC isCurrent là true thì tính là đang ở
                                    const isLivingHere = !item.movedOutAt || item.isCurrent;
                                    
                                    return (
                                        <tr key={item.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                            <td style={{ padding: "12px" }}>
                                                <div style={{ fontWeight: 700 }}>{item.fullName}</div>
                                                <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{item.email}</div>
                                            </td>
                                            <td style={{ padding: "12px" }}>{item.residentType}</td>
                                            <td style={{ padding: "12px" }}>{formatDate(item.assignedAt)}</td>
                                            <td style={{ padding: "12px" }}>
                                                {/* Nếu đang ở thì hiện dấu —, nếu đã đi thì hiện ngày */}
                                                {isLivingHere ? "—" : formatDate(item.movedOutAt)}
                                            </td>
                                            <td style={{ padding: "12px" }}>
                                                <span 
                                                    className={`badge ${isLivingHere ? "badge--active" : ""}`} 
                                                    style={{
                                                        padding: "4px 10px",
                                                        borderRadius: "99px",
                                                        fontSize: "0.75rem",
                                                        fontWeight: 600,
                                                        backgroundColor: isLivingHere ? "#dcfce7" : "#e2e8f0",
                                                        color: isLivingHere ? "#166534" : "#64748b"
                                                    }}
                                                >
                                                    {isLivingHere ? "Đang ở" : "Đã chuyển ra"}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>
                                        Không tìm thấy dữ liệu lịch sử cư trú cho căn hộ này.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="card-footer" style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "0.5rem", padding: "1rem", borderTop: "1px solid #e2e8f0" }}>
                        <button 
                            disabled={currentPage === 0} 
                            onClick={() => setCurrentPage(p => p - 1)}
                            className="btn btn-ghost btn-sm"
                            style={{ padding: "5px 10px", cursor: currentPage === 0 ? "not-allowed" : "pointer" }}
                        >Trước</button>
                        
                        {[...Array(totalPages)].map((_, i) => (
                            <button 
                                key={i} 
                                onClick={() => setCurrentPage(i)}
                                className={`btn btn-sm ${currentPage === i ? "btn-primary" : "btn-ghost"}`}
                                style={{
                                    width: "32px",
                                    height: "32px",
                                    borderRadius: "6px",
                                    border: "none",
                                    backgroundColor: currentPage === i ? "#2563eb" : "transparent",
                                    color: currentPage === i ? "white" : "#64748b",
                                    cursor: "pointer"
                                }}
                            >{i + 1}</button>
                        ))}

                        <button 
                            disabled={currentPage === totalPages - 1} 
                            onClick={() => setCurrentPage(p => p + 1)}
                            className="btn btn-ghost btn-sm"
                            style={{ padding: "5px 10px", cursor: currentPage === totalPages - 1 ? "not-allowed" : "pointer" }}
                        >Sau</button>
                    </div>
                )}
            </div>
        </div>
    );
}

const LogOut = ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
);