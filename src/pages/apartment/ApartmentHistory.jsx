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
            setData(res.result.content);
            setTotalPages(res.result.totalPages);
        } catch (err) {
            console.error("Lỗi:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchHistory(); }, [id, currentPage, filterType, sortConfig]);

    const handleSort = (field) => {
        const order = sortConfig.includes("asc") ? "desc" : "asc";
        setSortConfig(`${field},${order}`);
    };

    return (
        <div style={{ padding: "1.5rem", backgroundColor: "#f1f5f9", minHeight: "100vh" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
                <button className="btn btn-ghost" onClick={() => navigate(-1)} style={{ background: "white" }}>
                    <ChevronLeft size={20} /> Quay lại
                </button>
                <h1 style={{ fontSize: "1.5rem", fontWeight: 800 }}>Lịch sử cư trú</h1>
            </div>

            {/* Toolbar: Filter & Sort */}
            <div className="card shadow-sm" style={{ marginBottom: "1.5rem", padding: "1rem" }}>
                <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Filter size={18} color="#64748b" />
                        <select 
                            className="form-input" 
                            style={{ width: "200px" }}
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
                        <button onClick={() => handleSort("assignedAt")} style={{ marginLeft: "8px", border: "none", background: "none", cursor: "pointer", fontWeight: 700, color: "var(--color-primary)" }}>
                            Ngày vào <ArrowUpDown size={14} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content Table */}
            <div className="card shadow-sm">
                <div className="card-body p-0">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Cư dân</th>
                                <th>Loại</th>
                                <th><Clock size={14}/> Ngày chuyển vào</th>
                                <th><LogOut size={14}/> Ngày chuyển đi</th>
                                <th>Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="5" style={{ textAlign: "center", padding: "3rem" }}><Loader2 className="animate-spin" /></td></tr>
                            ) : data.length > 0 ? (
                                data.map(item => (
                                    <tr key={item.id}>
                                        <td>
                                            <div style={{ fontWeight: 700 }}>{item.fullName}</div>
                                            <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{item.email}</div>
                                        </td>
                                        <td>{item.residentType}</td>
                                        <td>{new Date(item.assignedAt).toLocaleDateString("vi-VN")}</td>
                                        <td>{item.isCurrent ? "—" : new Date(item.movedOutAt).toLocaleDateString("vi-VN")}</td>
                                        <td>
                                            <span className={`badge ${item.isCurrent ? "badge--active" : ""}`} style={!item.isCurrent ? {background: "#e2e8f0", color: "#64748b"} : {}}>
                                                {item.isCurrent ? "Đang ở" : "Đã dời đi"}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="5" style={{ textAlign: "center", padding: "3rem" }}>Không tìm thấy dữ liệu lịch sử.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                <div className="card-footer" style={{ display: "flex", justifyContent: "center", gap: "0.5rem", padding: "1rem" }}>
                    <button 
                        disabled={currentPage === 0} 
                        onClick={() => setCurrentPage(p => p - 1)}
                        className="btn btn-ghost btn-sm"
                    >Trước</button>
                    
                    {[...Array(totalPages)].map((_, i) => (
                        <button 
                            key={i} 
                            onClick={() => setCurrentPage(i)}
                            className={`btn btn-sm ${currentPage === i ? "btn-primary" : "btn-ghost"}`}
                        >{i + 1}</button>
                    ))}

                    <button 
                        disabled={currentPage === totalPages - 1} 
                        onClick={() => setCurrentPage(p => p + 1)}
                        className="btn btn-ghost btn-sm"
                    >Sau</button>
                </div>
            </div>
        </div>
    );
}

// Icon LogOut bổ sung
const LogOut = ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
);