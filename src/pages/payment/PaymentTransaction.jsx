import { useState, useEffect, useCallback } from "react";
import paymentApi from "../../api/paymentApi";

const STATUS_CONFIG = {
  PENDING: {
    label: "Đang chờ",
    color: "#f59e0b",
    bg: "#fef3c7",
    border: "#fcd34d",
  },
  SUCCESS: {
    label: "Thành công",
    color: "#10b981",
    bg: "#d1fae5",
    border: "#6ee7b7",
  },
  FAILED: {
    label: "Thất bại",
    color: "#ef4444",
    bg: "#fee2e2",
    border: "#fca5a5",
  },
  CANCELLED: {
    label: "Đã hủy",
    color: "#64748b",
    bg: "#f1f5f9",
    border: "#cbd5e1",
  },
};

const fmt = (n) => Number(n).toLocaleString("vi-VN") + " ₫";

const PAGE_SIZE = 10;

export default function PaymentTransaction() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState("");
  const [billIdFilter, setBillIdFilter] = useState("");
  const [billIdInput, setBillIdInput] = useState("");

  // Pagination
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Manual confirm modal
  const [confirmModal, setConfirmModal] = useState(null);
  const [confirmReason, setConfirmReason] = useState("");
  const [confirmLoading, setConfirmLoading] = useState(false);

  // Sync loading per orderCode
  const [syncingSet, setSyncingSet] = useState(new Set());

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, size: PAGE_SIZE };
      if (statusFilter) params.status = statusFilter;
      if (billIdFilter.trim()) params.billId = billIdFilter.trim();

      const res = await paymentApi.getTransactions(params);
      const data = res.data;
      setTransactions(data.content || []);
      setTotalPages(data.totalPages || 0);
      setTotalElements(data.totalElements || 0);
    } catch {
      showToast("Không thể tải dữ liệu giao dịch", "error");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, billIdFilter]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const applyFilter = () => {
    setBillIdFilter(billIdInput);
    setPage(0);
  };

  const clearFilter = () => {
    setStatusFilter("");
    setBillIdFilter("");
    setBillIdInput("");
    setPage(0);
  };

  const handleSync = async (orderCode) => {
    setSyncingSet((prev) => new Set(prev).add(orderCode));
    try {
      await paymentApi.syncTransaction(orderCode);
      showToast(`Đã đồng bộ giao dịch #${orderCode}`);
      fetchTransactions();
    } catch {
      showToast(`Đồng bộ giao dịch #${orderCode} thất bại`, "error");
    } finally {
      setSyncingSet((prev) => {
        const next = new Set(prev);
        next.delete(orderCode);
        return next;
      });
    }
  };

  const openConfirmModal = (transactionId) => {
    setConfirmModal({ transactionId });
    setConfirmReason("");
  };

  const handleManualConfirm = async () => {
    if (!confirmReason.trim()) {
      showToast("Vui lòng nhập lý do xác nhận", "error");
      return;
    }
    setConfirmLoading(true);
    try {
      await paymentApi.manualConfirm(confirmModal.transactionId, confirmReason);
      showToast("Đã xác nhận thủ công thành công");
      setConfirmModal(null);
      setConfirmReason("");
      fetchTransactions();
    } catch {
      showToast("Xác nhận thủ công thất bại", "error");
    } finally {
      setConfirmLoading(false);
    }
  };

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
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          {toast.type === "error" ? "✕" : "✓"} {toast.message}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <h1
          style={{
            fontSize: "22px",
            fontWeight: 700,
            color: "#0f172a",
            margin: 0,
          }}
        >
          Lịch sử giao dịch
        </h1>
        <p
          style={{
            color: "#64748b",
            fontSize: "14px",
            marginTop: "4px",
            margin: "4px 0 0",
          }}
        >
          Quản lý và theo dõi các giao dịch thanh toán qua PayOS
        </p>
      </div>

      {/* Filters */}
      <div
        style={{
          background: "#fff",
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
          padding: "16px 20px",
          marginBottom: "16px",
          display: "flex",
          gap: "12px",
          alignItems: "flex-end",
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: 1, minWidth: "200px" }}>
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
            MÃ HÓA ĐƠN (BILL ID)
          </label>
          <input
            value={billIdInput}
            onChange={(e) => setBillIdInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyFilter()}
            placeholder="Nhập Bill ID..."
            style={{
              width: "100%",
              padding: "9px 12px",
              border: "1.5px solid #e2e8f0",
              borderRadius: "8px",
              fontSize: "14px",
              outline: "none",
              color: "#0f172a",
              fontFamily: "inherit",
              boxSizing: "border-box",
            }}
          />
        </div>
        <div style={{ minWidth: "180px" }}>
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
            TRẠNG THÁI
          </label>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(0);
            }}
            style={{
              width: "100%",
              padding: "9px 12px",
              border: "1.5px solid #e2e8f0",
              borderRadius: "8px",
              fontSize: "14px",
              outline: "none",
              background: "#fff",
              color: "#0f172a",
              fontFamily: "inherit",
            }}
          >
            <option value="">Tất cả</option>
            <option value="PENDING">Đang chờ</option>
            <option value="SUCCESS">Thành công</option>
            <option value="FAILED">Thất bại</option>
            <option value="CANCELLED">Đã hủy</option>
          </select>
        </div>
        <button
          onClick={applyFilter}
          style={{
            padding: "9px 20px",
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
          Lọc
        </button>
        <button
          onClick={clearFilter}
          style={{
            padding: "9px 16px",
            background: "#f1f5f9",
            color: "#374151",
            border: "1.5px solid #e2e8f0",
            borderRadius: "8px",
            fontWeight: 600,
            fontSize: "14px",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Xóa lọc
        </button>
      </div>

      {/* Table Card */}
      <div
        style={{
          background: "#fff",
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
          overflow: "hidden",
        }}
      >
        {/* Table header bar */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid #f1f5f9",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span
            style={{ fontWeight: 700, fontSize: "14px", color: "#0f172a" }}
          >
            Danh sách giao dịch
            <span
              style={{
                marginLeft: "8px",
                background: "#f1f5f9",
                color: "#64748b",
                borderRadius: "20px",
                padding: "2px 10px",
                fontSize: "12px",
                fontWeight: 600,
              }}
            >
              {totalElements}
            </span>
          </span>
          <button
            onClick={fetchTransactions}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "7px 14px",
              background: "#fff",
              border: "1.5px solid #e2e8f0",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              color: "#374151",
              fontFamily: "inherit",
            }}
          >
            ↻ Làm mới
          </button>
        </div>

        {loading ? (
          <div
            style={{
              padding: "60px",
              textAlign: "center",
              color: "#94a3b8",
              fontSize: "14px",
            }}
          >
            Đang tải dữ liệu...
          </div>
        ) : transactions.length === 0 ? (
          <div
            style={{
              padding: "60px",
              textAlign: "center",
              color: "#94a3b8",
            }}
          >
            <div style={{ fontSize: "36px", marginBottom: "12px" }}>📭</div>
            <div style={{ fontWeight: 600, fontSize: "14px" }}>
              Không có giao dịch nào
            </div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "14px",
              }}
            >
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  {[
                    "ID giao dịch",
                    "Mã hóa đơn",
                    "Số tiền",
                    "Trạng thái",
                    "Order Code",
                    "Thao tác",
                  ].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "12px 16px",
                        textAlign: "left",
                        fontSize: "11px",
                        fontWeight: 600,
                        color: "#64748b",
                        letterSpacing: "0.5px",
                        borderBottom: "1px solid #e2e8f0",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h.toUpperCase()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => {
                  const sc = STATUS_CONFIG[tx.status] || {
                    label: tx.status,
                    color: "#64748b",
                    bg: "#f1f5f9",
                    border: "#cbd5e1",
                  };
                  const isSyncing = syncingSet.has(tx.orderCode);
                  return (
                    <tr
                      key={tx.id}
                      style={{
                        borderBottom: "1px solid #f8fafc",
                        transition: "background 0.12s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "#f8fafc")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "")
                      }
                    >
                      {/* ID */}
                      <td
                        style={{
                          padding: "14px 16px",
                          fontFamily: "monospace",
                          fontSize: "12px",
                          color: "#0f172a",
                          maxWidth: "160px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                        title={tx.id}
                      >
                        {tx.id}
                      </td>
                      {/* Bill ID */}
                      <td
                        style={{
                          padding: "14px 16px",
                          fontFamily: "monospace",
                          fontSize: "12px",
                          color: "#64748b",
                          maxWidth: "160px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                        title={tx.billId}
                      >
                        {tx.billId}
                      </td>
                      {/* Amount */}
                      <td
                        style={{
                          padding: "14px 16px",
                          fontWeight: 700,
                          color: "#0f172a",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {fmt(tx.amount)}
                      </td>
                      {/* Status */}
                      <td style={{ padding: "14px 16px" }}>
                        <span
                          style={{
                            background: sc.bg,
                            color: sc.color,
                            border: `1px solid ${sc.border}`,
                            borderRadius: "6px",
                            padding: "3px 10px",
                            fontSize: "11px",
                            fontWeight: 700,
                            whiteSpace: "nowrap",
                            letterSpacing: "0.3px",
                          }}
                        >
                          {sc.label}
                        </span>
                      </td>
                      {/* Order Code */}
                      <td
                        style={{
                          padding: "14px 16px",
                          fontFamily: "monospace",
                          fontSize: "12px",
                          color: "#64748b",
                        }}
                      >
                        {tx.orderCode}
                      </td>
                      {/* Actions */}
                      <td style={{ padding: "14px 16px" }}>
                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                            flexWrap: "wrap",
                          }}
                        >
                          <button
                            onClick={() => handleSync(tx.orderCode)}
                            disabled={isSyncing}
                            style={{
                              padding: "5px 12px",
                              background: "#eff6ff",
                              color: "#1d4ed8",
                              border: "1px solid #bfdbfe",
                              borderRadius: "6px",
                              fontSize: "12px",
                              fontWeight: 600,
                              cursor: isSyncing ? "not-allowed" : "pointer",
                              opacity: isSyncing ? 0.6 : 1,
                              fontFamily: "inherit",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {isSyncing ? "Đang sync..." : "↻ Sync"}
                          </button>
                          {tx.status === "PENDING" && (
                            <button
                              onClick={() => openConfirmModal(tx.id)}
                              style={{
                                padding: "5px 12px",
                                background: "#f0fdf4",
                                color: "#16a34a",
                                border: "1px solid #bbf7d0",
                                borderRadius: "6px",
                                fontSize: "12px",
                                fontWeight: 600,
                                cursor: "pointer",
                                fontFamily: "inherit",
                                whiteSpace: "nowrap",
                              }}
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
        {totalPages > 1 && (
          <div
            style={{
              padding: "14px 20px",
              borderTop: "1px solid #f1f5f9",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: "13px", color: "#64748b" }}>
              Trang {page + 1} / {totalPages} &nbsp;·&nbsp; {totalElements} giao dịch
            </span>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                style={{
                  padding: "6px 14px",
                  border: "1.5px solid #e2e8f0",
                  borderRadius: "8px",
                  background: "#fff",
                  cursor: page === 0 ? "not-allowed" : "pointer",
                  opacity: page === 0 ? 0.5 : 1,
                  fontSize: "13px",
                  fontWeight: 600,
                  fontFamily: "inherit",
                }}
              >
                ← Trước
              </button>
              <button
                onClick={() =>
                  setPage((p) => Math.min(totalPages - 1, p + 1))
                }
                disabled={page >= totalPages - 1}
                style={{
                  padding: "6px 14px",
                  border: "1.5px solid #e2e8f0",
                  borderRadius: "8px",
                  background: "#fff",
                  cursor:
                    page >= totalPages - 1 ? "not-allowed" : "pointer",
                  opacity: page >= totalPages - 1 ? 0.5 : 1,
                  fontSize: "13px",
                  fontWeight: 600,
                  fontFamily: "inherit",
                }}
              >
                Sau →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Manual Confirm Modal */}
      {confirmModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setConfirmModal(null);
              setConfirmReason("");
            }
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "12px",
              padding: "28px",
              width: "440px",
              maxWidth: "90vw",
              boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
            }}
          >
            <div
              style={{
                fontWeight: 700,
                fontSize: "17px",
                color: "#0f172a",
                marginBottom: "6px",
              }}
            >
              Xác nhận thủ công
            </div>
            <div
              style={{
                color: "#64748b",
                fontSize: "13px",
                marginBottom: "20px",
                lineHeight: "1.6",
              }}
            >
              Hành động này sẽ đánh dấu giao dịch là{" "}
              <strong style={{ color: "#10b981" }}>THÀNH CÔNG</strong>. Vui
              lòng nhập lý do xác nhận.
            </div>
            <div
              style={{
                background: "#fef3c7",
                border: "1px solid #fcd34d",
                borderRadius: "8px",
                padding: "10px 14px",
                fontSize: "12px",
                color: "#92400e",
                marginBottom: "16px",
              }}
            >
              ID: <code>{confirmModal.transactionId}</code>
            </div>
            <label
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: "#374151",
                display: "block",
                marginBottom: "6px",
              }}
            >
              LÝ DO XÁC NHẬN *
            </label>
            <textarea
              value={confirmReason}
              onChange={(e) => setConfirmReason(e.target.value)}
              placeholder="VD: Khách hàng đã gửi biên lai chuyển khoản, xác nhận thủ công..."
              rows={3}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1.5px solid #e2e8f0",
                borderRadius: "8px",
                fontSize: "14px",
                outline: "none",
                resize: "vertical",
                fontFamily: "inherit",
                boxSizing: "border-box",
              }}
            />
            <div
              style={{
                display: "flex",
                gap: "10px",
                marginTop: "20px",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => {
                  setConfirmModal(null);
                  setConfirmReason("");
                }}
                style={{
                  padding: "9px 20px",
                  background: "#f1f5f9",
                  color: "#374151",
                  border: "1.5px solid #e2e8f0",
                  borderRadius: "8px",
                  fontWeight: 600,
                  fontSize: "14px",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Hủy
              </button>
              <button
                onClick={handleManualConfirm}
                disabled={confirmLoading}
                style={{
                  padding: "9px 20px",
                  background: "#10b981",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: 600,
                  fontSize: "14px",
                  cursor: confirmLoading ? "not-allowed" : "pointer",
                  opacity: confirmLoading ? 0.7 : 1,
                  fontFamily: "inherit",
                }}
              >
                {confirmLoading ? "Đang xử lý..." : "✓ Xác nhận"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
