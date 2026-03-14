import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Building2, ArrowLeft, Save, MapPin, 
  Layers, Info, AlertCircle, Loader2,
  ChevronLeft
} from "lucide-react";
import { createBuilding } from "../../services/buildingApi";

export default function AddBuilding() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    address: "",
    numFloors: 1,
    apartmentsPerFloor1br: 0,
    apartmentsPerFloor2br: 0,
    apartmentsPerFloor3br: 0,
    area1brSqm: 0,
    area2brSqm: 0,
    area3brSqm: 0
  });

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await createBuilding(formData);
      if (res.code === 200 || res.code === 201) {
        alert("Thêm tòa nhà thành công!");
        navigate("/buildings");
      } else {
        setError(res.message || "Có lỗi xảy ra khi tạo tòa nhà.");
      }
    } catch (err) {
      setError("Không thể kết nối đến máy chủ.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="maintenance-detail-container" style={{ padding: "1.5rem", width: "100%", maxWidth: "none", minHeight: "100vh", boxSizing: "border-box" }}>
      
      {/* 1. PAGE HEADER */}
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
              <h1 className="page-header__title">Thêm Tòa Nhà Mới</h1>
              <p className="page-header__subtitle">Khởi tạo thông số kỹ thuật và quy mô vận hành</p>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="card" style={{ marginBottom: "1.5rem", border: "1px solid var(--color-danger)", background: "#fef2f2" }}>
          <div className="card-body" style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "var(--color-danger)" }}>
            <AlertCircle size={20} />
            <span style={{ fontWeight: 600 }}>{error}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", alignItems: "start" }}>
          
          {/* CỘT TRÁI: THÔNG TIN CHUNG */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div className="card">
              <div className="card-body" style={{ background: "#f8fafc", borderBottom: "1px solid var(--color-border)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Info size={18} color="var(--color-primary)" />
                <h3 style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", color: "var(--color-primary)", margin: 0 }}>
                  Thông tin cơ bản
                </h3>
              </div>
              <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <div className="form-group">
                  <label className="form-label">Tên tòa nhà <span style={{color: 'red'}}>*</span></label>
                  <input 
                    required name="name" value={formData.name} onChange={handleChange}
                    placeholder="VD: Landmark 81, Vinhomes Central Park..."
                    className="form-input"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Mã định danh (Code) <span style={{color: 'red'}}>*</span></label>
                  <input 
                    required name="code" value={formData.code} onChange={handleChange}
                    placeholder="VD: LM81"
                    className="form-input" style={{ textTransform: "uppercase", fontWeight: "bold" }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Địa chỉ tòa nhà <span style={{color: 'red'}}>*</span></label>
                  <div style={{ position: "relative" }}>
                    <MapPin style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} size={16} />
                    <input 
                      required name="address" value={formData.address} onChange={handleChange}
                      placeholder="Nhập địa chỉ chi tiết..."
                      className="form-input" style={{ paddingLeft: "2.5rem" }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
                <div className="card-body" style={{ background: "#f8fafc", borderBottom: "1px solid var(--color-border)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Layers size={18} color="var(--color-primary)" />
                  <h3 style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", color: "var(--color-primary)", margin: 0 }}>
                    Cấu trúc tầng
                  </h3>
                </div>
                <div className="card-body">
                   <div className="form-group" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--color-bg-light)", padding: "1rem", borderRadius: "12px" }}>
                      <div>
                        <label className="form-label" style={{ marginBottom: "2px" }}>Tổng số tầng nổi</label>
                        <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", margin: 0 }}>Hệ thống sẽ dựa trên số tầng để sinh căn hộ</p>
                      </div>
                      <input 
                        type="number" min="1" name="numFloors" value={formData.numFloors} onChange={handleChange}
                        className="form-input" style={{ width: "100px", textAlign: "center", fontSize: "1.1rem", fontWeight: "bold", color: "var(--color-primary)" }}
                      />
                   </div>
                </div>
            </div>
          </div>

          {/* CỘT PHẢI: CHI TIẾT CĂN HỘ */}
          <div className="card">
            <div className="card-body" style={{ background: "#f8fafc", borderBottom: "1px solid var(--color-border)" }}>
              <h3 style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", color: "var(--color-primary)", margin: 0 }}>
                Thiết lập căn hộ theo tầng
              </h3>
            </div>
            <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              
              {[
                { label: "Loại 1 Phòng Ngủ (1BR)", key: "apartmentsPerFloor1br", area: "area1brSqm", color: "var(--color-primary)" },
                { label: "Loại 2 Phòng Ngủ (2BR)", key: "apartmentsPerFloor2br", area: "area2brSqm", color: "#8b5cf6" },
                { label: "Loại 3 Phòng Ngủ (3BR)", key: "apartmentsPerFloor3br", area: "area3brSqm", color: "#10b981" },
              ].map((item) => (
                <div key={item.key} style={{ padding: "1.25rem", borderRadius: "16px", border: "1px solid var(--color-border)", background: "white" }}>
                  <div style={{ fontWeight: 800, color: item.color, fontSize: "0.85rem", marginBottom: "1rem", borderBottom: `2px solid ${item.color}20`, paddingBottom: "0.5rem" }}>
                    {item.label}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: "0.7rem" }}>Số căn / Tầng</label>
                      <input 
                        type="number" name={item.key} value={formData[item.key]} onChange={handleChange}
                        className="form-input" placeholder="0"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: "0.7rem" }}>Diện tích (m²)</label>
                      <input 
                        type="number" step="0.1" name={item.area} value={formData[item.area]} onChange={handleChange}
                        className="form-input" placeholder="0.0"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <div style={{ marginTop: "1rem", padding: "1rem", background: "#fffbeb", borderRadius: "12px", border: "1px solid #fde68a", display: "flex", gap: "0.75rem" }}>
                <AlertCircle size={20} color="#d97706" />
                <p style={{ fontSize: "0.8rem", color: "#92400e", margin: 0, lineHeight: "1.5" }}>
                  <strong>Lưu ý:</strong> Sau khi lưu, hệ thống sẽ sử dụng các thông số này để tự động tạo danh sách căn hộ cho từng tầng. Hãy kiểm tra kỹ diện tích trước khi xác nhận.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="card" style={{ marginTop: "1rem" }}>
          <div className="card-body" style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", background: "#f8fafc" }}>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn btn-ghost"
              style={{ minWidth: "150px", fontWeight: 600 }}
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ minWidth: "200px", padding: "0.75rem 2rem", fontSize: "1rem" }}
            >
              {loading ? (
                <><Loader2 size={20} className="animate-spin" style={{marginRight: "8px"}} /> Đang lưu...</>
              ) : (
                <><Save size={20} style={{marginRight: "8px"}} /> Lưu tòa nhà</>
              )}
            </button>
          </div>
        </div>
      </form>

      <style>{`
        .maintenance-detail-container { animation: fadeIn 0.3s ease-in-out; background-color: #f1f5f9; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
        
        .form-group { margin-bottom: 0; }
        .form-label { display: block; margin-bottom: 0.5rem; font-weight: 700; color: var(--color-text); font-size: 0.85rem; }
      `}</style>
    </div>
  );
}