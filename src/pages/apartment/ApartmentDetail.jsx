import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
    ChevronLeft, Home, User, Layers, Square, 
    CheckCircle2, AlertCircle, Info, Users, 
    Calendar, Loader2, Plus, ArrowRight, MapPin, BedDouble
} from "lucide-react";
import { getApartmentById } from "../../services/apartmentApi";

export default function ApartmentDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [apartment, setApartment] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetail = async () => {
            setLoading(true);
            try {
                const res = await getApartmentById(id);
                // Giả định res.result chứa dữ liệu như JSON bạn gửi
                setApartment(res.result);
            } catch (err) {
                console.error("Lỗi lấy chi tiết căn hộ:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchDetail();
    }, [id]);

    if (loading) return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
            <Loader2 className="animate-spin" size={40} color="var(--color-primary)" />
            <p style={{ marginTop: "1rem", color: "var(--color-text-muted)" }}>Đang tải thông tin căn hộ...</p>
        </div>
    );

    if (!apartment) return (
        <div style={{ padding: "5rem", textAlign: "center" }}>
            <AlertCircle size={48} color="var(--color-danger)" style={{ margin: "0 auto 1rem" }} />
            <h2 style={{ fontWeight: 700 }}>Không tìm thấy căn hộ!</h2>
            <button className="btn btn-ghost" onClick={() => navigate(-1)} style={{ marginTop: "1rem" }}>Quay lại</button>
        </div>
    );

    return (
        <div className="maintenance-detail-container" style={{ padding: "1.5rem", width: "100%", maxWidth: "none", minHeight: "100vh", boxSizing: "border-box" }}>
            
            {/* 1. HEADER SECTION */}
            <div className="page-header" style={{ marginBottom: "2rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                        <button 
                            className="btn btn-ghost btn-icon" 
                            onClick={() => navigate(-1)} 
                            style={{ color: "white", borderColor: "rgba(255,255,255,0.3)" }}
                        >
                            <ChevronLeft size={24} />
                        </button>
                        <div>
                            <h1 className="page-header__title">Căn hộ {apartment.code}</h1>
                            <p className="page-header__subtitle">
                                <MapPin size={14} style={{ display: "inline", marginRight: "4px" }} />
                                {apartment.buildingName} • Tầng {apartment.floorNumber}
                            </p>
                        </div>
                    </div>
                    <div style={{ display: "flex", gap: "0.75rem" }}>
                         <button className="btn btn-ghost" style={{ background: "white", color: "var(--color-text)" }} onClick={() => window.print()}>
                            In thông tin
                        </button>
                        <button className="btn btn-primary" onClick={() => navigate('/assign-resident', { state: { apartmentId: apartment.id } })}>
                            <Plus size={18} /> Giao cư dân
                        </button>
                    </div>
                </div>
            </div>

            {/* 2. MAIN CONTENT GRID */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "1.5rem", alignItems: "start" }}>
                
                {/* CỘT TRÁI: DANH SÁCH CƯ DÂN */}
                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                    <div className="card">
                        <div className="card-body" style={{ background: "#f8fafc", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <Users size={18} color="var(--color-primary)" />
                                <h3 style={{ fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", color: "var(--color-primary)", margin: 0 }}>
                                    Cư dân đang cư trú
                                </h3>
                            </div>
                            <span className="badge badge--active">{apartment.residents?.length || 0} Người</span>
                        </div>
                        <div className="card-body p-0">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th style={{ paddingLeft: "1.5rem" }}>Thông tin cư dân</th>
                                        <th>Vai trò</th>
                                        <th>Ngày bắt đầu</th>
                                        <th style={{ textAlign: "right", paddingRight: "1.5rem" }}>Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {apartment.residents && apartment.residents.length > 0 ? (
                                        apartment.residents.map((res, idx) => (
                                            <tr key={idx} className="table-row-hover">
                                                <td style={{ paddingLeft: "1.5rem" }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                                        <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "var(--color-bg-light)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--color-border)" }}>
                                                            <User size={18} color="var(--color-primary)" />
                                                        </div>
                                                        <div>
                                                            <div style={{ fontWeight: 700 }}>{res.fullName}</div>
                                                            <div style={{ fontSize: "0.7rem", color: "var(--color-text-muted)" }}>ID: {res.userId?.substring(0,8)}...</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className={`badge ${res.residentType === 'OWNER' ? 'badge--active' : 'badge--confirmed'}`}>
                                                        {res.residentType === 'OWNER' ? 'Chủ sở hữu' : 'Người thuê'}
                                                    </span>
                                                </td>
                                                <td style={{ fontSize: "0.9rem" }}>{new Date(res.assignedAt).toLocaleDateString('vi-VN')}</td>
                                                <td style={{ textAlign: "right", paddingRight: "1.5rem" }}>
                                                    <button className="btn btn-ghost" style={{ color: "var(--color-danger)", fontWeight: 600 }}>Rời đi</button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="4" style={{ textAlign: "center", padding: "4rem" }}>
                                                <div style={{ color: "var(--color-text-muted)", marginBottom: "1rem" }}>Căn hộ này chưa có cư dân đăng ký.</div>
                                                <button className="btn btn-ghost btn-sm" onClick={() => navigate('/assign-resident')}>Giao ngay</button>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* CỘT PHẢI: THÔNG SỐ CĂN HỘ */}
                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                    <div className="card">
                        <div className="card-body" style={{ background: "#f8fafc", borderBottom: "1px solid var(--color-border)" }}>
                            <h3 style={{ fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", color: "var(--color-primary)", margin: 0 }}>
                                Thông tin cấu trúc
                            </h3>
                        </div>
                        <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                            
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                    <div style={{ color: "var(--color-text-muted)" }}><Square size={18} /></div>
                                    <span style={{ fontSize: "0.9rem", fontWeight: 500 }}>Diện tích</span>
                                </div>
                                <span style={{ fontWeight: 800, fontSize: "1.1rem" }}>{apartment.areaSqm} m²</span>
                            </div>

                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                    <div style={{ color: "var(--color-text-muted)" }}><BedDouble size={18} /></div>
                                    <span style={{ fontSize: "0.9rem", fontWeight: 500 }}>Phòng ngủ</span>
                                </div>
                                <span style={{ fontWeight: 800, fontSize: "1.1rem" }}>{apartment.bedroomCount} PN</span>
                            </div>

                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                    <div style={{ color: "var(--color-text-muted)" }}><Layers size={18} /></div>
                                    <span style={{ fontSize: "0.9rem", fontWeight: 500 }}>Vị trí</span>
                                </div>
                                <span style={{ fontWeight: 800, fontSize: "1.1rem" }}>Tầng {apartment.floorNumber}</span>
                            </div>

                            <div style={{ marginTop: "0.5rem", padding: "1.25rem", borderRadius: "12px", background: apartment.status === 'AVAILABLE' ? "#f0fdf4" : "#fff7ed", border: `1px solid ${apartment.status === 'AVAILABLE' ? '#bbf7d0' : '#ffedd5'}`, textAlign: "center" }}>
                                <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", color: apartment.status === 'AVAILABLE' ? "#166534" : "#9a3412", marginBottom: "4px" }}>
                                    Trạng thái căn hộ
                                </label>
                                <div style={{ fontWeight: 900, fontSize: "1.2rem", color: apartment.status === 'AVAILABLE' ? "#15803d" : "#c2410c" }}>
                                    {apartment.status}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card" style={{ background: "linear-gradient(135deg, var(--color-primary) 0%, #1e40af 100%)", border: "none" }}>
                        <div className="card-body" style={{ color: "white" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "0.5rem" }}>
                                <Info size={16} />
                                <span style={{ fontWeight: 700, fontSize: "0.8rem", textTransform: "uppercase" }}>Ghi chú</span>
                            </div>
                            <p style={{ fontSize: "0.85rem", opacity: 0.9, lineHeight: "1.5", margin: 0 }}>
                                Đây là dữ liệu căn hộ thuộc tòa nhà <strong>{apartment.buildingName}</strong>. Mọi thay đổi về cấu trúc tầng cần được thực hiện tại mục Quản lý Tòa nhà.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .maintenance-detail-container { animation: fadeIn 0.3s ease-in-out; background-color: #f1f5f9; }
                .table-row-hover:hover { background-color: #f8fafc !important; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .animate-spin { animation: spin 1s linear infinite; }
            `}</style>
        </div>
    );
}