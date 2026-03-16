import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Wrench,
    Search,
    ChevronRight,
    Loader,
    AlertCircle,
    Clock,
    CheckCircle2,
    XCircle,
} from "lucide-react";
import maintenanceApi from "../../api/maintenanceApi";

const STATUS_MAP = {
    PENDING:          { label: "Chờ xử lý", cssClass: "badge--draft" },
    VERIFYING:        { label: "Đang xác minh", cssClass: "badge--confirmed" },
    QUOTING:          { label: "Đang báo giá", cssClass: "badge--metered" },
    WAITING_APPROVAL: { label: "Chờ duyệt báo giá", cssClass: "badge--flat" },
    APPROVED:         { label: "Đã duyệt báo giá", cssClass: "badge--tier" },
    IN_PROGRESS:      { label: "Đang xử lý", cssClass: "badge--confirmed" },
    COMPLETED:        { label: "Hoàn thành", cssClass: "badge--active" },
    RESIDENT_ACCEPTED:{ label: "Cư dân đã nghiệm thu", cssClass: "badge--active" },
    CANCELLED:        { label: "Đã huỷ", cssClass: "badge--inactive" },
};

const PRIORITY_MAP = {
    LOW: { label: "Thấp", cssClass: "badge--locked" },
    NORMAL: { label: "Bình thường", cssClass: "badge--confirmed" },
    MEDIUM: { label: "Trung bình", cssClass: "badge--metered" },
    HIGH: { label: "Cao", cssClass: "badge--flat" },
    URGENT: { label: "Khẩn cấp", cssClass: "badge--inactive" },
    CRITICAL: { label: "Nghiêm trọng", cssClass: "badge--inactive" },
};

