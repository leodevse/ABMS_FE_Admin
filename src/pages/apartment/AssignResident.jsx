import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
    ChevronLeft, Search, User, Save, 
    AlertCircle, Loader2, X, Info, UserCheck, 
    FileText, Key
} from "lucide-react";
import { searchUsers, assignResident } from "../../services/userApi";

export default function AssignResident() {
    const navigate = useNavigate();
    const location = useLocation();
    
    // Lấy thông tin căn hộ truyền từ trang Detail sang (location.state)
    const { apartmentId, apartmentCode } = location.state || {};

    // UI States
    const [loading, setLoading] = useState(false);
    const [searching, setSearching] = useState(false);
    const [error, setError] = useState("");
    
    // Search States
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);

    // Form State (Khớp với ApartmentResidentRequest backend)
    const [formData, setFormData] = useState({
        userId: "",
        apartmentId: apartmentId || "",
        residentType: "TENANT", // Mặc định là người thuê
        idCardNumber: "",
        contractDetails: "",
        ownershipCertificate: "",
        legalDocs: "",
        note: ""
    });

    // 1. Xử lý tìm kiếm User từ Backend
    const handleSearchUser = async () => {
        if (!searchQuery.trim()) return;
        
        setSearching(true);
        setError("");
        setSearchResults([]);

        try {
            console.log("Đang gọi API search với query:", searchQuery);
            const res = await searchUsers(searchQuery);
            
            // Postman của bạn trả về { result: [...] }
            if (res && res.result) {
                setSearchResults(res.result);
                if (res.result.length === 0) {
                    setError(`Không tìm thấy người dùng nào khớp với "${searchQuery}"`);
                }
            } else {
                setError("Dữ liệu phản hồi từ máy chủ không hợp lệ.");
            }
        } catch (err) {
            console.error("Lỗi search:", err);
            setError("Lỗi kết nối máy chủ hoặc bạn không có quyền thực hiện thao tác này.");
        } finally {
            setSearching(false);
        }
    };

    // 2. Chọn User từ danh sách kết quả
    const handleSelectUser = (user) => {
        setSelectedUser(user);
        setFormData(prev => ({ ...prev, userId: user.id }));
        setSearchResults([]); // Ẩn danh sách tìm kiếm
        setSearchQuery("");   // Xóa ô nhập
        setError("");
    };

    // 3. Xử lý Submit Form
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.userId) {
            setError("Vui lòng tìm và chọn một cư dân trước khi lưu.");
            return;
        }

        setLoading(true);
        try {
            // Gửi dữ liệu về POST /api/apartments/assign-resident
            await assignResident(formData);
            alert("Giao căn hộ thành công!");
            navigate(-1); // Quay lại trang chi tiết căn hộ
        } catch (err) {
            console.error("Lỗi submit:", err);
            setError(err.message || "Có lỗi xảy ra khi gán cư dân.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="maintenance-detail-container" style={{ padding: "1.5rem", width: "100%", maxWidth: "none", minHeight: "100vh", boxSizing: "border-box" }}>
            
            {/* 1. HEADER */}
            <div className="page-header" style={{ marginBottom: "2rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <button 
                        className="btn btn-ghost btn-icon" 
                        onClick={() => navigate(-1)} 
                        style={{ color: "white", borderColor: "rgba(255,255,255,0.3)" }}
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <h1 className="page-header__title">Giao Cư Dân Vào Căn Hộ</h1>
                        <p className="page-header__subtitle">
                            {apartmentCode ? `Căn hộ: ${apartmentCode}` : "Vui lòng chọn căn hộ từ danh sách"}
                        </p>
                    </div>
                </div>
            </div>

            {/* ERROR DISPLAY */}
            {error && (
                <div className="card" style={{ marginBottom: "1.5rem", background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", padding: "1rem" }}>
                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                        <AlertCircle size={20} /> 
                        <span style={{ fontWeight: 600 }}>{error}</span>
                    </div>
                </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", alignItems: "start" }}>
                
                {/* CỘT TRÁI: TÌM KIẾM VÀ CHỌN USER */}
                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                    <div className="card shadow-sm">
                        <div className="card-body" style={{ background: "#f8fafc", borderBottom: "1px solid var(--color-border)", display: "flex", alignItems: "center", gap: "8px" }}>
                            <Search size={18} color="var(--color-primary)" />
                            <h3 style={{ fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", color: "var(--color-primary)", margin: 0 }}>
                                Bước 1: Tìm kiếm tài khoản cư dân
                            </h3>
                        </div>
                        <div className="card-body">
                            <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", marginBottom: "1rem" }}>
                                Nhập Email hoặc Tên để tìm kiếm tài khoản cư dân trong hệ thống.
                            </p>
                            
                            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
                                <div style={{ position: "relative", flex: 1 }}>
                                    <Search style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} size={16} />
                                    <input 
                                        className="form-input" 
                                        style={{ paddingLeft: "2.5rem" }}
                                        placeholder="Ví dụ: manager1@gmail.com..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearchUser()}
                                    />
                                </div>
                                <button className="btn btn-primary" onClick={handleSearchUser} disabled={searching}>
                                    {searching ? <Loader2 className="animate-spin" size={18} /> : "Tìm kiếm"}
                                </button>
                            </div>

                            {/* Kết quả tìm kiếm */}
                            {searchResults.length > 0 && (
                                <div style={{ border: "1px solid var(--color-border)", borderRadius: "12px", overflow: "hidden", background: "white" }}>
                                    <div style={{ background: "#f1f5f9", padding: "0.5rem 1rem", fontSize: "0.7rem", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase" }}>
                                        Kết quả ({searchResults.length})
                                    </div>
                                    {searchResults.map(user => (
                                        <div key={user.id} style={{ padding: "1rem", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <div>
                                                <div style={{ fontWeight: 700 }}>{user.fullName}</div>
                                                <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>{user.email}</div>
                                            </div>
                                            <button className="btn btn-ghost" style={{ color: "var(--color-primary)", fontWeight: 700 }} onClick={() => handleSelectUser(user)}>
                                                Chọn người này
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Thông tin User đã chọn */}
                            {selectedUser && (
                                <div style={{ marginTop: "1rem", padding: "1.25rem", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                        <div style={{ background: "#15803d", color: "white", width: "40px", height: "40px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                            <UserCheck size={24} />
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 800, color: "#166534", fontSize: "1rem" }}>{selectedUser.fullName}</div>
                                            <div style={{ fontSize: "0.8rem", color: "#15803d" }}>Email: {selectedUser.email}</div>
                                        </div>
                                    </div>
                                    <button onClick={() => {setSelectedUser(null); setFormData({...formData, userId: ""})}} style={{ color: "#dc2626", background: "none", border: "none", cursor: "pointer" }}>
                                        <X size={20} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="card shadow-sm" style={{ background: "var(--color-bg-light)" }}>
                        <div className="card-body" style={{ display: "flex", gap: "12px" }}>
                            <Info size={24} color="var(--color-primary)" />
                            <div style={{ fontSize: "0.85rem", lineHeight: "1.6", color: "var(--color-text)" }}>
                                <strong>Lưu ý:</strong> Một căn hộ có thể có nhiều cư dân (Family, Tenant), nhưng thông thường chỉ nên có 01 cư dân đóng vai trò <strong>OWNER</strong> (Chủ sở hữu).
                            </div>
                        </div>
                    </div>
                </div>

                {/* CỘT PHẢI: FORM ĐIỀN THÔNG TIN CƯ TRÚ */}
                <form onSubmit={handleSubmit} className="card shadow-sm">
                    <div className="card-body" style={{ background: "#f8fafc", borderBottom: "1px solid var(--color-border)", display: "flex", alignItems: "center", gap: "8px" }}>
                        <FileText size={18} color="var(--color-primary)" />
                        <h3 style={{ fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", color: "var(--color-primary)", margin: 0 }}>
                            Bước 2: Chi tiết cư trú & Hợp đồng
                        </h3>
                    </div>
                    <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                        
                        <div className="form-group">
                            <label className="form-label">Loại cư dân (Resident Type) <span style={{color: 'red'}}>*</span></label>
                            <select 
                                className="form-input" 
                                value={formData.residentType}
                                onChange={(e) => setFormData({...formData, residentType: e.target.value})}
                                required
                            >
                                <option value="OWNER">Chủ sở hữu (Owner)</option>
                                <option value="TENANT">Người thuê (Tenant)</option>
                                <option value="FAMILY">Thành viên gia đình</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Số CCCD / CMND / Passport</label>
                            <input 
                                className="form-input" 
                                value={formData.idCardNumber}
                                onChange={(e) => setFormData({...formData, idCardNumber: e.target.value})}
                                placeholder="Nhập số giấy tờ tùy thân..."
                            />
                        </div>

                        {formData.residentType === 'OWNER' ? (
                            <div className="form-group" style={{ padding: "1rem", background: "#f5f3ff", borderRadius: "12px", border: "1px solid #ddd6fe" }}>
                                <label className="form-label" style={{ color: "#5b21b6", display: "flex", alignItems: "center", gap: "6px" }}>
                                    <Shield size={14} /> Giấy chứng nhận quyền sở hữu
                                </label>
                                <input 
                                    className="form-input" 
                                    style={{ borderColor: "#c4b5fd" }}
                                    value={formData.ownershipCertificate}
                                    onChange={(e) => setFormData({...formData, ownershipCertificate: e.target.value})}
                                    placeholder="Mã số sổ hồng / Hợp đồng mua bán..."
                                />
                            </div>
                        ) : (
                            <div className="form-group" style={{ padding: "1rem", background: "#f0f9ff", borderRadius: "12px", border: "1px solid #bae6fd" }}>
                                <label className="form-label" style={{ color: "#075985", display: "flex", alignItems: "center", gap: "6px" }}>
                                    <Key size={14} /> Thông tin hợp đồng thuê
                                </label>
                                <textarea 
                                    className="form-input" 
                                    style={{ borderColor: "#7dd3fc" }}
                                    rows="3"
                                    value={formData.contractDetails}
                                    onChange={(e) => setFormData({...formData, contractDetails: e.target.value})}
                                    placeholder="Ngày bắt đầu - kết thúc, giá thuê, điều khoản chính..."
                                />
                            </div>
                        )}

                        <div className="form-group">
                            <label className="form-label">Ghi chú nội bộ</label>
                            <textarea 
                                className="form-input" 
                                rows="3"
                                value={formData.note}
                                onChange={(e) => setFormData({...formData, note: e.target.value})}
                                placeholder="Các thông tin lưu ý khác cho Ban quản lý..."
                            />
                        </div>

                        <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--color-border)" }}>
                            <button 
                                type="submit" 
                                className="btn btn-primary" 
                                style={{ width: "100%", padding: "1rem", fontSize: "1rem", fontWeight: "bold" }} 
                                disabled={loading || !selectedUser}
                            >
                                {loading ? (
                                    <Loader2 className="animate-spin" />
                                ) : (
                                    <><Save size={20} style={{marginRight: "10px"}}/> LƯU THÔNG TIN CƯ DÂN</>
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            <style>{`
                .maintenance-detail-container { animation: fadeIn 0.3s ease-in-out; background-color: #f1f5f9; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .animate-spin { animation: spin 1s linear infinite; }
                
                .form-group { margin-bottom: 0.25rem; }
                .form-label { display: block; margin-bottom: 0.5rem; font-weight: 700; font-size: 0.85rem; color: var(--color-text); }
                .form-input { 
                    width: 100%; padding: 0.75rem 1rem; border: 1px solid var(--color-border); 
                    border-radius: 10px; outline: none; transition: all 0.2s; background: white; box-sizing: border-box;
                }
                .form-input:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }
            `}</style>
        </div>
    );
}