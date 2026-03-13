import { useState, useEffect, useCallback } from "react";
import paymentApi from "../../api/paymentApi";

const fmt = (n) => Number(n).toLocaleString("vi-VN") + " ₫";

// ── SVG Donut / Pie Chart ──────────────────────────────────────────────────
function PieChart({ paid, unpaid }) {
  const total = paid + unpaid;
  if (total === 0) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "32px 0",
          color: "#94a3b8",
        }}
      >
        <div style={{ fontSize: "32px", marginBottom: "8px" }}>📊</div>
        <div style={{ fontSize: "13px" }}>Không có dữ liệu</div>
      </div>
    );
  }

  const cx = 90;
  const cy = 90;
  const r = 72;
  const rInner = 40;
  const paidPct = (paid / total) * 100;

  // Full circle edge case
  if (paid === 0) {
    return (
      <ChartLegend>
        <svg width="180" height="180" viewBox="0 0 180 180">
          <circle cx={cx} cy={cy} r={r} fill="#ef4444" />
          <circle cx={cx} cy={cy} r={rInner} fill="white" />
          <text x={cx} y={cy - 6} textAnchor="middle" fontSize="14" fontWeight="700" fill="#0f172a">0%</text>
          <text x={cx} y={cy + 12} textAnchor="middle" fontSize="11" fill="#64748b">đã TT</text>
        </svg>
        <Legend paid={paid} unpaid={unpaid} paidPct={0} />
      </ChartLegend>
    );
  }
  if (unpaid === 0) {
    return (
      <ChartLegend>
        <svg width="180" height="180" viewBox="0 0 180 180">
          <circle cx={cx} cy={cy} r={r} fill="#10b981" />
          <circle cx={cx} cy={cy} r={rInner} fill="white" />
          <text x={cx} y={cy - 6} textAnchor="middle" fontSize="14" fontWeight="700" fill="#0f172a">100%</text>
          <text x={cx} y={cy + 12} textAnchor="middle" fontSize="11" fill="#64748b">đã TT</text>
        </svg>
        <Legend paid={paid} unpaid={unpaid} paidPct={100} />
      </ChartLegend>
    );
  }

  const toRad = (deg) => (deg * Math.PI) / 180;
  const paidAngle = (paid / total) * 360;

  const x1 = cx + r * Math.sin(toRad(0));
  const y1 = cy - r * Math.cos(toRad(0));
  const x2 = cx + r * Math.sin(toRad(paidAngle));
  const y2 = cy - r * Math.cos(toRad(paidAngle));
  const largeArc = paidAngle > 180 ? 1 : 0;

  // Outer arcs
  const paidPath = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
  const unpaidPath = `M ${cx} ${cy} L ${x2} ${y2} A ${r} ${r} 0 ${1 - largeArc} 1 ${x1} ${y1} Z`;

  return (
    <ChartLegend>
      <svg width="180" height="180" viewBox="0 0 180 180">
        <path d={paidPath} fill="#10b981" />
        <path d={unpaidPath} fill="#ef4444" />
        <circle cx={cx} cy={cy} r={rInner} fill="white" />
        <text
          x={cx}
          y={cy - 6}
          textAnchor="middle"
          fontSize="14"
          fontWeight="700"
          fill="#0f172a"
        >
          {paidPct.toFixed(0)}%
        </text>
        <text
          x={cx}
          y={cy + 12}
          textAnchor="middle"
          fontSize="11"
          fill="#64748b"
        >
          đã TT
        </text>
      </svg>
      <Legend paid={paid} unpaid={unpaid} paidPct={paidPct} />
    </ChartLegend>
  );
}

function ChartLegend({ children }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "16px",
      }}
    >
      {children}
    </div>
  );
}

function Legend({ paid, unpaid, paidPct }) {
  return (
    <div style={{ display: "flex", gap: "20px", fontSize: "13px" }}>
      <span style={{ display: "flex", alignItems: "center", gap: "7px" }}>
        <span
          style={{
            width: 12,
            height: 12,
            borderRadius: "50%",
            background: "#10b981",
            display: "inline-block",
          }}
        />
        Đã TT: {paid} ({paidPct.toFixed(1)}%)
      </span>
      <span style={{ display: "flex", alignItems: "center", gap: "7px" }}>
        <span
          style={{
            width: 12,
            height: 12,
            borderRadius: "50%",
            background: "#ef4444",
            display: "inline-block",
          }}
        />
        Chưa TT: {unpaid} ({(100 - paidPct).toFixed(1)}%)
      </span>
    </div>
  );
}

