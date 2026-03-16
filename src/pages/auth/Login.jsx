import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { signIn } from "../../services/authApi";
import { Mail, Lock, ArrowRight, Loader2, AlertCircle } from "lucide-react";

import { Button, Form, Card, Alert } from "react-bootstrap";
import 'bootstrap/dist/css/bootstrap.min.css';

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(""); // State lưu trữ lỗi từ API

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(""); // Reset lỗi mỗi lần bấm Login

    if (!email || !password) {
      setErrorMsg("Vui lòng nhập đầy đủ email và mật khẩu");
      return;
    }

    setLoading(true);
    try {
      const data = await signIn(email, password);
      login(data);
      navigate("/");
    } catch (err) {
      console.error(err);
      // Hiển thị lỗi thực tế từ file authApi.js ném ra (ví dụ: "Acccount is deactive")
      setErrorMsg(err.message); 
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="d-flex justify-content-center align-items-center"
      style={{
        minHeight: "100vh",
        backgroundImage:
          "url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        position: "relative"
      }}
    >
      {/* overlay làm tối background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.45)",
          zIndex: 0
        }}
      />

      <Card
        className="shadow-lg border-0"
        style={{
          width: "420px",
          zIndex: 1,
          borderRadius: "16px"
        }}
      >
        <Card.Body className="p-4">
          {/* Title */}
          <div className="text-center mb-4">
            <h4 className="fw-bold text-dark">Building Management</h4>
            <p className="text-muted mb-0">Hệ thống quản lý tòa nhà</p>
          </div>

          {/* HIỂN THỊ LỖI TỪ SERVER TẠI ĐÂY */}
          {errorMsg && (
            <Alert variant="danger" className="d-flex align-items-center py-2 px-3 mb-3 border-0">
              <AlertCircle size={18} className="me-2 flex-shrink-0" />
              <div style={{ fontSize: "14px" }}>{errorMsg}</div>
            </Alert>
          )}

          <Form onSubmit={handleSubmit}>
            {/* Email */}
            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold">Email</Form.Label>
              <div className="position-relative">
                <Mail
                  size={18}
                  className="text-muted"
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    zIndex: 2
                  }}
                />
                <Form.Control
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ paddingLeft: "40px", borderRadius: "8px" }}
                  className="py-2"
                />
              </div>
            </Form.Group>

            {/* Password */}
            <Form.Group className="mb-4">
              <div className="d-flex justify-content-between align-items-center">
                <Form.Label className="small fw-semibold">Mật khẩu</Form.Label>
                <small className="text-primary text-decoration-none cursor-pointer" style={{ cursor: 'pointer' }}>
                  Quên mật khẩu?
                </small>
              </div>
              <div className="position-relative">
                <Lock
                  size={18}
                  className="text-muted"
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    zIndex: 2
                  }}
                />
                <Form.Control
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingLeft: "40px", borderRadius: "8px" }}
                  className="py-2"
                />
              </div>
            </Form.Group>

            {/* Login Button */}
            <Button
              type="submit"
              variant="primary"
              className="w-100 py-2 fw-bold shadow-sm d-flex justify-content-center align-items-center"
              style={{ borderRadius: "8px" }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2
                    size={18}
                    className="me-2 animate-spin"
                    style={{ animation: "rotation 1s infinite linear" }}
                  />
                  Đang xác thực...
                </>
              ) : (
                <>
                  Đăng nhập
                  <ArrowRight size={18} className="ms-2" />
                </>
              )}
            </Button>
          </Form>

          <style>
            {`
              @keyframes rotation {
                from { transform: rotate(0deg); }
                to { transform: rotate(359deg); }
              }
            `}
          </style>

          <hr className="my-4 opacity-25" />

          <p className="text-center text-muted mb-0 small">
            Chưa có tài khoản?{" "}
            <Link to="/register" className="text-primary fw-semibold text-decoration-none">
              Đăng ký ngay
            </Link>
          </p>
        </Card.Body>
      </Card>
    </div>
  );
}

export default Login;
