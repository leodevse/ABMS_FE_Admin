import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import router from "./routes/AppRouter";
import AuthProvider from "./context/AuthProvider";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            borderRadius: "12px",
            padding: "12px 14px",
            background: "#0f172a",
            color: "#f8fafc",
            boxShadow: "0 12px 30px rgba(15, 23, 42, 0.25)",
          },
          success: {
            iconTheme: { primary: "#22c55e", secondary: "#f0fdf4" },
            style: { background: "#14532d", color: "#dcfce7" },
          },
          error: {
            iconTheme: { primary: "#ef4444", secondary: "#fef2f2" },
            style: { background: "#7f1d1d", color: "#fee2e2" },
          },
        }}
      />
    </AuthProvider>
  </React.StrictMode>
);