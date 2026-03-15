import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import paymentApi from "../../api/paymentApi";

// ── Constants ──────────────────────────────────────────────────────────────

const TX_STATUS = {
  PENDING:   { label: "Đang chờ",    color: "#f59e0b", bg: "#fef3c7", border: "#fcd34d" },
  SUCCESS:   { label: "Thành công",  color: "#10b981", bg: "#d1fae5", border: "#6ee7b7" },
  FAILED:    { label: "Thất bại",    color: "#ef4444", bg: "#fee2e2", border: "#fca5a5" },
  CANCELLED: { label: "Đã hủy",      color: "#64748b", bg: "#f1f5f9", border: "#cbd5e1" },
};

const BILL_STATUS = {
  UNPAID:   { label: "Chưa TT",   color: "#ef4444", bg: "#fee2e2", border: "#fca5a5" },
  PAID:     { label: "Đã TT",     color: "#10b981", bg: "#d1fae5", border: "#6ee7b7" },
  PARTIAL:  { label: "Một phần",  color: "#f59e0b", bg: "#fef3c7", border: "#fcd34d" },
  OVERDUE:  { label: "Quá hạn",   color: "#dc2626", bg: "#fef2f2", border: "#fca5a5" },
  REFUNDED: { label: "Hoàn tiền", color: "#8b5cf6", bg: "#f5f3ff", border: "#d8b4fe" },
};

const fmt = (n) => Number(n).toLocaleString("vi-VN") + " ₫";

const fmtDate = (str) =>
  str
    ? new Date(str).toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

const fmtDateShort = (str) =>
  str
    ? new Date(str).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "—";

// ── Small helpers ──────────────────────────────────────────────────────────

function InfoRow({ label, value, mono = false }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        padding: "10px 0",
        borderBottom: "1px solid #f1f5f9",
        gap: "12px",
      }}
    >
      <span style={{ color: "#64748b", fontSize: "13px", flexShrink: 0 }}>
        {label}
      </span>
      <span
        style={{
          fontWeight: 600,
          fontSize: "13px",
          color: "#0f172a",
          textAlign: "right",
          fontFamily: mono ? "monospace" : "inherit",
          wordBreak: "break-all",
        }}
      >
        {value ?? "—"}
      </span>
    </div>
  );
}

function SectionCard({ title, children, style = {} }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: "12px",
        border: "1px solid #e2e8f0",
        overflow: "hidden",
        ...style,
      }}
    >
      <div
        style={{
          padding: "14px 20px",
          borderBottom: "1px solid #f1f5f9",
          fontWeight: 700,
          fontSize: "13px",
          color: "#0f172a",
          letterSpacing: "0.2px",
        }}
      >
        {title}
      </div>
      <div style={{ padding: "4px 20px 16px" }}>{children}</div>
    </div>
  );
}

// ── Reason Modal (shared for confirm & reject) ─────────────────────────────

