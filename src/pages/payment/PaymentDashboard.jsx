import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Activity, CheckCircle2, Clock, XCircle, Wallet, Ban } from "lucide-react";
import paymentApi from "../../api/paymentApi";

const fmt = (n) => Number(n).toLocaleString("vi-VN") + " ₫";
const PAGE_SIZE = 10;

const STATUS_CONFIG = {
  PENDING:   { label: "Đang chờ",   color: "#f59e0b", bg: "#fef3c7", border: "#fcd34d" },
  SUCCESS:   { label: "Thành công", color: "#10b981", bg: "#d1fae5", border: "#6ee7b7" },
};

// ── SVG Donut chart ────────────────────────────────────────────────────────
function DonutChart({ success, pending, failed, cancelled }) {
  const total = success + pending + failed + cancelled;
  if (total === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "32px 0", color: "#94a3b8" }}>
        <div style={{ fontSize: "32px", marginBottom: "8px" }}>📊</div>
        <div style={{ fontSize: "13px" }}>Không có dữ liệu</div>
      </div>
    );
  }

  const cx = 90, cy = 90, r = 72, rInner = 42;
  const toRad = (deg) => (deg * Math.PI) / 180;

  const segments = [
    { value: success,   color: "#10b981", label: "Thành công" },
    { value: pending,   color: "#f59e0b", label: "Đang chờ"   },
  ].filter((s) => s.value > 0);

  let currentAngle = 0;
  const paths = segments.map((seg) => {
    const angle = (seg.value / total) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;
    if (angle >= 360) {
      return <circle key={seg.label} cx={cx} cy={cy} r={r} fill={seg.color} />;
    }
    const x1 = cx + r * Math.sin(toRad(startAngle));
    const y1 = cy - r * Math.cos(toRad(startAngle));
    const x2 = cx + r * Math.sin(toRad(endAngle));
    const y2 = cy - r * Math.cos(toRad(endAngle));
    return (
      <path
        key={seg.label}
        d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${angle > 180 ? 1 : 0} 1 ${x2} ${y2} Z`}
        fill={seg.color}
      />
    );
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
      <svg width="180" height="180" viewBox="0 0 180 180">
        {paths}
        <circle cx={cx} cy={cy} r={rInner} fill="white" />
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize="15" fontWeight="700" fill="#0f172a">
          {((success / total) * 100).toFixed(0)}%
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontSize="11" fill="#64748b">thành công</text>
      </svg>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 20px", justifyContent: "center", fontSize: "12px" }}>
        {[
          { label: "Thành công", value: success,   color: "#10b981" },
          { label: "Đang chờ",   value: pending,   color: "#f59e0b" },
        ].map((item) => (
          <span key={item.label} style={{ display: "flex", alignItems: "center", gap: "5px", color: "#374151" }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: item.color, display: "inline-block", flexShrink: 0 }} />
            {item.label}: <strong style={{ color: item.color }}>{item.value}</strong>
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Bar chart — doanh thu theo tháng ──────────────────────────────────────
function MonthlyRevenueChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div style={{ color: "#94a3b8", textAlign: "center", padding: "32px 0", fontSize: "13px" }}>
        Không có dữ liệu doanh thu
      </div>
    );
  }
  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);
  const BAR_MAX_HEIGHT = 120;
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: "12px", height: `${BAR_MAX_HEIGHT + 60}px`, paddingBottom: "0" }}>
      {data.map((item) => {
        const hasRevenue = item.revenue > 0;
        const barH = hasRevenue ? Math.max((item.revenue / maxRevenue) * BAR_MAX_HEIGHT, 8) : 0;
        const label = item.month.replace(/^(\d{4})-(\d{2})$/, "T$2/$1");
        return (
          <div key={item.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", gap: "0" }}>
            {/* Revenue label above bar */}
            <div style={{ fontSize: "11px", color: "#374151", fontWeight: 600, whiteSpace: "nowrap", marginBottom: "4px", minHeight: "16px", textAlign: "center" }}>
              {hasRevenue ? `${(item.revenue / 1_000_000).toFixed(1)}M` : "—"}
            </div>
            {/* Bar */}
            <div
              style={{
                width: "100%", height: `${barH}px`,
                background: "#1e293b",
                borderRadius: "4px 4px 0 0",
                minWidth: "24px",
                visibility: hasRevenue ? "visible" : "hidden",
              }}
              title={`${label}: ${fmt(item.revenue)} · ${item.count} GD`}
            />
            {/* Baseline */}
            <div style={{ width: "100%", height: "1px", background: "#e2e8f0" }} />
            {/* Month label */}
            <div style={{ fontSize: "11px", color: "#64748b", whiteSpace: "nowrap", marginTop: "5px", textAlign: "center" }}>
              {label}
            </div>
            <div style={{ fontSize: "10px", color: "#94a3b8", textAlign: "center" }}>{item.count} GD</div>
          </div>
        );
      })}
    </div>
  );
}

// ── Toast ──────────────────────────────────────────────────────────────────
function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div style={{
      position: "fixed", top: "20px", right: "20px", zIndex: 9999,
      background: toast.type === "error" ? "#ef4444" : "#10b981",
      color: "#fff", padding: "12px 20px", borderRadius: "10px",
      fontWeight: 600, fontSize: "14px", boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
      display: "flex", alignItems: "center", gap: "8px",
    }}>
      {toast.type === "error" ? "✕" : "✓"} {toast.message}
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function PaymentDashboard() {
  const navigate = useNavigate();
  const now = new Date();

  // ── Shared month/year filter ──
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  // ── Stats ──
  const [stats, setStats] = useState(null);
  const [yearlyStats, setYearlyStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // ── Transactions ──
  const [transactions, setTransactions] = useState([]);
  const [txLoading, setTxLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [billIdInput, setBillIdInput] = useState("");
  const [billIdFilter, setBillIdFilter] = useState("");

  // ── Actions ──
  const [syncingSet, setSyncingSet] = useState(new Set());
  const [confirmModal, setConfirmModal] = useState(null);
  const [confirmReason, setConfirmReason] = useState("");
  const [confirmLoading, setConfirmLoading] = useState(false);

  // ── Toast ──
  const [toast, setToast] = useState(null);
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Fetch stats ──
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await paymentApi.getStatistics({ month, year });
      const result = res.data.result;
      setStats(result);

      // Build full-year monthly revenue by fetching each month in parallel
      const maxMonth = 12;
      const monthRequests = Array.from({ length: maxMonth }, (_, i) =>
        paymentApi.getStatistics({ month: i + 1, year }).then((r) => ({
          month: `${year}-${String(i + 1).padStart(2, "0")}`,
          revenue: r.data.result?.totalRevenue ?? 0,
          count: r.data.result?.totalTransactions ?? 0,
        }))
      );
      const monthlyRevenue = await Promise.all(monthRequests);
      setYearlyStats({ monthlyRevenue });
    } catch {
      showToast("Không thể tải thống kê thanh toán", "error");
    } finally {
      setStatsLoading(false);
    }
  }, [month, year]);

  // ── Fetch transactions ──
  const fetchTransactions = useCallback(async () => {
    setTxLoading(true);
    try {
      const params = { page, size: PAGE_SIZE, month, year };
      if (statusFilter) params.status = statusFilter;
      if (billIdFilter.trim()) params.billId = billIdFilter.trim();
      const res = await paymentApi.getTransactions(params);
      const data = res.data;
      setTransactions(data.result.content || []);
      setTotalPages(data.result.totalPages || 0);
      setTotalElements(data.result.totalElements || 0);
    } catch {
      showToast("Không thể tải danh sách giao dịch", "error");
    } finally {
      setTxLoading(false);
    }
  }, [page, month, year, statusFilter, billIdFilter]);

  // Reset page khi month/year thay đổi
  useEffect(() => { setPage(0); }, [month, year]);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  // ── Sync ──
  const handleSync = async (orderCode) => {
    setSyncingSet((prev) => new Set(prev).add(orderCode));
    try {
      await paymentApi.syncTransaction(orderCode);
      showToast(`Đã đồng bộ giao dịch #${orderCode}`);
      fetchTransactions();
    } catch {
      showToast(`Đồng bộ #${orderCode} thất bại`, "error");
    } finally {
      setSyncingSet((prev) => { const n = new Set(prev); n.delete(orderCode); return n; });
    }
  };

  // ── Manual confirm ──
  const handleManualConfirm = async () => {
    if (!confirmReason.trim()) { showToast("Vui lòng nhập lý do", "error"); return; }
    setConfirmLoading(true);
    try {
      await paymentApi.manualConfirm(confirmModal.transactionId, confirmReason);
      showToast("Đã xác nhận thủ công thành công");
      setConfirmModal(null);
      setConfirmReason("");
      fetchTransactions();
    } catch {
      showToast("Xác nhận thất bại", "error");
    } finally {
      setConfirmLoading(false);
    }
  };

  // ── Stat cards ──
  const statCards = stats ? [
    { label: "Tổng giao dịch",  value: stats.totalTransactions, color: "#3b82f6", iconBg: "#eff6ff",  Icon: Activity      },
    { label: "Thành công",      value: stats.successCount,      color: "#10b981", iconBg: "#dcfce7",  Icon: CheckCircle2  },
    { label: "Đang chờ duyệt",  value: stats.pendingCount,      color: "#f59e0b", iconBg: "#fef3c7",  Icon: Clock         },
    { label: "Tổng doanh thu theo tháng",  value: fmt(stats.totalRevenue), color: "#8b5cf6", iconBg: "#f3e8ff",  Icon: Wallet        },
  ] : [];

  const card = {
    background: "#fff",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    padding: "24px",
  };

  return (
    <div style={{ padding: "24px", fontFamily: "'Be Vietnam Pro','Segoe UI',sans-serif" }}>
      <Toast toast={toast} />

      {/* ── Page header ── */}
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#0f172a", margin: 0 }}>
          Quản lý giao dịch
        </h1>
        <p style={{ color: "#64748b", fontSize: "14px", margin: "4px 0 0" }}>
          Thống kê và danh sách giao dịch theo tháng
        </p>
      </div>

      {/* ── Shared filter: tháng / năm ── */}
      <div style={{ ...card, padding: "16px 20px", marginBottom: "20px", display: "flex", gap: "12px", alignItems: "flex-end", flexWrap: "wrap" }}>
        <div>
          <label style={labelStyle}>THÁNG</label>
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))} style={selectStyle}>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle}>NĂM</label>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))} style={selectStyle}>
            {[2024, 2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <button
          onClick={() => { fetchStats(); fetchTransactions(); }}
          style={{ padding: "9px 22px", background: "#1d4ed8", color: "#fff", border: "none", borderRadius: "8px", fontWeight: 600, fontSize: "14px", cursor: "pointer", fontFamily: "inherit" }}
        >
          Xem thống kê
        </button>
        <span style={{ fontSize: "12px", color: "#94a3b8", alignSelf: "center" }}>
          Đang xem: Tháng {month}/{year}
        </span>
      </div>

      {/* ── Stats section ── */}
      {statsLoading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#94a3b8", fontSize: "14px" }}>Đang tải thống kê...</div>
      ) : stats ? (
        <>
          {/* Stat cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(175px,1fr))", gap: "16px", marginBottom: "20px" }}>
            {statCards.map((c) => (
              <div key={c.label} style={{ background: "#fff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "20px", display: "flex", alignItems: "center", gap: "16px" }}>
                <div style={{ background: c.iconBg, borderRadius: "12px", padding: "12px", color: c.color, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <c.Icon size={22} strokeWidth={2} />
                </div>
                <div>
                  <div style={{ fontSize: "24px", fontWeight: 700, color: "#0f172a", lineHeight: 1 }}>{c.value}</div>
                  <div style={{ fontSize: "12px", color: "#64748b", marginTop: "5px" }}>{c.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
            <div style={card}>
              <div style={{ fontWeight: 700, fontSize: "14px", color: "#0f172a", marginBottom: "4px" }}>Tỷ lệ giao dịch theo trạng thái</div>
              <div style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "20px" }}>Tổng {stats.totalTransactions} giao dịch</div>
              <DonutChart success={stats.successCount} pending={stats.pendingCount} failed={stats.failedCount} cancelled={stats.cancelledCount} />
            </div>
            <div style={card}>
              <div style={{ fontWeight: 700, fontSize: "14px", color: "#0f172a", marginBottom: "4px" }}>Doanh thu theo tháng</div>
              <div style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "20px" }}>
                Tổng: <strong style={{ color: "#0f172a" }}>{fmt(stats.totalRevenue)}</strong>
              </div>
              <MonthlyRevenueChart data={yearlyStats?.monthlyRevenue} />
            </div>
          </div>
        </>
      ) : null}

      {/* ── Transaction list section ── */}
      <div style={card}>
        {/* Section header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: "16px", color: "#0f172a" }}>
              Danh sách giao dịch
              <span style={{ marginLeft: "8px", background: "#f1f5f9", color: "#64748b", borderRadius: "20px", padding: "2px 10px", fontSize: "12px", fontWeight: 600 }}>
                {totalElements}
              </span>
            </div>
            <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>Tháng {month}/{year}</div>
          </div>
          <button
            onClick={fetchTransactions}
            style={{ display: "flex", alignItems: "center", gap: "6px", padding: "7px 14px", background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: "8px", fontSize: "13px", fontWeight: 600, cursor: "pointer", color: "#374151", fontFamily: "inherit" }}
          >
            ↻ Làm mới
          </button>
        </div>

        {/* Transaction-specific filters */}
        <div style={{ display: "flex", gap: "10px", alignItems: "flex-end", flexWrap: "wrap", marginBottom: "16px", paddingBottom: "16px", borderBottom: "1px solid #f1f5f9" }}>
          <div style={{ flex: 1, minWidth: "180px" }}>
            <label style={labelStyle}>MÃ HÓA ĐƠN</label>
            <input
              value={billIdInput}
              onChange={(e) => setBillIdInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { setBillIdFilter(billIdInput); setPage(0); } }}
              placeholder="Nhập Bill ID..."
              style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #e2e8f0", borderRadius: "8px", fontSize: "14px", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
            />
          </div>
          <div style={{ minWidth: "160px" }}>
            <label style={labelStyle}>TRẠNG THÁI</label>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
              style={{ ...selectStyle, width: "100%" }}
            >
              <option value="">Tất cả</option>
              <option value="PENDING">Đang chờ</option>
              <option value="SUCCESS">Thành công</option>
            </select>
          </div>
          <button
            onClick={() => { setBillIdFilter(billIdInput); setPage(0); }}
            style={{ padding: "8px 18px", background: "#1d4ed8", color: "#fff", border: "none", borderRadius: "8px", fontWeight: 600, fontSize: "14px", cursor: "pointer", fontFamily: "inherit" }}
          >
            Lọc
          </button>
          <button
            onClick={() => { setStatusFilter(""); setBillIdInput(""); setBillIdFilter(""); setPage(0); }}
            style={{ padding: "8px 14px", background: "#f1f5f9", color: "#374151", border: "1.5px solid #e2e8f0", borderRadius: "8px", fontWeight: 600, fontSize: "14px", cursor: "pointer", fontFamily: "inherit" }}
          >
            Xóa lọc
          </button>
        </div>

        {/* Table */}
        {txLoading ? (
          <div style={{ padding: "48px", textAlign: "center", color: "#94a3b8", fontSize: "14px" }}>Đang tải...</div>
        ) : transactions.length === 0 ? (
          <div style={{ padding: "48px", textAlign: "center", color: "#94a3b8" }}>
            <div style={{ fontSize: "32px", marginBottom: "10px" }}>📭</div>
            <div style={{ fontWeight: 600, fontSize: "14px" }}>Không có giao dịch nào trong tháng {month}/{year}</div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  {["ID Giao dịch", "Mã hóa đơn", "Số tiền", "Trạng thái", "Order Code", "Thao tác"].map((h) => (
                    <th key={h} style={{ padding: "11px 14px", textAlign: "left", fontSize: "11px", fontWeight: 600, color: "#64748b", letterSpacing: "0.5px", borderBottom: "1px solid #e2e8f0", whiteSpace: "nowrap" }}>
                      {h.toUpperCase()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => {
                  const sc = STATUS_CONFIG[tx.status] || { label: tx.status, color: "#64748b", bg: "#f1f5f9", border: "#cbd5e1" };
                  const isSyncing = syncingSet.has(tx.orderCode);
                  return (
                    <tr
                      key={tx.id}
                      style={{ borderBottom: "1px solid #f8fafc" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                    >
                      <td style={{ padding: "13px 14px", fontFamily: "monospace", fontSize: "12px", color: "#0f172a", maxWidth: "150px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={tx.id}>
                        {tx.id}
                      </td>
                      <td style={{ padding: "13px 14px", fontFamily: "monospace", fontSize: "12px", color: "#64748b", maxWidth: "150px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={tx.billId}>
                        {tx.billId}
                      </td>
                      <td style={{ padding: "13px 14px", fontWeight: 700, color: "#0f172a", whiteSpace: "nowrap" }}>
                        {fmt(tx.amount)}
                      </td>
                      <td style={{ padding: "13px 14px" }}>
                        <span style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, borderRadius: "6px", padding: "3px 10px", fontSize: "11px", fontWeight: 700, whiteSpace: "nowrap" }}>
                          {sc.label}
                        </span>
                      </td>
                      <td style={{ padding: "13px 14px", fontFamily: "monospace", fontSize: "12px", color: "#64748b" }}>
                        {tx.orderCode}
                      </td>
                      <td style={{ padding: "13px 14px" }}>
                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                          <button
                            onClick={() => navigate(`/payment/detail/${tx.id}`)}
                            style={{ padding: "4px 10px", background: "#f8fafc", color: "#374151", border: "1px solid #e2e8f0", borderRadius: "6px", fontSize: "12px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}
                          >
                            👁 Chi tiết
                          </button>
                          {tx.status === "PENDING" && (
                            <button
                              onClick={() => { setConfirmModal({ transactionId: tx.id }); setConfirmReason(""); }}
                              style={{ padding: "4px 10px", background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", borderRadius: "6px", fontSize: "12px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}
                            >
                              ✓ Xác nhận
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalElements > 0 && (
          <div style={{ padding: "14px 0 0", borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
            <span style={{ fontSize: "13px", color: "#64748b" }}>
              Trang {page + 1} / {totalPages || 1} &nbsp;·&nbsp; {totalElements} giao dịch
            </span>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                style={{ padding: "6px 14px", border: "1.5px solid #e2e8f0", borderRadius: "8px", background: "#fff", cursor: page === 0 ? "not-allowed" : "pointer", opacity: page === 0 ? 0.5 : 1, fontSize: "13px", fontWeight: 600, fontFamily: "inherit" }}
              >
                ← Trước
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                style={{ padding: "6px 14px", border: "1.5px solid #e2e8f0", borderRadius: "8px", background: "#fff", cursor: page >= totalPages - 1 ? "not-allowed" : "pointer", opacity: page >= totalPages - 1 ? 0.5 : 1, fontSize: "13px", fontWeight: 600, fontFamily: "inherit" }}
              >
                Sau →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Manual Confirm Modal ── */}
      {confirmModal && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={(e) => { if (e.target === e.currentTarget) { setConfirmModal(null); setConfirmReason(""); } }}
        >
          <div style={{ background: "#fff", borderRadius: "12px", padding: "28px", width: "440px", maxWidth: "90vw", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ fontWeight: 700, fontSize: "17px", color: "#0f172a", marginBottom: "6px" }}>Xác nhận thủ công</div>
            <div style={{ color: "#64748b", fontSize: "13px", marginBottom: "16px", lineHeight: "1.6" }}>
              Hành động này sẽ đánh dấu giao dịch là <strong style={{ color: "#10b981" }}>THÀNH CÔNG</strong>. Vui lòng nhập lý do.
            </div>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>LÝ DO *</label>
            <textarea
              value={confirmReason}
              onChange={(e) => setConfirmReason(e.target.value)}
              placeholder="VD: Khách hàng đã gửi biên lai chuyển khoản..."
              rows={3}
              style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #e2e8f0", borderRadius: "8px", fontSize: "14px", outline: "none", resize: "vertical", fontFamily: "inherit", boxSizing: "border-box" }}
            />
            <div style={{ display: "flex", gap: "10px", marginTop: "20px", justifyContent: "flex-end" }}>
              <button onClick={() => { setConfirmModal(null); setConfirmReason(""); }} style={{ padding: "9px 20px", background: "#f1f5f9", color: "#374151", border: "1.5px solid #e2e8f0", borderRadius: "8px", fontWeight: 600, fontSize: "14px", cursor: "pointer", fontFamily: "inherit" }}>
                Hủy
              </button>
              <button onClick={handleManualConfirm} disabled={confirmLoading} style={{ padding: "9px 20px", background: "#10b981", color: "#fff", border: "none", borderRadius: "8px", fontWeight: 600, fontSize: "14px", cursor: confirmLoading ? "not-allowed" : "pointer", opacity: confirmLoading ? 0.7 : 1, fontFamily: "inherit" }}>
                {confirmLoading ? "Đang xử lý..." : "✓ Xác nhận"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Style constants ────────────────────────────────────────────────────────
const labelStyle = {
  fontSize: "11px", fontWeight: 600, color: "#64748b",
  letterSpacing: "0.5px", display: "block", marginBottom: "6px",
};
const selectStyle = {
  padding: "9px 14px", border: "1.5px solid #e2e8f0", borderRadius: "8px",
  fontSize: "14px", outline: "none", background: "#fff", color: "#0f172a",
  fontFamily: "inherit",
};
