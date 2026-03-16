import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { signIn } from "../../services/authApi";
import { Mail, Lock, ArrowRight, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

import { Button, Form, Card } from "react-bootstrap";
import 'bootstrap/dist/css/bootstrap.min.css';   

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Vui lòng nhập đầy đủ");
      return;
    }

    setLoading(true);
    try {
      const data = await signIn(email, password);
      login(data);
      navigate("/");
    } catch (err) {
      console.error(err);
      toast.error("Sai email hoặc mật khẩu");
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
        backgroundPosition: "center"
      }}
    >
      {/* overlay làm tối background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.45)"
        }}
      />

      {/* LOGIN FORM */}
      <Card
        className="shadow-lg"
        style={{
          width: "420px",
          zIndex: 1,
          borderRadius: "12px"
        }}
      >
        <Card.Body className="p-4">

          {/* Title */}
          <div className="text-center mb-4">
            <h4 className="fw-bold">Building Management System</h4>
            <p className="text-muted mb-0">Admin Login</p>
          </div>

          <Form onSubmit={handleSubmit}>

            {/* Email */}
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>

              <div className="position-relative">
                <Mail
                  size={16}
                  style={{
                    position: "absolute",
                    left: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    opacity: 0.6
                  }}
                />

                <Form.Control
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ paddingLeft: "35px" }}
                />
              </div>
            </Form.Group>

            {/* Password */}
            <Form.Group className="mb-4">
              <div className="d-flex justify-content-between">
                <Form.Label>Password</Form.Label>
                <small className="text-muted">Forgot password?</small>
              </div>

              <div className="position-relative">
                <Lock
                  size={16}
                  style={{
                    position: "absolute",
                    left: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    opacity: 0.6
                  }}
                />

                <Form.Control
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingLeft: "35px" }}
                />
              </div>
            </Form.Group>

            {/* Login Button */}
            <Button
              type="submit"
              className="w-100 d-flex justify-content-center align-items-center"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2
                    size={16}
                    className="me-2"
                    style={{ animation: "spin 1s linear infinite" }}
                  />
                  Signing in...
                </>
              ) : (
                <>
                  Login
                  <ArrowRight size={16} className="ms-2" />
                </>
              )}
            </Button>

          </Form>

          <hr className="my-4" />

          <p className="text-center text-muted mb-0">
            Don't have an account?{" "}
            <Link to="/register">Register here</Link>
          </p>

        </Card.Body>
      </Card>
    </div>
  );
}

export default Login;