function ReasonModal({ type, onConfirm, onCancel, loading }) {
  const [reason, setReason] = useState("");
  const isConfirm = type === "confirm";

  return (
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
      onClick={(e) => e.target === e.currentTarget && onCancel()}
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
          {isConfirm ? "Xác nhận thủ công" : "Từ chối giao dịch"}
        </div>
        <div
          style={{
            color: "#64748b",
            fontSize: "13px",
            marginBottom: "20px",
            lineHeight: 1.6,
          }}
        >
          Hành động này sẽ đánh dấu giao dịch là{" "}
          <strong style={{ color: isConfirm ? "#10b981" : "#ef4444" }}>
            {isConfirm ? "THÀNH CÔNG" : "TỪ CHỐI"}
          </strong>
          . Vui lòng nhập lý do.
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
          {isConfirm ? "LÝ DO XÁC NHẬN" : "LÝ DO TỪ CHỐI"} *
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={
            isConfirm
              ? "VD: Khách hàng đã gửi biên lai, xác nhận thủ công..."
              : "VD: Ảnh chụp không hợp lệ, sai số tiền..."
          }
          rows={3}
          autoFocus
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
            onClick={onCancel}
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
            onClick={() => onConfirm(reason)}
            disabled={loading || !reason.trim()}
            style={{
              padding: "9px 20px",
              background: isConfirm ? "#10b981" : "#ef4444",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontWeight: 600,
              fontSize: "14px",
              cursor: loading || !reason.trim() ? "not-allowed" : "pointer",
              opacity: loading || !reason.trim() ? 0.65 : 1,
              fontFamily: "inherit",
            }}
          >
            {loading
              ? "Đang xử lý..."
              : isConfirm
              ? "✓ Xác nhận"
              : "✗ Từ chối"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function PaymentTransactionDetail() {
  const { transactionId } = useParams();
  const navigate = useNavigate();

  const [tx, setTx] = useState(null);
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Modal state: null | "confirm" | "reject"
  const [modal, setModal] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const txRes = await paymentApi.getTransactionDetail(transactionId);
        const txData = txRes.data.result;
        setTx(txData);

        // Fetch bill detail in parallel
        if (txData?.bill?.billId) {
          try {
            const billRes = await paymentApi.getBillDetail(txData.bill.billId);
            setBill(billRes.data.result);
          } catch {
            // Bill detail failed — fall back to tx.bill.items
          }
        }
      } catch {
        showToast("Không thể tải chi tiết giao dịch", "error");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [transactionId]);

  const handleAction = async (type, reason) => {
    if (!reason.trim()) {
      showToast("Vui lòng nhập lý do", "error");
      return;
    }
    setActionLoading(true);
    try {
      if (type === "confirm") {
        await paymentApi.manualConfirm(transactionId, reason);
        showToast("Đã xác nhận giao dịch thành công");
      } else {
        await paymentApi.rejectTransaction(transactionId, reason);
        showToast("Đã từ chối giao dịch");
      }
      setModal(null);
      // Reload transaction detail to reflect new status
      const res = await paymentApi.getTransactionDetail(transactionId);
      setTx(res.data.result);
    } catch {
      showToast(
        type === "confirm" ? "Xác nhận thất bại" : "Từ chối thất bại",
        "error"
      );
    } finally {
      setActionLoading(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div
        style={{
          padding: "24px",
          fontFamily: "'Be Vietnam Pro', 'Segoe UI', sans-serif",
        }}
      >
        <div
          style={{
            textAlign: "center",
            padding: "80px",
            color: "#94a3b8",
            fontSize: "14px",
          }}
        >
          Đang tải dữ liệu...
        </div>
      </div>
    );
  }

  if (!tx) {
    return (
      <div
        style={{
          padding: "24px",
          fontFamily: "'Be Vietnam Pro', 'Segoe UI', sans-serif",
        }}
      >
        <button
          onClick={() => navigate("/payment")}
          style={backBtnStyle}
        >
          ← Quay lại
        </button>
        <div
          style={{
            textAlign: "center",
            padding: "80px",
            color: "#94a3b8",
            fontSize: "14px",
          }}
        >
          Không tìm thấy giao dịch.
        </div>
      </div>
    );
  }

  const txStatus = TX_STATUS[tx.status] || {
    label: tx.status,
    color: "#64748b",
    bg: "#f1f5f9",
    border: "#cbd5e1",
  };

  // Bill items: prefer full bill detail, fallback to tx.bill.items
  const billItems =
    bill?.details?.map((d) => ({
      name: d.description,
      quantity: d.quantity,
      unitPrice: d.unitPrice,
      taxRate: d.taxRate,
      amount: d.totalLine ?? d.amount,
    })) ??
    (tx.bill?.items?.map((i) => ({
      name: i.name,
      quantity: null,
      unitPrice: null,
      taxRate: null,
      amount: i.amount,
    })) || []);

  const billStatus = tx.bill?.status
    ? BILL_STATUS[tx.bill.status] ?? {
        label: tx.bill.status,
        color: "#64748b",
        bg: "#f1f5f9",
        border: "#cbd5e1",
      }
    : null;

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
          {toast.type === "error" ? "✕" : "✓"} {toast.message}
        </div>
      )}

      {/* Back + Title row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          marginBottom: "24px",
          flexWrap: "wrap",
        }}
      >
        <button onClick={() => navigate("/payment")} style={backBtnStyle}>
          ← Quay lại
        </button>
        <div style={{ flex: 1 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <h1
              style={{
                fontSize: "20px",
                fontWeight: 700,
                color: "#0f172a",
                margin: 0,
              }}
            >
              Chi tiết giao dịch
            </h1>
            <span
              style={{
                background: txStatus.bg,
                color: txStatus.color,
                border: `1px solid ${txStatus.border}`,
                borderRadius: "6px",
                padding: "3px 12px",
                fontSize: "12px",
                fontWeight: 700,
                letterSpacing: "0.3px",
              }}
            >
              {txStatus.label}
            </span>
          </div>
          <p
            style={{
              color: "#64748b",
              fontSize: "13px",
              margin: "4px 0 0",
              fontFamily: "monospace",
            }}
          >
            #{tx.transactionId}
          </p>
        </div>

        {/* Action buttons — only for PENDING */}
        {tx.status === "PENDING" && (
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={() => setModal("confirm")}
              style={{
                padding: "9px 20px",
                background: "#10b981",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                fontWeight: 600,
                fontSize: "14px",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              ✓ Xác nhận
            </button>
            <button
              onClick={() => setModal("reject")}
              style={{
                padding: "9px 20px",
                background: "#ef4444",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                fontWeight: 600,
                fontSize: "14px",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              ✗ Từ chối
            </button>
          </div>
        )}
      </div>

      {/* Row 1: Transaction info + Resident/Apartment */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "16px",
          marginBottom: "16px",
        }}
      >
        {/* Transaction info */}
        <SectionCard title="Thông tin giao dịch">
          <InfoRow label="ID giao dịch" value={tx.transactionId} mono />
          <InfoRow label="Order Code" value={tx.orderCode} mono />
          <InfoRow label="Số tiền" value={fmt(tx.amount)} />
          <InfoRow label="Đơn vị tiền" value={tx.currency} />
          <InfoRow label="Tạo lúc" value={fmtDate(tx.createdAt)} />
          <InfoRow label="Thanh toán lúc" value={fmtDate(tx.paidAt)} />
          <InfoRow label="Xác nhận lúc" value={fmtDate(tx.verifiedAt)} />
          {tx.rejectedReason && (
            <div
              style={{
                marginTop: "10px",
                background: "#fef2f2",
                border: "1px solid #fca5a5",
                borderRadius: "8px",
                padding: "10px 14px",
              }}
            >
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "#ef4444",
                  marginBottom: "4px",
                  letterSpacing: "0.4px",
                }}
              >
                LÝ DO TỪ CHỐI
              </div>
              <div style={{ fontSize: "13px", color: "#0f172a" }}>
                {tx.rejectedReason}
              </div>
            </div>
          )}
        </SectionCard>

        {/* Resident + Apartment */}
        <SectionCard title="Thông tin cư dân & căn hộ">
          {tx.resident && (
            <>
              <InfoRow label="Họ tên" value={tx.resident.fullName} />
              <InfoRow label="Email" value={tx.resident.email} />
              <InfoRow label="Điện thoại" value={tx.resident.phone} />
            </>
          )}
          {tx.apartment && (
            <>
              <div
                style={{
                  marginTop: "8px",
                  marginBottom: "4px",
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "#94a3b8",
                  letterSpacing: "0.5px",
                }}
              >
                CĂN HỘ
              </div>
              <InfoRow label="Phòng" value={tx.apartment.roomNumber} />
              <InfoRow label="Tầng" value={tx.apartment.floor} />
              <InfoRow label="Tòa nhà" value={tx.apartment.building} />
            </>
          )}
        </SectionCard>
      </div>

      {/* Row 2: Bill detail + Proof */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "16px",
        }}
      >
        {/* Bill detail */}
        <SectionCard title="Chi tiết hóa đơn">
          {/* Bill meta */}
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", margin: "12px 0 4px" }}>
            {tx.bill?.month && tx.bill?.year && (
              <span
                style={{
                  background: "#eff6ff",
                  color: "#1d4ed8",
                  borderRadius: "6px",
                  padding: "3px 10px",
                  fontSize: "12px",
                  fontWeight: 600,
                }}
              >
                Tháng {tx.bill.month}/{tx.bill.year}
              </span>
            )}
            {bill?.periodCode && (
              <span
                style={{
                  background: "#f1f5f9",
                  color: "#475569",
                  borderRadius: "6px",
                  padding: "3px 10px",
                  fontSize: "12px",
                  fontWeight: 600,
                }}
              >
                {bill.periodCode}
              </span>
            )}
            {billStatus && (
              <span
                style={{
                  background: billStatus.bg,
                  color: billStatus.color,
                  border: `1px solid ${billStatus.border}`,
                  borderRadius: "6px",
                  padding: "3px 10px",
                  fontSize: "12px",
                  fontWeight: 700,
                }}
              >
                {billStatus.label}
              </span>
            )}
          </div>

          {bill?.periodFrom && (
            <InfoRow
              label="Kỳ tính"
              value={`${fmtDateShort(bill.periodFrom)} – ${fmtDateShort(bill.periodTo)}`}
            />
          )}
          <InfoRow
            label="Hạn thanh toán"
            value={fmtDate(bill?.dueDate ?? tx.bill?.dueDate)}
          />

          {/* Items table */}
          {billItems.length > 0 && (
            <div style={{ marginTop: "14px" }}>
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "#94a3b8",
                  letterSpacing: "0.5px",
                  marginBottom: "8px",
                }}
              >
                CÁC KHOẢN
              </div>
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: "13px",
                  }}
                >
                  <thead>
                    <tr style={{ background: "#f8fafc" }}>
                      <th style={thStyle}>Mô tả</th>
                      {billItems[0].quantity !== null && (
                        <>
                          <th style={{ ...thStyle, textAlign: "right" }}>SL</th>
                          <th style={{ ...thStyle, textAlign: "right" }}>Đơn giá</th>
                        </>
                      )}
                      <th style={{ ...thStyle, textAlign: "right" }}>Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {billItems.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ ...tdStyle, color: "#374151" }}>
                          {item.name}
                        </td>
                        {item.quantity !== null && (
                          <>
                            <td style={{ ...tdStyle, textAlign: "right" }}>
                              {item.quantity}
                            </td>
                            <td style={{ ...tdStyle, textAlign: "right" }}>
                              {fmt(item.unitPrice)}
                            </td>
                          </>
                        )}
                        <td
                          style={{
                            ...tdStyle,
                            textAlign: "right",
                            fontWeight: 600,
                          }}
                        >
                          {fmt(item.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Totals */}
          <div
            style={{
              background: "#f8fafc",
              borderRadius: "8px",
              padding: "14px 16px",
              marginTop: "14px",
            }}
          >
            {bill?.taxTotal > 0 && (
              <div style={totalRowStyle}>
                <span style={{ color: "#64748b", fontSize: "13px" }}>Tạm tính</span>
                <span style={{ fontWeight: 600 }}>{fmt(bill.subtotal)}</span>
              </div>
            )}
            {bill?.taxTotal > 0 && (
              <div style={totalRowStyle}>
                <span style={{ color: "#64748b", fontSize: "13px" }}>Thuế</span>
                <span style={{ fontWeight: 600 }}>{fmt(bill.taxTotal)}</span>
              </div>
            )}
            <div
              style={{
                ...totalRowStyle,
                borderTop: "1px dashed #e2e8f0",
                paddingTop: "10px",
                marginTop: "6px",
              }}
            >
              <span style={{ fontWeight: 700, color: "#0f172a" }}>
                Tổng cộng
              </span>
              <span
                style={{
                  fontWeight: 700,
                  fontSize: "16px",
                  color: "#1d4ed8",
                }}
              >
                {fmt(bill?.totalAmount ?? tx.bill?.totalAmount ?? tx.amount)}
              </span>
            </div>
          </div>
        </SectionCard>

        {/* Proof of payment */}
        <SectionCard title="Bằng chứng chuyển khoản">
          {tx.proofUrl ? (
            <div style={{ paddingTop: "12px" }}>
              <a
                href={tx.proofUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: "block" }}
              >
                <img
                  src={tx.proofUrl}
                  alt="Bằng chứng chuyển khoản"
                  style={{
                    width: "100%",
                    maxHeight: "360px",
                    objectFit: "contain",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                    background: "#f8fafc",
                    cursor: "zoom-in",
                  }}
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    e.currentTarget.nextSibling.style.display = "flex";
                  }}
                />
                <div
                  style={{
                    display: "none",
                    flexDirection: "column",
                    alignItems: "center",
                    padding: "32px",
                    color: "#94a3b8",
                    gap: "8px",
                  }}
                >
                  <span style={{ fontSize: "28px" }}>🖼️</span>
                  <span style={{ fontSize: "13px" }}>
                    Không tải được ảnh. Nhấn để mở link.
                  </span>
                </div>
              </a>
              <a
                href={tx.proofUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-block",
                  marginTop: "10px",
                  fontSize: "12px",
                  color: "#1d4ed8",
                  textDecoration: "none",
                  fontWeight: 600,
                }}
              >
                🔗 Mở ảnh đầy đủ
              </a>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "48px 20px",
                color: "#94a3b8",
                gap: "10px",
              }}
            >
              <span style={{ fontSize: "36px" }}>📎</span>
              <span style={{ fontWeight: 600, fontSize: "14px" }}>
                Chưa có bằng chứng
              </span>
              <span style={{ fontSize: "13px", textAlign: "center" }}>
                Cư dân chưa tải lên ảnh biên lai chuyển khoản.
              </span>
            </div>
          )}
        </SectionCard>
      </div>

      {/* Reason Modal */}
      {modal && (
        <ReasonModal
          type={modal}
          loading={actionLoading}
          onConfirm={(reason) => handleAction(modal, reason)}
          onCancel={() => setModal(null)}
        />
      )}
    </div>
  );
}

// ── Style constants ────────────────────────────────────────────────────────

const backBtnStyle = {
  padding: "8px 16px",
  background: "#f1f5f9",
  color: "#374151",
  border: "1.5px solid #e2e8f0",
  borderRadius: "8px",
  fontWeight: 600,
  fontSize: "14px",
  cursor: "pointer",
  fontFamily: "'Be Vietnam Pro', 'Segoe UI', sans-serif",
  flexShrink: 0,
};

const thStyle = {
  padding: "8px 10px",
  fontSize: "11px",
  fontWeight: 600,
  color: "#64748b",
  letterSpacing: "0.4px",
  textAlign: "left",
  borderBottom: "1px solid #e2e8f0",
  whiteSpace: "nowrap",
};

const tdStyle = {
  padding: "10px 10px",
  fontSize: "13px",
  color: "#0f172a",
  verticalAlign: "top",
};

const totalRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "8px",
};
