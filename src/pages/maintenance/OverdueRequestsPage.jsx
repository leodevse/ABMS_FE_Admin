import { useEffect, useState } from "react";
import { AlertTriangle, Loader2, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import maintenanceApi from "../../api/maintenanceApi";

export default function OverdueRequestsPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await maintenanceApi.getOverdueRequests();
        setRows(res?.data?.result || []);
      } catch (err) {
        setError(err.message || "Không thể tải danh sách yêu cầu quá hạn");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div>
      <div className="page-header">
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <AlertTriangle size={24} />
          <div>
            <h1 className="page-header__title">Yêu cầu quá hạn</h1>
            <p className="page-header__subtitle">Các yêu cầu đang xử lý vượt ngưỡng thời gian kỳ vọng</p>
          </div>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
            <Loader2 size={28} style={{ animation: "spin 1s linear infinite", color: "var(--color-primary)" }} />
          </div>
        ) : error ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "var(--color-danger)" }}>
            <AlertCircle size={28} style={{ marginBottom: "0.5rem" }} />
            <p style={{ fontSize: "0.875rem" }}>{error}</p>
          </div>
        ) : rows.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "var(--color-text-muted)" }}>
            Không có yêu cầu quá hạn.
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Mã YC</th>
                <th>Tiêu đề</th>
                <th>Cư dân</th>
                <th>Nhân viên</th>
                <th>Ngày bắt đầu</th>
                <th>Ngày mong muốn</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} onClick={() => navigate(`/maintenance/${r.id}`)} style={{ cursor: "pointer" }}>
                  <td style={{ fontWeight: 600 }}>{r.code || "-"}</td>
                  <td>{r.title || "-"}</td>
                  <td>{r.requesterName || "-"}</td>
                  <td>{r.staffName || "Chưa giao"}</td>
                  <td>{r.startedAt ? new Date(r.startedAt).toLocaleString("vi-VN") : "-"}</td>
                  <td>{r.preferredTime ? new Date(r.preferredTime).toLocaleString("vi-VN") : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
