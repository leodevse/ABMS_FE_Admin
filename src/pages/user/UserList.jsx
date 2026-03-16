import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, Plus, Trash2, Edit, Filter, ChevronLeft, ChevronRight,
  CheckCircle2, AlertCircle, Eye, X, Loader2, Mail, Phone, Shield, UserCheck,
} from "lucide-react";
import { fetchUsers, deactivateUser } from "../../services/userApi"; 
import toast from "react-hot-toast";

export default function UserList() {
  const navigate = useNavigate();

  // 1. State Management
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // FIX: Chuyển lên trang 1 để tránh lỗi -1 ở Backend
  const [currentPage, setCurrentPage] = useState(1); 
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);

  const [searchInput, setSearchInput] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const loadUsers = useCallback(async () => {
  setLoading(true);
  try {
    // 1. Khởi tạo params khớp với @RequestParam của Backend
    const params = {
      page: currentPage, // Backend mặc định là 1, nên khởi tạo state currentPage = 1 là đúng
      size: pageSize,
    };

    // 2. Đổi 'query' thành 'keyword' cho đúng với @RequestParam(required = false) String keyword
    if (activeSearch && activeSearch.trim() !== "") {
      params.keyword = activeSearch.trim(); 
    }

    // 3. Status giữ nguyên
    if (statusFilter && statusFilter !== "") {
      params.status = statusFilter;
    }

    console.log("Gọi API với params:", params);
    const data = await fetchUsers(params);

    if (data && data.code === 200 && data.result) {
      setUsers(data.result.content || []);
      setTotalPages(data.result.totalPages || 0);
    }
  } catch (error) {
    console.error("Lỗi khi tải danh sách:", error);
    setUsers([]);
  } finally {
    setLoading(false);
  }
}, [currentPage, pageSize, activeSearch, statusFilter]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // 3. Event Handlers
  const handleSearchTrigger = () => {
    setCurrentPage(1); // Reset về trang 1
    setActiveSearch(searchInput);
  };

  const handleFilterChange = (e) => {
    setCurrentPage(1); // Reset về trang 1
    setStatusFilter(e.target.value);
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Vô hiệu hóa tài khoản của "${name}"?`)) {
      try {
        const res = await deactivateUser(id);
        if (res?.code === 200 || res) {
          toast.success("Thao tác thành công!");
          loadUsers();
        }
      } catch (error) {
        toast.error("Lỗi: " + (error.message || "Không thể thực hiện"));
      }
    }
  };

  return (
    <div className="maintenance-detail-container" style={{ padding: "1.5rem", width: "100%", minHeight: "100vh", backgroundColor: "#f1f5f9" }}>
      {/* HEADER */}
      <div className="page-header" style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ background: "rgba(255,255,255,0.2)", borderRadius: "0.75rem", width: "48px", height: "48px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <UserCheck size={24} color="white" />
            </div>
            <div>
              <h1 className="page-header__title">Quản lý Thành viên</h1>
              <p className="page-header__subtitle">Hệ thống quản lý cư dân và nhân viên vận hành</p>
            </div>
          </div>
          <button className="btn btn-primary" onClick={() => navigate("/users/create")}>
            <Plus size={18} /> Thêm người dùng
          </button>
        </div>
      </div>

      {/* FILTERS */}
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <div className="card-body" style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "center" }}>
          <div style={{ position: "relative", flex: 2, minWidth: "300px" }}>
            <Search style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} size={16} />
            <input
              type="text" className="form-input" style={{ paddingLeft: "2.5rem" }}
              placeholder="Tìm kiếm theo tên, email..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearchTrigger()}
            />
          </div>
          <div style={{ flex: 1, minWidth: "200px" }}>
            <select className="form-input" value={statusFilter} onChange={handleFilterChange}>
              <option value="">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang hoạt động</option>
              <option value="INACTIVE">Đang khóa</option>
            </select>
          </div>
          <button className="btn btn-primary" onClick={handleSearchTrigger}>Tìm kiếm</button>
        </div>
      </div>

      {/* TABLE */}
      <div className="card" style={{ border: "1px solid #e2e8f0" }}>
        <div className="card-body p-0" style={{ overflowX: "auto" }}>
          <table className="data-table" style={{ width: "100%" }}>
            <thead>
              <tr>
                <th style={{ paddingLeft: "1.5rem" }}>Thành viên</th>
                <th>Liên lạc</th>
                <th>Vai trò</th>
                <th>Trạng thái</th>
                <th style={{ textAlign: "right", paddingRight: "1.5rem" }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" style={{ textAlign: "center", padding: "5rem" }}><Loader2 className="spin" /></td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan="5" style={{ textAlign: "center", padding: "5rem" }}>Không có dữ liệu.</td></tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="table-row-hover">
                    <td style={{ paddingLeft: "1.5rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                        <div style={{ background: "#f1f5f9", width: "40px", height: "40px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", color: "#3b82f6" }}>
                          {u.fullName?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700 }}>{u.fullName}</div>
                          <div style={{ fontSize: "0.75rem", color: "#64748b" }}>ID: {u.id?.substring(0, 8)}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: "0.85rem" }}>
                        <div><Mail size={12}/> {u.email}</div>
                        <div><Phone size={12}/> {u.phone}</div>
                      </div>
                    </td>
                    <td>
                      {u.roles?.map((r, i) => (
                        <span key={i} className="badge" style={{ fontSize: "0.7rem", marginRight: "4px" }}><Shield size={10} /> {r.roleName}</span>
                      ))}
                    </td>
                    <td>
                      <span className={`badge ${u.status === 'ACTIVE' ? 'badge--active' : 'badge--draft'}`}>
                        {u.status === 'ACTIVE' ? 'Hoạt động' : 'Đã khóa'}
                      </span>
                    </td>
                    <td style={{ textAlign: "right", paddingRight: "1.5rem" }}>
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
                        <button onClick={() => { setSelectedUser(u); setShowModal(true); }} className="btn btn-ghost btn-icon"><Eye size={18} /></button>
                        <button onClick={() => navigate(`/users/edit/${u.id}`)} className="btn btn-ghost btn-icon"><Edit size={18} /></button>
                        <button onClick={() => handleDelete(u.id, u.fullName)} className="btn btn-ghost btn-icon" style={{ color: "#ef4444" }}><Trash2 size={18} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="card-body" style={{ background: "#f8fafc", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 1.5rem" }}>
          <span style={{ fontSize: "0.875rem", color: "#64748b" }}>
            Trang <strong>{currentPage}</strong> trên <strong>{totalPages}</strong>
          </span>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              disabled={currentPage === 1 || loading}
              onClick={() => setCurrentPage(p => p - 1)}
              className="btn btn-ghost" style={{ background: "white", border: "1px solid #e2e8f0" }}
            >
              <ChevronLeft size={18} /> Trước
            </button>
            <button
              disabled={currentPage >= totalPages || loading}
              onClick={() => setCurrentPage(p => p + 1)}
              className="btn btn-ghost" style={{ background: "white", border: "1px solid #e2e8f0" }}
            >
              Sau <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* MODAL (Giữ nguyên phần này từ code cũ) */}
      {showModal && selectedUser && (
        <div className="modal-overlay">
          <div className="card" style={{ width: "100%", maxWidth: "500px" }}>
             {/* Nội dung modal tương tự code cũ */}
             <div className="card-body" style={{ textAlign: "right" }}>
                <button className="btn btn-primary" onClick={() => setShowModal(false)}>Đóng</button>
             </div>
          </div>
        </div>
      )}

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .badge { padding: 2px 8px; border-radius: 4px; font-weight: 600; display: inline-flex; alignItems: center; gap: 4px; background: #e2e8f0; }
        .badge--active { background: #dcfce7; color: #166534; }
        .badge--draft { background: #fee2e2; color: #991b1b; }
      `}</style>
    </div>
  );
}