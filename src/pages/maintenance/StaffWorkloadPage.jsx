import { useEffect, useState } from "react";
import { Users, Loader2, AlertCircle } from "lucide-react";
import maintenanceApi from "../../api/maintenanceApi";

export default function StaffWorkloadPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await maintenanceApi.getStaffWorkload();
        setRows(res?.data?.result || []);
      } catch (err) {
        setError(err.message || "Không thể tải dữ liệu khối lượng công việc");
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
          <Users size={24} />
          <div>
            <h1 className="page-header__title">Khối lượng nhân viên</h1>
            <p className="page-header__subtitle">Theo dõi phân bổ và hiệu suất xử lý bảo trì</p>
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
            Chưa có dữ liệu khối lượng công việc.
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Nhân viên</th>
                <th>Tổng giao</th>
                <th>Đang xử lý</th>
                <th>Hoàn thành</th>
                <th>Đã hủy</th>
                <th>Quá hạn</th>
                <th>Điểm TB</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.staffId || r.staffName}>
                  <td style={{ fontWeight: 600 }}>{r.staffName || "-"}</td>
                  <td>{r.totalAssigned ?? 0}</td>
                  <td>{r.inProgress ?? 0}</td>
                  <td>{r.completed ?? 0}</td>
                  <td>{r.cancelled ?? 0}</td>
                  <td style={{ color: (r.overdueCount ?? 0) > 0 ? "var(--color-danger)" : "var(--color-text)" }}>
                    {r.overdueCount ?? 0}
                  </td>
                  <td>{r.avgRating != null ? Number(r.avgRating).toFixed(1) : "-"}</td>
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
