import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { signIn } from "../../services/authApi";

function Login() {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      alert("Vui lòng nhập đầy đủ");
      return;
    }

    try {
      const data = await signIn(email, password);
      login(data);
      navigate("/");
    } catch (err) {
      console.error(err);
      alert("Sai email hoặc mật khẩu");
    }
  };

  return (
    <div className="min-h-screen flex">

      {/* LEFT LOGIN */}
      <div className="flex flex-col justify-center w-full lg:w-1/2 px-10">

        {/* Logo */}
        <div className="flex items-center mb-10">
          <span className="text-3xl font-bold">Logo</span>
        </div>

        {/* Form */}
        <div className="max-w-md">

          <h2 className="text-2xl font-semibold mb-6">
            Log in
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">

            <div>
              <label className="block text-sm font-medium mb-1">
                Email
              </label>

              <input
                type="email"
                placeholder="Enter email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Password
              </label>

              <input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-300"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-black text-white py-2 rounded-lg hover:bg-gray-800 transition"
            >
              Login
            </button>

          </form>

          <p className="text-sm text-gray-500 mt-4">
            Forgot password?
          </p>

          <p className="mt-6 text-sm">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="text-blue-500 font-medium hover:underline"
            >
              Register here
            </Link>
          </p>

        </div>

      </div>

      {/* RIGHT IMAGE */}
      <div className="hidden lg:block w-1/2">
        <img
          src="https://mdbcdn.b-cdn.net/img/Photos/new-templates/bootstrap-login-form/img3.webp"
          alt="login"
          className="h-screen w-full object-cover"
        />
      </div>

    </div>
  );
}

export default Login;