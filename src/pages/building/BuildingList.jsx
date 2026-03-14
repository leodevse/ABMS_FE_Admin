import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  Search,
  Plus,
  Trash2,
  Edit,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Eye,
  X,
  Loader2,
} from "lucide-react";
import {
  fetchBuildings,
  deleteBuilding,
  generateApartments,
} from "../../services/buildingApi";

export default function BuildingList() {
  const navigate = useNavigate();

  const [searchInput, setSearchInput] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [buildings, setBuildings] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);

  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const token = localStorage.getItem("token");

  const loadBuildings = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await fetchBuildings(
        currentPage,
        pageSize,
        activeSearch,
        statusFilter,
      );
      if (data.code === 200 && data.result) {
        setBuildings(data.result.content || []);
        setTotalPages(data.result.totalPages || 0);
      }
    } catch (error) {
      console.error("Lỗi fetchBuildings:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, activeSearch, statusFilter, token]);

  useEffect(() => {
    loadBuildings();
  }, [loadBuildings]);

  const handleSearchTrigger = () => {
    setCurrentPage(0);
    setActiveSearch(searchInput);
  };

  const handleFilterChange = (e) => {
    setCurrentPage(0);
    setStatusFilter(e.target.value);
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Xóa tòa nhà "${name}"?`)) {
      const res = await deleteBuilding(id, token);
      if (res.code === 200) loadBuildings();
    }
  };

  const handleGenerate = async (id) => {
    if (!window.confirm("Bắt đầu sinh căn hộ?")) return;
    const res = await generateApartments(id, token);
    if (res.code === 200 || res.code === 201) {
      alert("Thành công!");
      setShowModal(false);
      loadBuildings();
    }
  };

  return (
    /* Thay đổi quan trọng: width: 100% và maxWidth: none */
    <div
      className="maintenance-detail-container"
      style={{
        padding: "1.5rem",
        width: "100%",
        maxWidth: "none",
        minHeight: "100vh",
        boxSizing: "border-box",
      }}
    >
      {/* 1. PAGE HEADER - Chiếm trọn chiều ngang */}
      <div
        className="page-header"
        style={{ marginBottom: "1.5rem", borderRadius: "var(--radius)" }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div
              style={{
                background: "rgba(255,255,255,0.2)",
                borderRadius: "0.75rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "48px",
                height: "48px",
              }}
            >
              <Building2 size={24} color="white" />
            </div>
            <div>
              <h1 className="page-header__title">Quản lý Tòa nhà</h1>
              <p className="page-header__subtitle">
                Hệ thống quản lý danh sách và khởi tạo dữ liệu căn hộ
              </p>
            </div>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => navigate("/add-building")}
          >
            <Plus size={18} /> Thêm tòa nhà mới
          </button>
        </div>
      </div>

      {/* 2. FILTERS - Tận dụng không gian rộng */}
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <div
          className="card-body"
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "1rem",
            alignItems: "center",
          }}
        >
          <div style={{ position: "relative", flex: 2, minWidth: "300px" }}>
            <Search
              style={{
                position: "absolute",
                left: "0.75rem",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--color-text-muted)",
              }}
              size={16}
            />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: "2.5rem" }}
              placeholder="Tìm kiếm theo tên tòa nhà hoặc mã định danh..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearchTrigger()}
            />
          </div>

          <div style={{ flex: 1, minWidth: "200px", position: "relative" }}>
            <Filter
              style={{
                position: "absolute",
                left: "0.75rem",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--color-text-muted)",
                zIndex: 1,
              }}
              size={16}
            />
            <select
              className="form-input"
              style={{ paddingLeft: "2.5rem" }}
              value={statusFilter}
              onChange={handleFilterChange}
            >
              <option value="">Tất cả trạng thái khởi tạo</option>
              <option value="true">Đã sinh căn hộ</option>
              <option value="false">Chờ khởi tạo</option>
            </select>
          </div>

          <button
            className="btn btn-primary"
            onClick={handleSearchTrigger}
            style={{ minWidth: "120px" }}
          >
            Tìm kiếm
          </button>
        </div>
      </div>

      {/* 3. DATA TABLE - Trải rộng toàn màn hình */}
      <div className="card" style={{ border: "1px solid var(--color-border)" }}>
        <div className="card-body p-0" style={{ overflowX: "auto" }}>
          <table className="data-table" style={{ width: "100%" }}>
            <thead>
              <tr>
                <th style={{ width: "35%", paddingLeft: "1.5rem" }}>
                  Thông tin tòa nhà
                </th>
                <th style={{ width: "20%" }}>Quy mô vận hành</th>
                <th style={{ width: "25%" }}>Trạng thái hệ thống</th>
                <th style={{ textAlign: "right", paddingRight: "1.5rem" }}>
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan="4"
                    style={{ textAlign: "center", padding: "5rem" }}
                  >
                    <Loader2
                      size={32}
                      style={{
                        animation: "spin 1s linear infinite",
                        color: "var(--color-primary)",
                        margin: "0 auto 1rem",
                      }}
                    />
                    <p
                      style={{
                        color: "var(--color-text-muted)",
                        fontWeight: 500,
                      }}
                    >
                      Đang truy xuất dữ liệu từ máy chủ...
                    </p>
                  </td>
                </tr>
              ) : buildings.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    style={{
                      textAlign: "center",
                      padding: "5rem",
                      color: "var(--color-text-muted)",
                    }}
                  >
                    Không có dữ liệu tòa nhà để hiển thị.
                  </td>
                </tr>
              ) : (
                buildings.map((b) => (
                  <tr key={b.id} className="table-row-hover">
                    <td style={{ paddingLeft: "1.5rem" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "1rem",
                        }}
                      >
                        <div
                          style={{
                            background: "var(--color-bg-light)",
                            width: "40px",
                            height: "40px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            borderRadius: "10px",
                            fontWeight: "bold",
                            fontSize: "0.7rem",
                            color: "var(--color-primary)",
                            border: "1px solid var(--color-border)",
                          }}
                        >
                          {b.code}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>
                            {b.name}
                          </div>
                          <div
                            style={{
                              fontSize: "0.75rem",
                              color: "var(--color-text-muted)",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                              marginTop: "2px",
                            }}
                          >
                            <MapPin size={12} /> {b.address}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div
                        style={{ fontWeight: 600, color: "var(--color-text)" }}
                      >
                        {b.numFloors} Tầng căn hộ
                      </div>
                    </td>
                    <td>
                      {b.apartmentsGenerated ? (
                        <span
                          className="badge badge--active"
                          style={{ padding: "6px 12px" }}
                        >
                          <CheckCircle2
                            size={13}
                            style={{ marginRight: "6px" }}
                          />{" "}
                          Sẵn sàng vận hành
                        </span>
                      ) : (
                        <span
                          className="badge badge--draft"
                          style={{ padding: "6px 12px" }}
                        >
                          <AlertCircle
                            size={13}
                            style={{ marginRight: "6px" }}
                          />{" "}
                          Cần khởi tạo
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: "right", paddingRight: "1.5rem" }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "flex-end",
                          gap: "0.5rem",
                        }}
                      >
                                                <button
                          onClick={() =>
                            navigate(`/buildings/${b.id}/apartments`)
                          }
                          className="btn btn-ghost btn-icon"
                          style={{ color: "var(--color-primary)" }}
                          title="Xem danh sách căn hộ"
                        >
                          <Building2 size={20} />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedBuilding(b);
                            setShowModal(true);
                          }}
                          className="btn btn-ghost btn-icon"
                          title="Xem chi tiết"
                        >
                          <Eye size={20} />
                        </button>
                        <button
                          onClick={() => navigate(`/buildings/edit/${b.id}`)}
                          className="btn btn-ghost btn-icon"
                          style={{ color: "var(--color-tier)" }}
                          title="Chỉnh sửa"
                        >
                          <Edit size={20} />
                        </button>
                        <button
                          onClick={() => handleDelete(b.id, b.name)}
                          className="btn btn-ghost btn-icon"
                          style={{ color: "var(--color-danger)" }}
                          title="Xóa bỏ"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION - Full Width Footer */}
        <div
          className="card-body"
          style={{
            background: "#f8fafc",
            borderTop: "1px solid var(--color-border)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "1rem 1.5rem",
          }}
        >
          <span
            style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}
          >
            Hiển thị trang <strong>{currentPage + 1}</strong> trong tổng số{" "}
            <strong>{totalPages}</strong> trang
          </span>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              disabled={currentPage === 0}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="btn btn-ghost"
              style={{
                background: "white",
                border: "1px solid var(--color-border)",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <ChevronLeft size={18} /> Trước
            </button>
            <button
              disabled={currentPage >= totalPages - 1}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="btn btn-ghost"
              style={{
                background: "white",
                border: "1px solid var(--color-border)",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              Sau <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* MODAL - Vẫn giữ kích thước Max-width để không bị quá to trên màn hình rộng */}
      {showModal && selectedBuilding && (
        <div className="modal-overlay">
          <div
            className="card"
            style={{
              width: "100%",
              maxWidth: "550px",
              animation: "fadeIn 0.2s ease-out",
              boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)",
            }}
          >
            <div
              className="card-body"
              style={{
                background: "#f8fafc",
                borderBottom: "1px solid var(--color-border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h3 style={{ fontWeight: 700, margin: 0, fontSize: "1.1rem" }}>
                Thông tin tòa nhà chi tiết
              </h3>
              <button
                className="btn btn-ghost btn-icon"
                onClick={() => setShowModal(false)}
              >
                <X size={20} color="var(--color-text-muted)" />
              </button>
            </div>
            <div className="card-body" style={{ padding: "2rem" }}>
              <div style={{ marginBottom: "2rem" }}>
                <label
                  className="form-label"
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--color-text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Tên định danh
                </label>
                <div
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: 800,
                    color: "var(--color-primary)",
                    marginTop: "0.25rem",
                  }}
                >
                  {selectedBuilding.name}
                </div>
              </div>

              <div
                style={{
                  background: "#f8fafc",
                  padding: "1.25rem",
                  borderRadius: "12px",
                  border: "1px solid var(--color-border)",
                  marginBottom: "2rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "0.75rem",
                  }}
                >
                  <span style={{ color: "var(--color-text-muted)" }}>
                    Mã hệ thống:
                  </span>
                  <span style={{ fontWeight: 700 }}>
                    {selectedBuilding.code}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "0.75rem",
                  }}
                >
                  <span style={{ color: "var(--color-text-muted)" }}>
                    Tổng số tầng:
                  </span>
                  <span style={{ fontWeight: 700 }}>
                    {selectedBuilding.numFloors} Tầng
                  </span>
                </div>
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span style={{ color: "var(--color-text-muted)" }}>
                    Địa chỉ:
                  </span>
                  <span
                    style={{
                      fontWeight: 600,
                      textAlign: "right",
                      maxWidth: "200px",
                      fontSize: "0.85rem",
                    }}
                  >
                    {selectedBuilding.address}
                  </span>
                </div>
              </div>

              {!selectedBuilding.apartmentsGenerated && (
                <button
                  onClick={() => handleGenerate(selectedBuilding.id)}
                  className="btn btn-primary"
                  style={{
                    width: "100%",
                    padding: "1.25rem",
                    background: "#f59e0b",
                    borderColor: "#d97706",
                    fontSize: "0.9rem",
                    fontWeight: "bold",
                  }}
                >
                  <RefreshCw size={20} style={{ marginRight: "10px" }} /> KHỞI
                  TẠO DANH SÁCH CĂN HỘ
                </button>
              )}
            </div>
            <div
              className="card-body"
              style={{
                display: "flex",
                justifyContent: "flex-end",
                background: "#f8fafc",
                borderTop: "1px solid var(--color-border)",
              }}
            >
              <button
                className="btn btn-ghost"
                onClick={() => setShowModal(false)}
                style={{ fontWeight: 600 }}
              >
                Đóng cửa sổ
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
                .maintenance-detail-container { animation: fadeIn 0.3s ease-in-out; background-color: #f1f5f9; }
                .table-row-hover:hover { background-color: #f8fafc !important; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                
                /* Đảm bảo bảng không bị co rụt trên màn hình siêu rộng */
                .data-table th, .data-table td {
                    padding: 1rem 0.75rem;
                }
            `}</style>
    </div>
  );
}
