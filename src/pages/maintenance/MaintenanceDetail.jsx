import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
    ChevronLeft,
    Clock,
    User,
    Calendar,
    CheckCircle2,
    AlertCircle,
    Loader2,
    FileText,
    Building,
    DollarSign,
    MessageSquare,
    UserPlus,
    X,
    MoreHorizontal,
    LayoutDashboard,
    ClipboardList,
    History,
    MapPin,
    Hash,
    Search,
    Wrench,
    Trash2
} from "lucide-react";
import maintenanceApi from "../../api/maintenanceApi";

/**
 * STATUS_MAP using project-standard badge classes from index.css
 */
const STATUS_MAP = {
    PENDING:          { label: "Chờ xử lý",   cssClass: "badge--draft" },
    VERIFYING:        { label: "Đang xác minh", cssClass: "badge--confirmed" },
    QUOTING:          { label: "Đang báo giá",  cssClass: "badge--metered" },
    WAITING_APPROVAL: { label: "Chờ duyệt BG",  cssClass: "badge--flat" },
    APPROVED:         { label: "Đã duyệt BG",   cssClass: "badge--tier" },
    IN_PROGRESS:      { label: "Đang xử lý",    cssClass: "badge--confirmed" },
    COMPLETED:        { label: "Hoàn thành",    cssClass: "badge--active" },
    CANCELLED:        { label: "Đã huỷ",        cssClass: "badge--inactive" },
};

const PRIORITY_MAP = {
    LOW:    { label: "Thấp",    color: "var(--color-text-muted)" },
    MEDIUM: { label: "Trung bình", color: "#d97706" },
    HIGH:   { label: "Cao",     color: "#ea580c" },
    URGENT: { label: "Khẩn cấp", color: "var(--color-danger)" },
    CRITICAL: { label: "Nghiêm trọng", color: "var(--color-danger)" }
};