// ── Bar chart (transaction status breakdown) ───────────────────────────────
function TransactionBars({ success, failed, cancelled }) {
  const total = success + failed + cancelled;
  if (total === 0) {
    return (
      <div
        style={{
          color: "#94a3b8",
          textAlign: "center",
          padding: "32px 0",
          fontSize: "13px",
        }}
      >
        Không có giao dịch trong kỳ này
      </div>
    );
  }

  const bars = [
    { label: "Thành công", value: success, color: "#10b981" },
    { label: "Thất bại", value: failed, color: "#ef4444" },
    { label: "Đã hủy", value: cancelled, color: "#94a3b8" },
  ];
  const max = Math.max(success, failed, cancelled, 1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
      {bars.map((bar) => (
        <div key={bar.label}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "7px",
              fontSize: "13px",
            }}
          >
            <span style={{ color: "#374151", fontWeight: 600 }}>
              {bar.label}
            </span>
            <span style={{ color: bar.color, fontWeight: 700 }}>
              {bar.value}
            </span>
          </div>
          <div
            style={{
              background: "#f1f5f9",
              borderRadius: "6px",
              height: "10px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                background: bar.color,
                width: `${(bar.value / max) * 100}%`,
                height: "100%",
                borderRadius: "6px",
                transition: "width 0.6s ease",
              }}
            />
          </div>
        </div>
      ))}
      <div
        style={{
          fontSize: "12px",
          color: "#94a3b8",
          textAlign: "right",
          marginTop: "4px",
        }}
      >
        Tổng: {total} giao dịch
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function PaymentDashboard() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await paymentApi.getStatistics({ month, year });
      setStats(res.data);
    } catch {
      showToast("Không thể tải thống kê thanh toán");
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Top stat cards
  const statCards = stats
    ? [
        {
          label: "Tổng hóa đơn",
          value: stats.totalBills,
          color: "#3b82f6",
          bg: "#eff6ff",
          icon: "🧾",
        },
        {
          label: "Đã thanh toán",
          value: stats.paidBills,
          color: "#10b981",
          bg: "#f0fdf4",
          icon: "✅",
        },
        {
          label: "Chưa thanh toán",
          value: stats.unpaidBills,
          color: "#ef4444",
          bg: "#fef2f2",
          icon: "⏳",
        },
        {
          label: "Tổng doanh thu",
          value: fmt(stats.totalRevenue),
          color: "#8b5cf6",
          bg: "#f5f3ff",
          icon: "💰",
        },
        {
          label: "Đang chờ thanh toán",
          value: fmt(stats.pendingAmount),
          color: "#f59e0b",
          bg: "#fffbeb",
          icon: "🕐",
        },
      ]
    : [];

  return (
    <div
      style={{
        padding: "24px",
        fontFamily: "'Be Vietnam Pro', 'Segoe UI', sans-serif",
      }}
    >
      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            zIndex: 9999,
            background: toast.type === "error" ? "#ef4444" : "#10b981",
            color: "#fff",
            padding: "12px 20px",
            borderRadius: "10px",
            fontWeight: 600,
            fontSize: "14px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          }}
        >
          {toast.message}
        </div>
      )}

      {/* Page header */}
      <div style={{ marginBottom: "24px" }}>
        <h1
          style={{
            fontSize: "22px",
            fontWeight: 700,
            color: "#0f172a",
            margin: 0,
          }}
        >
          Dashboard Thanh Toán
        </h1>
        <p
          style={{
            color: "#64748b",
            fontSize: "14px",
            margin: "4px 0 0",
          }}
        >
          Thống kê tổng quan hệ thống thanh toán theo tháng
        </p>
      </div>

      {/* Month / Year filter */}
      <div
        style={{
          background: "#fff",
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
          padding: "16px 20px",
          marginBottom: "20px",
          display: "flex",
          gap: "12px",
          alignItems: "flex-end",
          flexWrap: "wrap",
        }}
      >
        <div>
          <label
            style={{
              fontSize: "11px",
              fontWeight: 600,
              color: "#64748b",
              letterSpacing: "0.5px",
              display: "block",
              marginBottom: "6px",
            }}
          >
            THÁNG
          </label>
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            style={{
              padding: "9px 14px",
              border: "1.5px solid #e2e8f0",
              borderRadius: "8px",
              fontSize: "14px",
              outline: "none",
              background: "#fff",
              color: "#0f172a",
              fontFamily: "inherit",
            }}
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                Tháng {i + 1}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            style={{
              fontSize: "11px",
              fontWeight: 600,
              color: "#64748b",
              letterSpacing: "0.5px",
              display: "block",
              marginBottom: "6px",
            }}
          >
            NĂM
          </label>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            style={{
              padding: "9px 14px",
              border: "1.5px solid #e2e8f0",
              borderRadius: "8px",
              fontSize: "14px",
              outline: "none",
              background: "#fff",
              color: "#0f172a",
              fontFamily: "inherit",
            }}
          >
            {[2024, 2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={fetchStats}
          style={{
            padding: "9px 22px",
            background: "#1d4ed8",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            fontWeight: 600,
            fontSize: "14px",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Xem thống kê
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div
          style={{
            textAlign: "center",
            padding: "80px",
            color: "#94a3b8",
            fontSize: "14px",
          }}
        >
          Đang tải thống kê...
        </div>
      ) : stats ? (
        <>
          {/* Stat cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
              gap: "16px",
              marginBottom: "24px",
            }}
          >
            {statCards.map((card) => (
              <div
                key={card.label}
                style={{
                  background: card.bg,
                  borderRadius: "12px",
                  border: `1px solid ${card.color}22`,
                  padding: "20px",
                }}
              >
                <div
                  style={{
                    fontSize: "20px",
                    marginBottom: "8px",
                  }}
                >
                  {card.icon}
                </div>
                <div
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "#64748b",
                    letterSpacing: "0.5px",
                    marginBottom: "6px",
                  }}
                >
                  {card.label.toUpperCase()}
                </div>
                <div
                  style={{
                    fontSize: "22px",
                    fontWeight: 700,
                    color: card.color,
                  }}
                >
                  {card.value}
                </div>
              </div>
            ))}
          </div>

          {/* Charts row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
            }}
          >
            {/* Pie chart — PAID/UNPAID */}
            <div
              style={{
                background: "#fff",
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                padding: "24px",
              }}
            >
              <div
                style={{
                  fontWeight: 700,
                  fontSize: "14px",
                  color: "#0f172a",
                  marginBottom: "6px",
                }}
              >
                Tỷ lệ thanh toán
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: "#94a3b8",
                  marginBottom: "20px",
                }}
              >
                Tháng {month}/{year}
              </div>
              <PieChart paid={stats.paidBills} unpaid={stats.unpaidBills} />
            </div>

            {/* Bar chart — transaction status */}
            <div
              style={{
                background: "#fff",
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                padding: "24px",
              }}
            >
              <div
                style={{
                  fontWeight: 700,
                  fontSize: "14px",
                  color: "#0f172a",
                  marginBottom: "6px",
                }}
              >
                Thống kê giao dịch
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: "#94a3b8",
                  marginBottom: "20px",
                }}
              >
                Tháng {month}/{year}
              </div>
              <TransactionBars
                success={stats.successTransactions}
                failed={stats.failedTransactions}
                cancelled={stats.cancelledTransactions}
              />
            </div>
          </div>

          {/* Summary footer */}
          <div
            style={{
              marginTop: "16px",
              background: "#fff",
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
              padding: "20px 24px",
              display: "flex",
              gap: "32px",
              flexWrap: "wrap",
              fontSize: "13px",
              color: "#64748b",
            }}
          >
            <span>
              Tỷ lệ thanh toán:{" "}
              <strong style={{ color: "#10b981" }}>
                {stats.totalBills > 0
                  ? ((stats.paidBills / stats.totalBills) * 100).toFixed(1)
                  : 0}
                %
              </strong>
            </span>
            <span>
              Giao dịch thành công:{" "}
              <strong style={{ color: "#10b981" }}>
                {stats.successTransactions}
              </strong>
            </span>
            <span>
              Giao dịch thất bại:{" "}
              <strong style={{ color: "#ef4444" }}>
                {stats.failedTransactions}
              </strong>
            </span>
            <span>
              Giao dịch đã hủy:{" "}
              <strong style={{ color: "#64748b" }}>
                {stats.cancelledTransactions}
              </strong>
            </span>
          </div>
        </>
      ) : null}
    </div>
  );
}