export default function MaintenancePage() {
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const [stats, setStats]     = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState(null);
    const [keyword, setKeyword] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [priorityFilter, setPriorityFilter] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("");
    const [page, setPage]       = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const PAGE_SIZE = 10;

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = { keyword, page, size: PAGE_SIZE };
            if (statusFilter) params.status = statusFilter;
            if (priorityFilter) params.priority = priorityFilter;
            if (categoryFilter) params.category = categoryFilter;
            
            const [reqRes, statsRes] = await Promise.all([
                maintenanceApi.getRequests(params),
                maintenanceApi.getStatistics(),
            ]);
            setRequests(reqRes.data.result?.data ?? []);
            setTotalPages(reqRes.data.result?.totalPages ?? 1);
            setStats(statsRes.data.result ?? null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [page]);

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        fetchData();
    };

    const getStatusCount = (keys) => {
        if (!stats?.byStatus) return 0;
        return keys.reduce((sum, key) => sum + (stats.byStatus[key] || 0), 0);
    };

    const statCards = [
        {
            key: "PENDING",
            label: "Chờ xử lý",
            value: getStatusCount(["PENDING"]),
            icon: Clock,
            iconClass: "stat-card__icon--yellow",
        },
        {
            key: "VERIFYING",
            label: "Đang xác minh",
            value: getStatusCount(["VERIFYING"]),
            icon: Search,
            iconClass: "stat-card__icon--blue",
        },
        {
            key: "QUOTING_WAITING",
            label: "Báo giá / Chờ duyệt",
            value: getStatusCount(["QUOTING", "WAITING_APPROVAL"]),
            icon: AlertCircle,
            iconClass: "stat-card__icon--yellow",
        },
        {
            key: "APPROVED_IN_PROGRESS",
            label: "Đã duyệt / Đang xử lý",
            value: getStatusCount(["APPROVED", "IN_PROGRESS"]),
            icon: Wrench,
            iconClass: "stat-card__icon--blue",
        },
        {
            key: "DONE",
            label: "Hoàn thành / Nghiệm thu",
            value: getStatusCount(["COMPLETED", "RESIDENT_ACCEPTED"]),
            icon: CheckCircle2,
            iconClass: "stat-card__icon--green",
        },
        {
            key: "CANCELLED",
            label: "Đã hủy",
            value: getStatusCount(["CANCELLED"]),
            icon: XCircle,
            iconClass: "stat-card__icon--red",
        },
    ];

    return (
        <div>
            {/* Page Header */}
            <div className="page-header">
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <Wrench size={24} />
                    <div>
                        <h1 className="page-header__title">Quản lý bảo trì</h1>
                        <p className="page-header__subtitle">
                            Theo dõi và xử lý yêu cầu bảo trì từ cư dân
                        </p>
                    </div>
                </div>
            </div>

            {/* Stats */}
            {stats && (
                <div className="stats-grid">
                    {statCards.map((item) => {
                        const Icon = item.icon;
                        return (
                            <div key={item.key} className="stat-card">
                                <div className={`stat-card__icon ${item.iconClass}`}>
                                    <Icon size={22} />
                                </div>
                                <div>
                                    <div className="stat-card__value">{item.value}</div>
                                    <div className="stat-card__label">{item.label}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Toolbar */}
            <div className="card" style={{ marginBottom: "1rem" }}>
                <form onSubmit={handleSearch} className="toolbar" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <div className="toolbar__search" style={{ flex: 1, minWidth: '200px' }}>
                        <Search className="search-icon" />
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Tìm kiếm yêu cầu (tiêu đề, mã)..."
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            style={{ paddingLeft: "2.25rem", width: '100%' }}
                        />
                    </div>
                    
                    <select 
                        className="form-input" 
                        value={statusFilter} 
                        onChange={(e) => setStatusFilter(e.target.value)}
                        style={{ width: '150px' }}
                    >
                        <option value="">Tất cả trạng thái</option>
                        <option value="PENDING">Chờ xử lý</option>
                        <option value="VERIFYING">Đang xác minh</option>
                        <option value="QUOTING">Đang báo giá</option>
                        <option value="WAITING_APPROVAL">Chờ duyệt BG</option>
                        <option value="APPROVED">Đã duyệt BG</option>
                        <option value="IN_PROGRESS">Đang xử lý</option>
                        <option value="COMPLETED">Hoàn thành</option>
                        <option value="CANCELLED">Đã huỷ</option>
                    </select>

                    <select 
                        className="form-input" 
                        value={priorityFilter} 
                        onChange={(e) => setPriorityFilter(e.target.value)}
                        style={{ width: '150px' }}
                    >
                        <option value="">Tất cả độ ưu tiên</option>
                        <option value="LOW">Thấp</option>
                        <option value="NORMAL">Bình thường</option>
                        <option value="MEDIUM">Trung bình</option>
                        <option value="HIGH">Cao</option>
                        <option value="URGENT">Khẩn cấp</option>
                        <option value="CRITICAL">Nghiêm trọng</option>
                    </select>

                    <select
                        className="form-input"
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        style={{ width: '170px' }}
                    >
                        <option value="">Tất cả danh mục</option>
                        <option value="REPAIR">Sửa chữa</option>
                        <option value="MAINTENANCE">Bảo trì</option>
                        <option value="SERVICE">Dịch vụ</option>
                        <option value="CLEANING">Vệ sinh</option>
                        <option value="OTHER">Khác</option>
                    </select>

                    <div className="toolbar__actions">
                        <button type="submit" className="btn btn-primary btn-sm">
                            Lọc & Tìm kiếm
                        </button>
                    </div>
                </form>

                {/* Table */}
                {loading ? (
                    <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
                        <Loader size={28} style={{ animation: "spin 1s linear infinite", color: "var(--color-primary)" }} />
                    </div>
                ) : error ? (
                    <div style={{ textAlign: "center", padding: "3rem", color: "var(--color-danger)" }}>
                        <AlertCircle size={32} style={{ marginBottom: "0.5rem" }} />
                        <p style={{ fontSize: "0.875rem" }}>{error}</p>
                        <button className="btn btn-ghost btn-sm" style={{ marginTop: "0.75rem" }} onClick={fetchData}>
                            Thử lại
                        </button>
                    </div>
                ) : requests.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "3rem", color: "var(--color-text-muted)" }}>
                        <Wrench size={32} style={{ opacity: 0.3, marginBottom: "0.5rem" }} />
                        <p style={{ fontSize: "0.875rem" }}>Không có yêu cầu nào.</p>
                    </div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Tiêu đề</th>
                                <th>Phòng / Căn hộ</th>
                                <th>Nhân viên</th>
                                <th>Ưu tiên</th>
                                <th>Trạng thái</th>
                                <th>Ngày tạo</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {requests.map((r) => {
                                const statusValue = r.requestStatus || r.status;
                                const priorityValue = r.priority;
                                const s = STATUS_MAP[statusValue] ?? { label: statusValue || "-", cssClass: "badge--locked" };
                                const p = PRIORITY_MAP[priorityValue] ?? { label: priorityValue || "-", cssClass: "badge--locked" };
                                const staffName = r.staffName || r.assignedStaffName;
                                return (
                                    <tr key={r.id} style={{ cursor: "pointer" }} onClick={() => navigate(`/maintenance/${r.id}`)}>
                                        <td>
                                            <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                                                <span style={{ fontWeight: 700 }}>{r.title ?? "–"}</span>
                                                <span style={{ color: "var(--color-text-muted)", fontSize: "0.78rem" }}>{r.code ?? ""}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                                                <span style={{ fontWeight: 600 }}>{r.apartmentCode || "Chưa có phòng"}</span>
                                                <span style={{ color: "var(--color-text-muted)", fontSize: "0.78rem" }}>{r.buildingName || "-"}</span>
                                            </div>
                                        </td>
                                        <td>{staffName ?? <span style={{ color: "var(--color-text-muted)", fontSize: "0.8rem" }}>Chưa giao</span>}</td>
                                        <td><span className={`badge ${p.cssClass}`}>{p.label}</span></td>
                                        <td><span className={`badge ${s.cssClass}`}>{s.label}</span></td>
                                        <td style={{ color: "var(--color-text-muted)", fontSize: "0.8rem" }}>
                                            {r.createdAt ? new Date(r.createdAt).toLocaleDateString("vi-VN") : "–"}
                                        </td>
                                        <td><ChevronRight size={16} color="var(--color-text-muted)" /></td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "0.75rem" }}>
                    <button className="btn btn-ghost btn-sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>← Trước</button>
                    <span style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
                        Trang {page} / {totalPages}
                    </span>
                    <button className="btn btn-ghost btn-sm" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>Sau →</button>
                </div>
            )}
        </div>
    );
}