export default function MaintenanceDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    // Data State
    const [request, setRequest] = useState(null);
    const [logs, setLogs] = useState([]);
    const [quotations, setQuotations] = useState([]);

    // UI State
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('info');

    // Modals State
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [assignStaffId, setAssignStaffId] = useState("");
    const [isAssigning, setIsAssigning] = useState(false);

    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [cancelReason, setCancelReason] = useState("");
    const [isCanceling, setIsCanceling] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [reqRes, logsRes, quoteRes] = await Promise.all([
                maintenanceApi.getRequestById(id),
                maintenanceApi.getLogs(id),
                maintenanceApi.getQuotationsByRequestId(id)
            ]);
            setRequest(reqRes.data.result);
            setLogs(logsRes.data.result || []);
            setQuotations(quoteRes.data.result || []);
        } catch (err) {
            setError(err.message || "Không thể tải thông tin chi tiết");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const handleAssign = async () => {
        if (!assignStaffId) return;
        setIsAssigning(true);
        try {
            await maintenanceApi.assignRequest(id, { staffId: assignStaffId });
            setIsAssignModalOpen(false);
            fetchData();
        } catch (err) {
            alert("Lỗi khi giao việc: " + err.message);
        } finally {
            setIsAssigning(false);
        }
    };

    const handleCancel = async () => {
        setIsCanceling(true);
        try {
            await maintenanceApi.cancelRequest(id, { reason: cancelReason });
            setIsCancelModalOpen(false);
            fetchData();
        } catch (err) {
            alert("Lỗi khi huỷ: " + err.message);
        } finally {
            setIsCanceling(false);
        }
    };

    const formatDate = (dateString, full = true) => {
        if (!dateString) return '–';
        const date = new Date(dateString);
        return full 
            ? date.toLocaleString('vi-VN')
            : date.toLocaleDateString('vi-VN');
    };

    if (loading) {
        return (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
                <Loader2 size={32} style={{ animation: "spin 1s linear infinite", color: "var(--color-primary)", marginBottom: "1rem" }} />
                <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>Đang tải dữ liệu...</p>
            </div>
        );
    }

    if (error || !request) {
        return (
            <div style={{ padding: "3rem", textAlign: "center" }}>
                <AlertCircle size={48} color="var(--color-danger)" style={{ marginBottom: "1rem" }} />
                <h2 style={{ fontSize: "1.25rem", fontWeight: 700 }}>{error || "Không tìm thấy yêu cầu"}</h2>
                <button 
                    onClick={() => navigate('/maintenance')} 
                    className="btn btn-ghost btn-sm"
                    style={{ marginTop: "1rem" }}
                >
                    <ChevronLeft size={16} /> Quay lại danh sách
                </button>
            </div>
        );
    }

    const s = STATUS_MAP[request.status] || { label: request.status, cssClass: "badge--locked" };
    const p = PRIORITY_MAP[request.priority] || { label: request.priority, color: "var(--color-text)" };

    return (
        <div className="maintenance-detail-container">
            {/* Page Header - Project Style */}
            <div className="page-header">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                        <button 
                            className="btn btn-ghost btn-icon" 
                            onClick={() => navigate('/maintenance')}
                            style={{ color: "white", borderColor: "rgba(255,255,255,0.3)" }}
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                                <h1 className="page-header__title">{request.title || "Chi tiết yêu cầu"}</h1>
                                <span className={`badge ${s.cssClass}`} style={{ fontSize: "0.7rem" }}>{s.label}</span>
                            </div>
                            <p className="page-header__subtitle">Mã yêu cầu: {request.code}</p>
                        </div>
                    </div>

                    <div style={{ display: "flex", gap: "0.5rem" }}>
                        {['PENDING', 'VERIFYING'].includes(request.status) && (
                            <>
                                <button className="btn btn-primary" onClick={() => setIsAssignModalOpen(true)}>
                                    <UserPlus size={16} /> Giao việc
                                </button>
                                <button className="btn btn-danger" onClick={() => setIsCancelModalOpen(true)}>
                                    <Trash2 size={16} /> Huỷ yêu cầu
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "1.5rem", alignItems: "start" }}>
                {/* Main Content Area */}
                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                    
                    {/* Tabs Bar - Project Styled */}
                    <div className="card" style={{ padding: "0.5rem", display: "flex", gap: "0.5rem", background: "#f8fafc" }}>
                        {[
                            { id: 'info', label: 'Thông tin chung', icon: FileText },
                            { id: 'quote', label: 'Báo giá', icon: DollarSign, count: quotations.length },
                            { id: 'logs', label: 'Nhật ký xử lý', icon: History, count: logs.length }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`btn ${activeTab === tab.id ? 'btn-primary' : 'btn-ghost'}`}
                                style={{ flex: 1, justifyContent: "center" }}
                            >
                                <tab.icon size={16} />
                                <span>{tab.label}</span>
                                {tab.count > 0 && <span style={{ opacity: 0.6, fontSize: "0.75rem", marginLeft: "0.25rem" }}>({tab.count})</span>}
                            </button>
                        ))}
                    </div>

                    {/* Content Panel */}
                    <div className="card">
                        <div className="card-body">
                            {activeTab === 'info' && (
                                <div>
                                    <div style={{ marginBottom: "2rem" }}>
                                        <h3 style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", color: "var(--color-primary)", marginBottom: "1rem" }}>
                                            Mô tả yêu cầu
                                        </h3>
                                        <div style={{ background: "#f8fafc", padding: "1.25rem", borderRadius: "var(--radius)", border: "1px solid var(--color-border)" }}>
                                            <p style={{ fontSize: "0.935rem", lineHeight: "1.6", whiteSpace: "pre-wrap", color: "var(--color-text)" }}>
                                                {request.description || "Không có mô tả chi tiết."}
                                            </p>
                                        </div>
                                    </div>

                                    {request.images && request.images.length > 0 && (
                                        <div>
                                            <h3 style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", color: "var(--color-primary)", marginBottom: "1rem" }}>
                                                Hình ảnh đính kèm
                                            </h3>
                                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "1rem" }}>
                                                {request.images.map((img, idx) => (
                                                    <a key={idx} href={img} target="_blank" rel="noreferrer" className="card" style={{ position: "relative", paddingTop: "100%", overflow: "hidden" }}>
                                                        <img src={img} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectCover: "cover" }} />
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'quote' && (
                                <div>
                                    {quotations.length > 0 ? quotations.map((q) => (
                                        <div key={q.id} className="card" style={{ marginBottom: "1.5rem" }}>
                                            <div className="card-body" style={{ background: "#f8fafc", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                <div>
                                                    <h4 style={{ fontWeight: 700, fontSize: "1rem" }}>{q.title}</h4>
                                                    <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Ngày tạo: {formatDate(q.createdAt)}</p>
                                                </div>
                                                <span className={`badge ${q.status === 'APPROVED' ? 'badge--active' : q.status === 'REJECTED' ? 'badge--inactive' : 'badge--draft'}`}>
                                                    {q.status}
                                                </span>
                                            </div>
                                            <div className="card-body p-0">
                                                <table className="data-table">
                                                    <thead>
                                                        <tr>
                                                            <th>Tên hạng mục</th>
                                                            <th style={{ textAlign: "center" }}>SL</th>
                                                            <th style={{ textAlign: "right" }}>Đơn giá</th>
                                                            <th style={{ textAlign: "right" }}>Thành tiền</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {q.items?.map((item, idx) => (
                                                            <tr key={idx}>
                                                                <td style={{ fontWeight: 500 }}>{item.name}</td>
                                                                <td style={{ textAlign: "center" }}>{item.quantity}</td>
                                                                <td style={{ textAlign: "right" }}>{item.unitPrice?.toLocaleString()} đ</td>
                                                                <td style={{ textAlign: "right", fontWeight: 600 }}>{(item.unitPrice * item.quantity).toLocaleString()} đ</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                            <div className="card-body" style={{ background: "#f8fafc", textAlign: "right", borderTop: "1px solid var(--color-border)" }}>
                                                <span style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", marginRight: "1rem" }}>TỔNG CỘNG:</span>
                                                <span style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--color-primary)" }}>{q.totalAmount?.toLocaleString()} đ</span>
                                            </div>
                                        </div>
                                    )) : (
                                        <div style={{ textAlign: "center", padding: "3rem", color: "var(--color-text-muted)" }}>
                                            <p>Chưa có thông tin báo giá.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'logs' && (
                                <div style={{ margin: "-1.25rem -1.5rem" }}>
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th style={{ width: "160px" }}>Thời gian</th>
                                                <th>Hoạt động</th>
                                                <th style={{ width: "150px" }}>Người thực hiện</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {logs.map((log) => (
                                                <tr key={log.id}>
                                                    <td style={{ color: "var(--color-text-muted)", fontSize: "0.8rem" }}>{formatDate(log.createdAt)}</td>
                                                    <td>
                                                        <div style={{ fontWeight: 600 }}>{log.action}</div>
                                                        {log.note && <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "0.25rem" }}>{log.note}</div>}
                                                    </td>
                                                    <td>{log.actorName || "Hệ thống"}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar Info - Project Styled */}
                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                    <div className="card">
                        <div className="card-body" style={{ background: "#f8fafc", borderBottom: "1px solid var(--color-border)" }}>
                            <h3 style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", color: "var(--color-primary)" }}>
                                Thông tin cơ bản
                            </h3>
                        </div>
                        <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                            <div>
                                <label className="form-label" style={{ fontSize: "0.7rem", color: "var(--color-text-muted)" }}>Cư dân</label>
                                <div style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                    <User size={16} /> {request.residentName || "N/A"}
                                </div>
                            </div>
                            <div>
                                <label className="form-label" style={{ fontSize: "0.7rem", color: "var(--color-text-muted)" }}>Danh mục</label>
                                <div style={{ fontWeight: 600 }}>{request.categoryName || "Khác"}</div>
                            </div>
                            <div>
                                <label className="form-label" style={{ fontSize: "0.7rem", color: "var(--color-text-muted)" }}>Mức độ ưu tiên</label>
                                <div style={{ fontWeight: 800, color: p.color }}>{p.label}</div>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-body" style={{ background: "#f8fafc", borderBottom: "1px solid var(--color-border)" }}>
                            <h3 style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", color: "var(--color-primary)" }}>
                                Trình trạng xử lý
                            </h3>
                        </div>
                        <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                            <div>
                                <label className="form-label" style={{ fontSize: "0.7rem", color: "var(--color-text-muted)" }}>Nhân viên kỹ thuật</label>
                                <div style={{ fontWeight: 700, color: request.assignedStaffName ? "var(--color-text)" : "var(--color-primary)" }}>
                                    {request.assignedStaffName || "Chưa phân công"}
                                </div>
                            </div>
                            <div>
                                <label className="form-label" style={{ fontSize: "0.7rem", color: "var(--color-text-muted)" }}>Thời gian mong muốn</label>
                                <div style={{ fontSize: "0.9rem", color: "var(--color-text)" }}>
                                    {formatDate(request.desiredTime)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals - Using Project Modal Classes */}
            {isAssignModalOpen && (
                <div className="modal-overlay">
                    <div className="card" style={{ width: "100%", maxWidth: "450px" }}>
                        <div className="card-body" style={{ background: "#f8fafc", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between" }}>
                            <h3 style={{ fontWeight: 700 }}>Phân công nhân viên</h3>
                            <button onClick={() => setIsAssignModalOpen(false)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                                <X size={20} color="var(--color-text-muted)" />
                            </button>
                        </div>
                        <div className="card-body">
                            <div className="form-group">
                                <label className="form-label">Mã nhân viên (Staff ID)</label>
                                <input 
                                    type="text" 
                                    className="form-input" 
                                    placeholder="Nhập mã nhân viên phụ trách..."
                                    value={assignStaffId}
                                    onChange={(e) => setAssignStaffId(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="card-body" style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", background: "#f8fafc", borderTop: "1px solid var(--color-border)" }}>
                            <button className="btn btn-ghost" onClick={() => setIsAssignModalOpen(false)}>Hủy</button>
                            <button className="btn btn-primary" onClick={handleAssign} disabled={isAssigning || !assignStaffId}>
                                {isAssigning ? "Đang xử lý..." : "Xác nhận giao việc"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isCancelModalOpen && (
                <div className="modal-overlay">
                    <div className="card" style={{ width: "100%", maxWidth: "450px" }}>
                        <div className="card-body" style={{ background: "#f8fafc", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between" }}>
                            <h3 style={{ fontWeight: 700, color: "var(--color-danger)" }}>Huỷ yêu cầu bảo trì</h3>
                            <button onClick={() => setIsCancelModalOpen(false)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                                <X size={20} color="var(--color-text-muted)" />
                            </button>
                        </div>
                        <div className="card-body">
                            <div className="form-group">
                                <label className="form-label">Lý do huỷ bộ</label>
                                <textarea 
                                    className="form-textarea" 
                                    rows="4"
                                    placeholder="Vui lòng nhập lý do để cư dân theo dõi..."
                                    value={cancelReason}
                                    onChange={(e) => setCancelReason(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="card-body" style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", background: "#f8fafc", borderTop: "1px solid var(--color-border)" }}>
                            <button className="btn btn-ghost" onClick={() => setIsCancelModalOpen(false)}>Đóng</button>
                            <button className="btn btn-danger" onClick={handleCancel} disabled={isCanceling || !cancelReason}>
                                {isCanceling ? "Đang xử lý..." : "Xác nhận huỷ"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .maintenance-detail-container {
                    animation: fadeIn 0.3s ease-in-out;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(5px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
