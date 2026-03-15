import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { 
  User, Mail, Phone, Shield, ArrowLeft, Save, Loader2 
} from "lucide-react";
import { 
  createUser, 
  updateUser, 
  fetchRoles, 
  getUserById 
} from "../../services/userApi"; 

export default function UserForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [roleOptions, setRoleOptions] = useState([]);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
    status: "ACTIVE",
    roleCode: "" 
  });

  // 1. Load dữ liệu khi vào trang
  useEffect(() => {
    const initData = async () => {
      setFetching(true);
      try {
        // Lấy danh sách Roles trước
        const rolesRes = await fetchRoles();
        if (rolesRes?.result) setRoleOptions(rolesRes.result);

        // Nếu là Edit, lấy thông tin User theo ID
        if (isEdit) {
          const response = await getUserById(id);
          
          // Kiểm tra cấu trúc ApiResponse { code, result: { ... }, message }
          const u = response?.result; 
          
          if (u) {
            setFormData({
              fullName: u.fullName || "",
              email: u.email || "",
              phone: u.phone || "",
              status: u.status || "ACTIVE",
              password: "", // Password luôn để trống khi load trang edit
              // Lấy roleCode đầu tiên trong mảng roles của User
              roleCode: u.roles && u.roles.length > 0 ? u.roles[0].roleCode : ""
            });
          }
        }
      } catch (err) {
        console.error("Lỗi khi tải dữ liệu form:", err);
      } finally {
        setFetching(false);
      }
    };
    initData();
  }, [id, isEdit]);

  // 2. Xử lý lưu dữ liệu
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.roleCode) {
      alert("Vui lòng chọn vai trò!");
      return;
    }

    setLoading(true);
    try {
      // Build payload theo chuẩn UserCreateRequest / UserUpdateRequest
      const payload = {
        id: id, // THÊM DÒNG NÀY: Gửi kèm ID vào trong body luôn cho chắc
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        status: formData.status,
        assignments: [
          {
            buildingId: null, // Basic: Luôn là null
            roleCodes: [formData.roleCode]
          }
        ]
      };

      // Chỉ gửi mật khẩu nếu là tạo mới HOẶC người dùng có nhập mật khẩu mới khi edit
      if (formData.password && formData.password.trim() !== "") {
        payload.password = formData.password;
      } else if (!isEdit) {
        // Nếu tạo mới mà không có pass thì báo lỗi (tùy backend)
        payload.password = formData.password; 
      }

      const res = isEdit ? await updateUser(id, payload) : await createUser(payload);

      if (res?.code === 200 || res) {
        alert(isEdit ? "Cập nhật thành công!" : "Thêm mới thành công!");
        navigate("/users");
      }
    } catch (err) {
      alert("Lỗi: " + (err.message || "Có lỗi xảy ra khi lưu"));
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return (
    <div style={{ display: "flex", justifyContent: "center", padding: "5rem" }}>
      <Loader2 className="spin" size={40} color="#3b82f6" />
    </div>
  );

  return (
    <div style={{ padding: "2rem", backgroundColor: "#f1f5f9", minHeight: "100vh" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        
        <button 
          onClick={() => navigate("/users")} 
          style={{ display: "flex", alignItems: "center", gap: "8px", border: "none", background: "none", cursor: "pointer", color: "#64748b", marginBottom: "1rem" }}
        >
          <ArrowLeft size={20} /> Quay lại
        </button>

        <h1 style={{ marginBottom: "2rem", fontSize: "1.5rem", fontWeight: "bold" }}>
          {isEdit ? "Chỉnh sửa thành viên" : "Thêm thành viên mới"}
        </h1>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1.5rem" }}>
          
          {/* Section 1: Thông tin cơ bản */}
          <div style={{ padding: "1.5rem", backgroundColor: "white", borderRadius: "8px", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
            <h3 style={{ marginTop: 0, marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "10px", fontSize: "1.1rem" }}>
              <User size={18} /> Thông tin tài khoản
            </h3>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div className="form-group">
                <label className="label">Họ và tên</label>
                <input 
                  className="input" required 
                  value={formData.fullName} 
                  onChange={e => setFormData({...formData, fullName: e.target.value})} 
                />
              </div>

              <div className="form-group">
                <label className="label">Số điện thoại</label>
                <input 
                  className="input" required 
                  value={formData.phone} 
                  onChange={e => setFormData({...formData, phone: e.target.value})} 
                />
              </div>

              <div className="form-group">
                <label className="label">Email</label>
                <input 
                  className="input" type="email" required 
                  disabled={isEdit} 
                  value={formData.email} 
                  onChange={e => setFormData({...formData, email: e.target.value})} 
                />
              </div>

              <div className="form-group">
                <label className="label">Mật khẩu {isEdit && "(Để trống nếu không đổi)"}</label>
                <input 
                  className="input" type="password" 
                  required={!isEdit} 
                  value={formData.password} 
                  onChange={e => setFormData({...formData, password: e.target.value})} 
                />
              </div>
            </div>
          </div>

          {/* Section 2: Quyền hạn */}
          <div style={{ padding: "1.5rem", backgroundColor: "white", borderRadius: "8px", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
            <h3 style={{ marginTop: 0, marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "10px", fontSize: "1.1rem" }}>
              <Shield size={18} /> Phân quyền
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div className="form-group">
                <label className="label">Vai trò chính</label>
                <select 
                  className="input" required
                  value={formData.roleCode}
                  onChange={e => setFormData({...formData, roleCode: e.target.value})}
                >
                  <option value="">-- Chọn một vai trò --</option>
                  {roleOptions.map(r => (
                    <option key={r.code} value={r.code}>{r.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="label">Trạng thái</label>
                <select 
                  className="input"
                  value={formData.status}
                  onChange={e => setFormData({...formData, status: e.target.value})}
                >
                  <option value="ACTIVE">Hoạt động</option>
                  <option value="INACTIVE">Khóa tài khoản</option>
                </select>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "1rem" }}>
            <button 
              type="button" 
              onClick={() => navigate("/users")}
              style={{ padding: "0.6rem 1.5rem", borderRadius: "6px", border: "1px solid #e2e8f0", background: "white", cursor: "pointer" }}
            >
              Hủy bỏ
            </button>
            <button 
              type="submit" 
              disabled={loading}
              style={{ 
                padding: "0.6rem 2rem", borderRadius: "6px", border: "none", 
                background: "#3b82f6", color: "white", fontWeight: "600", 
                cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" 
              }}
            >
              {loading ? <Loader2 className="spin" size={18} /> : <Save size={18} />}
              {isEdit ? "Cập nhật" : "Tạo thành viên"}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .form-group { display: flex; flex-direction: column; gap: 6px; }
        .label { font-size: 0.8rem; font-weight: 600; color: #64748b; }
        .input { padding: 0.6rem; border: 1px solid #e2e8f0; border-radius: 6px; outline: none; font-size: 0.9rem; }
        .input:focus { border-color: #3b82f6; }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}