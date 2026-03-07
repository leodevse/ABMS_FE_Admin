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
    BarChart2,
} from "lucide-react";
import maintenanceApi from "../../api/maintenanceApi";

const STATUS_MAP = {
    PENDING:     { label: "Chờ xử lý",   cssClass: "badge--draft" },
    IN_PROGRESS: { label: "Đang xử lý",  cssClass: "badge--confirmed" },
    COMPLETED:   { label: "Hoàn thành",  cssClass: "badge--active" },
    CANCELLED:   { label: "Đã huỷ",      cssClass: "badge--inactive" },
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
                    <div className="stat-card">
                        <div className="stat-card__icon stat-card__icon--yellow">
                            <Clock size={22} />
                        </div>
                        <div>
                            <div className="stat-card__value">
                                {stats.byStatus?.PENDING ?? "–"}
                            </div>
                            <div className="stat-card__label">Chờ xử lý</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-card__icon stat-card__icon--blue">
                            <Wrench size={22} />
                        </div>
                        <div>
                            <div className="stat-card__value">
                                {stats.byStatus?.IN_PROGRESS ?? "–"}
                            </div>
                            <div className="stat-card__label">Đang xử lý</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-card__icon stat-card__icon--green">
                            <CheckCircle2 size={22} />
                        </div>
                        <div>
                            <div className="stat-card__value">
                                {stats.byStatus?.COMPLETED ?? "–"}
                            </div>
                            <div className="stat-card__label">Hoàn thành</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-card__icon stat-card__icon--red">
                            <XCircle size={22} />
                        </div>
                        <div>
                            <div className="stat-card__value">
                                {stats.byStatus?.CANCELLED ?? "–"}
                            </div>
                            <div className="stat-card__label">Đã huỷ</div>
                        </div>
                    </div>
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
                        <option value="MEDIUM">Trung bình</option>
                        <option value="HIGH">Cao</option>
                        <option value="URGENT">Khẩn cấp</option>
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
                                <th>Cư dân</th>
                                <th>Nhân viên</th>
                                <th>Ưu tiên</th>
                                <th>Trạng thái</th>
                                <th>Ngày tạo</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {requests.map((r) => {
                                const s = STATUS_MAP[r.status] ?? { label: r.status, cssClass: "badge--locked" };
                                return (
                                    <tr key={r.id} style={{ cursor: "pointer" }} onClick={() => navigate(`/maintenance/${r.id}`)}>
                                        <td style={{ fontWeight: 500 }}>{r.title ?? "–"}</td>
                                        <td>{r.residentName ?? "–"}</td>
                                        <td>{r.assignedStaffName ?? <span style={{ color: "var(--color-text-muted)", fontSize: "0.8rem" }}>Chưa giao</span>}</td>
                                        <td>{r.priority ?? "–"}</td>
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
