import { useState, useEffect, useCallback } from "react";
import paymentApi from "../../api/paymentApi";
import { fetchAllBuildings } from "../../api/buildingApi";

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (n) =>
  n != null ? Number(n).toLocaleString("vi-VN") + " ₫" : "—";

const STATUS_CONFIG = {
  UNPAID:  { label: "Chưa thanh toán", color: "#ef4444", bg: "#fee2e2", border: "#fca5a5" },
  PAID:    { label: "Đã thanh toán",   color: "#10b981", bg: "#d1fae5", border: "#6ee7b7" },
  PARTIAL: { label: "Thanh toán một phần", color: "#f59e0b", bg: "#fef3c7", border: "#fcd34d" },
};

const PAGE_SIZE = 10;

// ─── Component ────────────────────────────────────────────────────────────────
export default function AdminBillList() {
  // ── State ──
  const [bills, setBills] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Filters
  const [buildingCode, setBuildingCode] = useState("");
  const [periodCode, setPeriodCode] = useState("");
  const [status, setStatus] = useState("");
  const [periodInput, setPeriodInput] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Detail modal
  const [detailBill, setDetailBill] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // ── Toast ──
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Load buildings for dropdown ──
  useEffect(() => {
    fetchAllBuildings()
      .then((data) => {
        // API returns { result: [...] } or array directly
        const list = Array.isArray(data) ? data : (data?.result ?? []);
        setBuildings(list);
      })
      .catch(() => {});
  }, []);

  // ── Fetch bills ──
  const fetchBills = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, size: PAGE_SIZE };
      if (buildingCode) params.buildingCode = buildingCode;
      if (periodCode)   params.periodCode   = periodCode;
      if (status)       params.status       = status;

      const res = await paymentApi.getAllBills(params);
      const data = res.data?.result ?? {};
      // backend uses { data: [...], currentPage, totalPages, totalElements } (PageResponse)
      const content = data.data ?? data.content ?? [];
      setBills(content);
      setTotalPages(data.totalPages ?? 0);
      setTotalElements(data.totalElements ?? 0);
    } catch {
      showToast("Không thể tải danh sách hóa đơn", "error");
    } finally {
      setLoading(false);
    }
  }, [page, buildingCode, periodCode, status]);

  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  // ── Filters ──
  const applyFilter = () => {
    setPeriodCode(periodInput);
    setPage(1);
  };

  const clearFilter = () => {
    setBuildingCode("");
    setPeriodCode("");
    setPeriodInput("");
    setStatus("");
    setPage(1);
  };

  // ── Detail modal ──
  const openDetail = async (billId) => {
    setDetailBill({ id: billId, loading: true });
    setDetailLoading(true);
    try {
      const res = await paymentApi.getBillDetail(billId);
      setDetailBill(res.data?.result ?? null);
    } catch {
      showToast("Không thể tải chi tiết hóa đơn", "error");
      setDetailBill(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => setDetailBill(null);

  // ── Styles ──
  const card = {
    background: "#fff",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    overflow: "hidden",
  };

  const thStyle = {
    padding: "12px 16px",
    textAlign: "left",
    fontSize: "11px",
    fontWeight: 700,
    color: "#64748b",
    letterSpacing: "0.5px",
    borderBottom: "1px solid #e2e8f0",
    whiteSpace: "nowrap",
    background: "#f8fafc",
  };

  const tdStyle = {
    padding: "13px 16px",
    fontSize: "14px",
    color: "#334155",
    borderBottom: "1px solid #f1f5f9",
    verticalAlign: "middle",
  };

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: "24px", fontFamily: "'Be Vietnam Pro','Segoe UI',sans-serif" }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: "20px", right: "20px", zIndex: 9999,
          background: toast.type === "error" ? "#ef4444" : "#10b981",
          color: "#fff", padding: "12px 20px", borderRadius: "10px",
          fontWeight: 600, fontSize: "14px", boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          display: "flex", alignItems: "center", gap: "8px",
        }}>
          {toast.type === "error" ? "✕" : "✓"} {toast.message}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#0f172a", margin: 0 }}>
          Danh sách hóa đơn
        </h1>
        <p style={{ color: "#64748b", fontSize: "14px", margin: "4px 0 0" }}>
          Xem và lọc tất cả hóa đơn theo tòa nhà và kỳ thanh toán
        </p>
      </div>

      {/* Filter Bar */}
      <div style={{
        ...card,
        padding: "16px 20px", marginBottom: "16px",
        display: "flex", gap: "12px", alignItems: "flex-end", flexWrap: "wrap",
        overflow: "visible",
      }}>
        {/* Building dropdown */}
        <div style={{ flex: 1, minWidth: "180px" }}>
          <label style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", letterSpacing: "0.5px", display: "block", marginBottom: "6px" }}>
            TÒA NHÀ
          </label>
          <select
            value={buildingCode}
            onChange={(e) => { setBuildingCode(e.target.value); setPage(1); }}
            style={{
              width: "100%", padding: "9px 12px",
              border: "1.5px solid #e2e8f0", borderRadius: "8px",
              fontSize: "14px", outline: "none", background: "#fff",
              color: "#0f172a", fontFamily: "inherit",
            }}
          >
            <option value="">Tất cả tòa nhà</option>
            {buildings.map((b) => (
              <option key={b.id ?? b.code} value={b.code}>
                {b.name} ({b.code})
              </option>
            ))}
          </select>
        </div>

        {/* Period code */}
        <div style={{ flex: 1, minWidth: "160px" }}>
          <label style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", letterSpacing: "0.5px", display: "block", marginBottom: "6px" }}>
            KỲ THANH TOÁN (YYYY-MM)
          </label>
          <input
            value={periodInput}
            placeholder="VD: 2026-03"
            onChange={(e) => setPeriodInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyFilter()}
            style={{
              width: "100%", padding: "9px 12px",
              border: "1.5px solid #e2e8f0", borderRadius: "8px",
              fontSize: "14px", outline: "none", color: "#0f172a",
              fontFamily: "inherit", boxSizing: "border-box",
            }}
          />
        </div>

        {/* Status dropdown */}
        <div style={{ minWidth: "180px" }}>
          <label style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", letterSpacing: "0.5px", display: "block", marginBottom: "6px" }}>
            TRẠNG THÁI
          </label>
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            style={{
              width: "100%", padding: "9px 12px",
              border: "1.5px solid #e2e8f0", borderRadius: "8px",
              fontSize: "14px", outline: "none", background: "#fff",
              color: "#0f172a", fontFamily: "inherit",
            }}
          >
            <option value="">Tất cả</option>
            <option value="UNPAID">Chưa thanh toán</option>
            <option value="PAID">Đã thanh toán</option>
            <option value="PARTIAL">Thanh toán một phần</option>
          </select>
        </div>

        {/* Buttons */}
        <button onClick={applyFilter} style={{
          padding: "9px 20px", background: "#1d4ed8", color: "#fff",
          border: "none", borderRadius: "8px", fontWeight: 600,
          fontSize: "14px", cursor: "pointer", fontFamily: "inherit",
        }}>
          🔍 Lọc
        </button>
        <button onClick={clearFilter} style={{
          padding: "9px 16px", background: "#f1f5f9", color: "#374151",
          border: "1.5px solid #e2e8f0", borderRadius: "8px", fontWeight: 600,
          fontSize: "14px", cursor: "pointer", fontFamily: "inherit",
        }}>
          Xóa lọc
        </button>
      </div>

      {/* Table Card */}
      <div style={card}>
        {/* Table header bar */}
        <div style={{
          padding: "16px 20px", borderBottom: "1px solid #f1f5f9",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <span style={{ fontWeight: 700, fontSize: "14px", color: "#0f172a" }}>
            Danh sách hóa đơn
            <span style={{
              marginLeft: "8px", background: "#f1f5f9", color: "#64748b",
              borderRadius: "20px", padding: "2px 10px", fontSize: "12px", fontWeight: 600,
            }}>
              {totalElements}
            </span>
          </span>
          <button onClick={fetchBills} style={{
            display: "flex", alignItems: "center", gap: "6px",
            padding: "7px 14px", background: "#fff", border: "1.5px solid #e2e8f0",
            borderRadius: "8px", fontSize: "13px", fontWeight: 600,
            cursor: "pointer", color: "#374151", fontFamily: "inherit",
          }}>
            ↻ Làm mới
          </button>
        </div>

        {/* Table body */}
        {loading ? (
          <div style={{ padding: "60px", textAlign: "center", color: "#94a3b8", fontSize: "14px" }}>
            Đang tải dữ liệu...
          </div>
        ) : bills.length === 0 ? (
          <div style={{ padding: "60px", textAlign: "center", color: "#94a3b8" }}>
            <div style={{ fontSize: "36px", marginBottom: "12px" }}>📭</div>
            <div style={{ fontWeight: 600, fontSize: "14px" }}>Không có hóa đơn nào</div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
              <thead>
                <tr>
                  {["STT", "Mã HĐ", "Căn hộ", "Tòa nhà", "Kỳ", "Tổng tiền", "Trạng thái", "Chi tiết"].map((h) => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bills.map((bill, idx) => {
                  const sc = STATUS_CONFIG[bill.status] ?? {
                    label: bill.status, color: "#64748b", bg: "#f1f5f9", border: "#cbd5e1",
                  };
                  return (
                    <tr
                      key={bill.id}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                      style={{ transition: "background 0.12s", cursor: "pointer" }}
                      onClick={() => openDetail(bill.id)}
                    >
                      {/* STT */}
                      <td style={{ ...tdStyle, color: "#94a3b8", fontWeight: 500, minWidth: "50px" }}>
                        {(page - 1) * PAGE_SIZE + idx + 1}
                      </td>
                      {/* ID */}
                      <td style={{ ...tdStyle, fontFamily: "monospace", fontSize: "12px", maxWidth: "140px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={bill.id}>
                        {bill.id?.slice(0, 8)}…
                      </td>
                      {/* Apartment */}
                      <td style={{ ...tdStyle, fontWeight: 600 }}>{bill.apartmentCode ?? "—"}</td>
                      {/* Building */}
                      <td style={tdStyle}>{bill.buildingCode ?? "—"}</td>
                      {/* Period */}
                      <td style={{ ...tdStyle, fontFamily: "monospace", fontSize: "13px" }}>{bill.periodCode ?? "—"}</td>
                      {/* Amount */}
                      <td style={{ ...tdStyle, fontWeight: 700, color: "#0f172a", whiteSpace: "nowrap" }}>
                        {fmt(bill.totalAmount)}
                      </td>
                      {/* Status badge */}
                      <td style={tdStyle}>
                        <span style={{
                          background: sc.bg, color: sc.color,
                          border: `1px solid ${sc.border}`,
                          borderRadius: "6px", padding: "3px 10px",
                          fontSize: "11px", fontWeight: 700, whiteSpace: "nowrap",
                        }}>
                          {sc.label}
                        </span>
                      </td>
                      {/* Detail btn */}
                      <td style={tdStyle} onClick={(e) => { e.stopPropagation(); openDetail(bill.id); }}>
                        <button style={{
                          padding: "5px 12px", background: "#eff6ff",
                          color: "#1d4ed8", border: "1px solid #bfdbfe",
                          borderRadius: "6px", fontSize: "12px", fontWeight: 600,
                          cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap",
                        }}>
                          👁 Xem
                        </button>
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
          <div style={{
            padding: "14px 20px", borderTop: "1px solid #f1f5f9",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <span style={{ fontSize: "13px", color: "#64748b" }}>
              Trang {page} / {totalPages} &nbsp;·&nbsp; {totalElements} hóa đơn
            </span>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                style={{
                  padding: "6px 14px", border: "1.5px solid #e2e8f0",
                  borderRadius: "8px", background: "#fff",
                  cursor: page <= 1 ? "not-allowed" : "pointer",
                  opacity: page <= 1 ? 0.5 : 1,
                  fontSize: "13px", fontWeight: 600, fontFamily: "inherit",
                }}
              >
                ← Trước
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                style={{
                  padding: "6px 14px", border: "1.5px solid #e2e8f0",
                  borderRadius: "8px", background: "#fff",
                  cursor: page >= totalPages ? "not-allowed" : "pointer",
                  opacity: page >= totalPages ? 0.5 : 1,
                  fontSize: "13px", fontWeight: 600, fontFamily: "inherit",
                }}
              >
                Sau →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Bill Detail Modal ── */}
      {detailBill && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) closeDetail(); }}
          style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "rgba(15,23,42,0.55)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "16px",
          }}
        >
          <div style={{
            background: "#fff", borderRadius: "16px",
            width: "100%", maxWidth: "780px",
            maxHeight: "90vh", overflow: "auto",
            boxShadow: "0 25px 60px rgba(0,0,0,0.25)",
          }}>
            {/* Modal Header */}
            <div style={{
              padding: "20px 24px", borderBottom: "1px solid #e2e8f0",
              display: "flex", justifyContent: "space-between", alignItems: "center",
              position: "sticky", top: 0, background: "#fff", zIndex: 1,
            }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "17px", fontWeight: 700, color: "#0f172a" }}>
                  📄 Chi tiết hóa đơn
                </h2>
                {!detailLoading && detailBill?.id && (
                  <p style={{ margin: "3px 0 0", fontSize: "12px", color: "#94a3b8", fontFamily: "monospace" }}>
                    ID: {detailBill.id}
                  </p>
                )}
              </div>
              <button
                onClick={closeDetail}
                style={{
                  width: "32px", height: "32px", border: "none", borderRadius: "8px",
                  background: "#f1f5f9", cursor: "pointer", fontSize: "18px",
                  display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b",
                }}
              >
                ×
              </button>
            </div>

            {detailLoading ? (
              <div style={{ padding: "60px", textAlign: "center", color: "#94a3b8", fontSize: "14px" }}>
                Đang tải...
              </div>
            ) : detailBill ? (
              <div style={{ padding: "24px" }}>
                {/* Info Grid */}
                <div style={{
                  display: "grid", gridTemplateColumns: "1fr 1fr",
                  gap: "12px", marginBottom: "24px",
                }}>
                  {[
                    { label: "Căn hộ",       value: detailBill.apartmentCode },
                    { label: "Tòa nhà",       value: detailBill.buildingCode },
                    { label: "Kỳ",            value: detailBill.periodCode },
                    { label: "Trạng thái",    value: (() => { const sc = STATUS_CONFIG[detailBill.status]; return sc ? sc.label : detailBill.status; })() },
                    { label: "Ngày phát hành", value: detailBill.issuedAt ? new Date(detailBill.issuedAt).toLocaleDateString("vi-VN") : "—" },
                    { label: "Hạn thanh toán", value: detailBill.dueDate  ? new Date(detailBill.dueDate).toLocaleDateString("vi-VN")  : "—" },
                    { label: "Tạm tính",      value: fmt(detailBill.subtotal) },
                    { label: "Thuế",          value: fmt(detailBill.taxTotal) },
                  ].map(({ label, value }) => (
                    <div key={label} style={{
                      background: "#f8fafc", borderRadius: "10px",
                      padding: "12px 14px", border: "1px solid #e2e8f0",
                    }}>
                      <div style={{ fontSize: "11px", fontWeight: 600, color: "#94a3b8", marginBottom: "4px", letterSpacing: "0.4px" }}>
                        {label.toUpperCase()}
                      </div>
                      <div style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a" }}>{value ?? "—"}</div>
                    </div>
                  ))}
                </div>

                {/* Total highlight */}
                <div style={{
                  background: "linear-gradient(135deg,#1d4ed8,#2563eb)",
                  borderRadius: "12px", padding: "16px 20px",
                  marginBottom: "24px", display: "flex",
                  justifyContent: "space-between", alignItems: "center",
                }}>
                  <span style={{ color: "rgba(255,255,255,0.8)", fontWeight: 600, fontSize: "14px" }}>
                    TỔNG TIỀN PHẢI THANH TOÁN
                  </span>
                  <span style={{ color: "#fff", fontWeight: 800, fontSize: "22px" }}>
                    {fmt(detailBill.totalAmount)}
                  </span>
                </div>

                {/* Bill Details Table */}
                {detailBill.details && detailBill.details.length > 0 && (
                  <>
                    <div style={{ fontWeight: 700, fontSize: "14px", color: "#0f172a", marginBottom: "12px" }}>
                      Chi tiết các khoản thu
                    </div>
                    <div style={{ overflowX: "auto", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                        <thead>
                          <tr style={{ background: "#f8fafc" }}>
                            {["Mô tả", "Số lượng", "Đơn giá", "Thành tiền", "Thuế (%)", "Tổng dòng"].map((h) => (
                              <th key={h} style={{
                                padding: "10px 14px", textAlign: h === "Mô tả" ? "left" : "right",
                                fontSize: "11px", fontWeight: 700, color: "#64748b",
                                borderBottom: "1px solid #e2e8f0", whiteSpace: "nowrap",
                              }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {detailBill.details.map((d) => (
                            <tr key={d.id}
                              onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                              onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                            >
                              <td style={{ padding: "10px 14px", color: "#334155" }}>{d.description}</td>
                              <td style={{ padding: "10px 14px", textAlign: "right", color: "#334155" }}>{d.quantity}</td>
                              <td style={{ padding: "10px 14px", textAlign: "right", color: "#334155" }}>{fmt(d.unitPrice)}</td>
                              <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: 600, color: "#0f172a" }}>{fmt(d.amount)}</td>
                              <td style={{ padding: "10px 14px", textAlign: "right", color: "#64748b" }}>{d.taxRate ?? 0}%</td>
                              <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: 700, color: "#1d4ed8" }}>{fmt(d.totalLine)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
