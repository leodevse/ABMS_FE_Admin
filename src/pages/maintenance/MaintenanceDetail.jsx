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
import { fetchUsers } from "../../services/userApi";
import { extractMaintenanceImagePreviews } from "../../utils/imageUrl";
import toast from "react-hot-toast";

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
    NORMAL: { label: "Bình thường", color: "#2563eb" },
    MEDIUM: { label: "Trung bình", color: "#d97706" },
    HIGH:   { label: "Cao",     color: "#ea580c" },
    URGENT: { label: "Khẩn cấp", color: "var(--color-danger)" },
    CRITICAL: { label: "Nghiêm trọng", color: "var(--color-danger)" }
};

const SCOPE_MAP = {
    PUBLIC: "Công cộng",
    PRIVATE: "Riêng tư",
};

const QUOTATION_STATUS_MAP = {
    DRAFT: "Nháp",
    SENT: "Đã gửi",
    APPROVED: "Đã duyệt",
    REJECTED: "Bị từ chối",
    CANCELLED: "Đã huỷ",
    EXPIRED: "Hết hạn"
};

export default function MaintenanceDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    // Data State
    const [request, setRequest] = useState(null);
    const [logs, setLogs] = useState([]);
    const [quotations, setQuotations] = useState([]);
    const [resources, setResources] = useState([]);

    // UI State
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('info');

    // Modals State
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [assignStaffId, setAssignStaffId] = useState("");
    const [assignNote, setAssignNote] = useState("");
    const [isAssigning, setIsAssigning] = useState(false);
    const [staffOptions, setStaffOptions] = useState([]);
    const [staffWorkloadMap, setStaffWorkloadMap] = useState({});

    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [cancelReason, setCancelReason] = useState("");
    const [isCanceling, setIsCanceling] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [reqRes, logsRes, quoteRes, resourcesRes] = await Promise.allSettled([
                maintenanceApi.getRequestById(id),
                maintenanceApi.getLogs(id),
                maintenanceApi.getQuotationsByRequestId(id),
                maintenanceApi.getResourcesByRequestId(id)
            ]);

            if (reqRes.status !== "fulfilled") {
                throw reqRes.reason;
            }

            setRequest(reqRes.value?.data?.result || null);
            setLogs(logsRes.status === "fulfilled" ? (logsRes.value?.data?.result || []) : []);
            setQuotations(quoteRes.status === "fulfilled" ? (quoteRes.value?.data?.result || []) : []);
            setResources(resourcesRes.status === "fulfilled" ? (resourcesRes.value?.data?.result || []) : []);
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

    useEffect(() => {
        const loadStaffOptions = async () => {
            const [userResult, workloadResult] = await Promise.allSettled([
                fetchUsers({ page: 1, size: 200, status: "ACTIVE" }),
                maintenanceApi.getStaffWorkload(),
            ]);

            if (userResult.status === "fulfilled") {
                const users = userResult.value?.result?.content || [];
                const staffs = users.filter((u) =>
                    Array.isArray(u.roles)
                    && u.roles.some((r) => {
                        const code = String(r.roleCode || "").toUpperCase();
                        const name = String(r.roleName || "").toUpperCase();
                        return code === "STAFF" || name === "STAFF" || name.includes("NHAN VIEN");
                    })
                );
                setStaffOptions(staffs);
            } else {
                setStaffOptions([]);
            }

            if (workloadResult.status === "fulfilled") {
                const workloads = workloadResult.value?.data?.result || [];
                const mapByStaffId = workloads.reduce((acc, workload) => {
                    acc[String(workload.staffId)] = workload;
                    return acc;
                }, {});
                setStaffWorkloadMap(mapByStaffId);
            } else {
                setStaffWorkloadMap({});
            }
        };

        loadStaffOptions();
    }, []);

    const openAssignModal = () => {
        setAssignStaffId(request?.staffId ? String(request.staffId) : "");
        setAssignNote("");
        setIsAssignModalOpen(true);
    };

    const handleAssign = async () => {
        if (!assignStaffId) return;
        setIsAssigning(true);
        try {
            const payload = { staffId: assignStaffId };
            const trimmedNote = assignNote.trim();
            if (trimmedNote) {
                payload.note = trimmedNote;
            }
            await maintenanceApi.assignRequest(id, payload);
            setAssignStaffId("");
            setAssignNote("");
            setIsAssignModalOpen(false);
            fetchData();
        } catch (err) {
            toast.error("Lỗi khi giao việc: " + err.message);
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
            toast.error("Lỗi khi huỷ: " + err.message);
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

    const toNumber = (value) => {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : 0;
    };

    const formatCurrency = (value) => `${toNumber(value).toLocaleString("vi-VN")} đ`;

    const getQuotationTotal = (quotation) => {
        if (quotation?.totalAmount != null) {
            return toNumber(quotation.totalAmount);
        }
        if (!Array.isArray(quotation?.items)) {
            return 0;
        }
        return quotation.items.reduce((sum, item) => {
            return sum + toNumber(item?.unitPrice) * toNumber(item?.quantity);
        }, 0);
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

    const currentStatus = request.requestStatus || request.status;
    const assignedStaffName = request.staffName || request.assignedStaffName;
    const residentName = request.requesterName || request.residentName;
    const desiredTime = request.preferredTime || request.desiredTime;
    const categoryName = request.categoryName || request.category;

    const s = STATUS_MAP[currentStatus] || { label: currentStatus, cssClass: "badge--locked" };
    const p = PRIORITY_MAP[request.priority] || { label: request.priority, color: "var(--color-text)" };
    const canAssign = ['PENDING', 'VERIFYING'].includes(currentStatus);
    const selectedStaffWorkload = assignStaffId ? staffWorkloadMap[String(assignStaffId)] : null;
    const assignLogs = logs.filter((log) => ["ASSIGN_REQUEST", "ASSIGNED_STAFF"].includes(log.action));
    const imagePreviews = extractMaintenanceImagePreviews(request, resources);

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
                        {canAssign && (
                            <>
                                <button className="btn btn-primary" onClick={openAssignModal}>
                                    <UserPlus size={16} /> {assignedStaffName ? "Giao lại" : "Giao việc"}
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
                    <div
                        className="card"
                        style={{
                            padding: "0.5rem",
                            display: "grid",
                            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                            gap: "0.5rem",
                            background: "#f8fafc"
                        }}
                    >
                        {[
                            { id: 'info', label: 'Thông tin chung', icon: FileText },
                            { id: 'quote', label: 'Báo giá', icon: DollarSign, count: quotations.length },
                            { id: 'logs', label: 'Nhật ký xử lý', icon: History, count: logs.length }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`btn ${activeTab === tab.id ? 'btn-primary' : 'btn-ghost'}`}
                                style={{ width: "100%", justifyContent: "center", whiteSpace: "nowrap" }}
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

                                    {imagePreviews.length > 0 && (
                                        <div>
                                            <h3 style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", color: "var(--color-primary)", marginBottom: "1rem" }}>
                                                Hình ảnh đính kèm
                                            </h3>
                                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "1rem" }}>
                                                {imagePreviews.map((img) => (
                                                    <a key={img.id} href={img.url} target="_blank" rel="noreferrer" className="card" style={{ position: "relative", paddingTop: "100%", overflow: "hidden" }}>
                                                        <img src={img.url} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                                                        <span
                                                            style={{
                                                                position: "absolute",
                                                                top: "0.5rem",
                                                                left: "0.5rem",
                                                                padding: "0.2rem 0.45rem",
                                                                borderRadius: "999px",
                                                                fontSize: "0.65rem",
                                                                fontWeight: 700,
                                                                background: img.uploaderRole === "STAFF" ? "rgba(3, 105, 161, 0.9)" : img.uploaderRole === "RESIDENT" ? "rgba(21, 128, 61, 0.9)" : "rgba(55, 65, 81, 0.85)",
                                                                color: "#fff",
                                                                letterSpacing: "0.02em"
                                                            }}
                                                        >
                                                            {img.uploaderRole === "STAFF" ? "Nhân viên" : img.uploaderRole === "RESIDENT" ? "Cư dân" : "Không rõ"}
                                                        </span>
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
                                                    {QUOTATION_STATUS_MAP[q.status] || q.status}
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
                                                                <td style={{ textAlign: "center" }}>{toNumber(item.quantity)}</td>
                                                                <td style={{ textAlign: "right" }}>{formatCurrency(item.unitPrice)}</td>
                                                                <td style={{ textAlign: "right", fontWeight: 600 }}>{formatCurrency(toNumber(item.unitPrice) * toNumber(item.quantity))}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                            <div className="card-body" style={{ background: "#f8fafc", textAlign: "right", borderTop: "1px solid var(--color-border)" }}>
                                                <span style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", marginRight: "1rem" }}>TỔNG CỘNG:</span>
                                                <span style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--color-primary)" }}>{formatCurrency(getQuotationTotal(q))}</span>
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
                                            {logs.map((log) => {
                                                const isAssignLog = log.action === "ASSIGN_REQUEST";
                                                return (
                                                    <tr key={log.id} style={isAssignLog ? { background: "#fefce8" } : undefined}>
                                                        <td style={{ color: "var(--color-text-muted)", fontSize: "0.8rem" }}>{formatDate(log.createdAt)}</td>
                                                        <td>
                                                            <div style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                                                {log.action}
                                                                {isAssignLog && <span className="badge badge--draft">Giao việc</span>}
                                                            </div>
                                                            {log.note && <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "0.25rem" }}>{log.note}</div>}
                                                        </td>
                                                        <td>{log.actorName || "Hệ thống"}</td>
                                                    </tr>
                                                );
                                            })}
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
                                    <User size={16} /> {residentName || "Không rõ"}
                                </div>
                            </div>
                            <div>
                                <label className="form-label" style={{ fontSize: "0.7rem", color: "var(--color-text-muted)" }}>Danh mục</label>
                                <div style={{ fontWeight: 600 }}>{categoryName || "Khác"}</div>
                            </div>
                            <div>
                                <label className="form-label" style={{ fontSize: "0.7rem", color: "var(--color-text-muted)" }}>Phạm vi</label>
                                <div style={{ fontWeight: 700 }}>{SCOPE_MAP[request.scope] || request.scope || "Không rõ"}</div>
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
                                <div style={{ fontWeight: 700, color: assignedStaffName ? "var(--color-text)" : "var(--color-primary)" }}>
                                    {assignedStaffName || "Chưa phân công"}
                                </div>
                                {canAssign && (
                                    <button
                                        className="btn btn-primary btn-sm"
                                        onClick={openAssignModal}
                                        style={{ marginTop: "0.5rem" }}
                                    >
                                        <UserPlus size={14} /> {assignedStaffName ? "Giao lại nhân viên" : "Giao việc ngay"}
                                    </button>
                                )}
                            </div>
                            <div>
                                <label className="form-label" style={{ fontSize: "0.7rem", color: "var(--color-text-muted)" }}>Thời gian mong muốn</label>
                                <div style={{ fontSize: "0.9rem", color: "var(--color-text)" }}>
                                    {formatDate(desiredTime)}
                                </div>
                            </div>
                            {assignLogs.length > 0 && (
                                <div>
                                    <label className="form-label" style={{ fontSize: "0.7rem", color: "var(--color-text-muted)" }}>Lịch sử giao việc gần nhất</label>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                                        {assignLogs.slice(0, 3).map((log) => (
                                            <div key={log.id} style={{ background: "#f8fafc", border: "1px solid var(--color-border)", borderRadius: "var(--radius)", padding: "0.625rem" }}>
                                                <div style={{ fontWeight: 600, fontSize: "0.8rem" }}>{formatDate(log.createdAt)}</div>
                                                <div style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", marginTop: "0.25rem" }}>{log.note || "Không có ghi chú"}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals - Using Project Modal Classes */}
            {isAssignModalOpen && (
                <div className="modal-overlay">
                    <div className="card" style={{ width: "100%", maxWidth: "560px" }}>
                        <div className="card-body" style={{ background: "#f8fafc", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between" }}>
                            <h3 style={{ fontWeight: 700 }}>{assignedStaffName ? "Giao lại nhân viên" : "Phân công nhân viên"}</h3>
                            <button onClick={() => setIsAssignModalOpen(false)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                                <X size={20} color="var(--color-text-muted)" />
                            </button>
                        </div>
                        <div className="card-body">
                            <div className="form-group">
                                <label className="form-label">Chọn nhân viên kỹ thuật</label>
                                <select
                                    className="form-input" 
                                    value={assignStaffId}
                                    onChange={(e) => setAssignStaffId(e.target.value)}
                                >
                                    <option value="">-- Chọn nhân viên --</option>
                                    {staffOptions.map((staff) => {
                                        const workload = staffWorkloadMap[String(staff.id)];
                                        const workloadText = workload
                                            ? ` | Đang xử lý: ${workload.inProgress || 0}, Quá hạn: ${workload.overdueCount || 0}`
                                            : "";
                                        return (
                                            <option key={staff.id} value={staff.id}>
                                                {staff.fullName} - {staff.email}{workloadText}
                                            </option>
                                        );
                                    })}
                                </select>
                                {staffOptions.length === 0 && (
                                    <div style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", marginTop: "0.4rem" }}>
                                        Chưa tải được danh sách nhân viên. Vui lòng kiểm tra tài khoản STAFF hoặc tải lại trang.
                                    </div>
                                )}
                            </div>

                            {selectedStaffWorkload && (
                                <div style={{ background: "#f8fafc", border: "1px solid var(--color-border)", borderRadius: "var(--radius)", padding: "0.9rem", marginBottom: "1rem" }}>
                                    <div style={{ fontWeight: 700, fontSize: "0.85rem", marginBottom: "0.5rem" }}>Khối lượng công việc nhân viên đã chọn</div>
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "0.5rem" }}>
                                        <div style={{ fontSize: "0.8rem" }}>Tổng đã giao: <strong>{selectedStaffWorkload.totalAssigned || 0}</strong></div>
                                        <div style={{ fontSize: "0.8rem" }}>Đang xử lý: <strong>{selectedStaffWorkload.inProgress || 0}</strong></div>
                                        <div style={{ fontSize: "0.8rem" }}>Quá hạn: <strong>{selectedStaffWorkload.overdueCount || 0}</strong></div>
                                        <div style={{ fontSize: "0.8rem" }}>Đánh giá TB: <strong>{selectedStaffWorkload.avgRating ?? "-"}</strong></div>
                                    </div>
                                </div>
                            )}

                            <div className="form-group">
                                <label className="form-label">Ghi chú giao việc (tuỳ chọn)</label>
                                <textarea
                                    className="form-textarea"
                                    rows="3"
                                    placeholder="Ví dụ: Ưu tiên xử lý trước 17h, liên hệ cư dân trước khi đến..."
                                    value={assignNote}
                                    onChange={(e) => setAssignNote(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="card-body" style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", background: "#f8fafc", borderTop: "1px solid var(--color-border)" }}>
                            <button className="btn btn-ghost" onClick={() => setIsAssignModalOpen(false)}>Hủy</button>
                            <button className="btn btn-primary" onClick={handleAssign} disabled={isAssigning || !assignStaffId}>
                                {isAssigning ? "Đang xử lý..." : assignedStaffName ? "Xác nhận giao lại" : "Xác nhận giao việc"}
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
