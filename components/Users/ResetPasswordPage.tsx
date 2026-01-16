import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Box, Typography, Paper, TextField, Button, CircularProgress, Alert
} from "@mui/material";
import { API_URL } from '../../lib/utility';


const ResetPasswordPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

    useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const t = queryParams.get("token");

    if (!t) {
        setStatus("error");
        setMessage("ไม่พบ Token รีเซ็ตรหัสผ่าน");
        return;
    }

    setToken(t);
    setStatus("loading");

    // ตรวจสอบ token กับ backend
    fetch(`${API_URL}/user/validateResetToken`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ token: t }).toString(),
    })
        .then((res) => res.json())
        .then((result) => {
        if (result.valid) {
            setStatus("idle"); // พร้อมให้ผู้ใช้กรอกรหัสผ่าน
        } else {
            setStatus("error");
            setMessage(result.message || "Token ไม่ถูกต้องหรือหมดอายุ");
        }
        })
        .catch(() => {
        setStatus("error");
        setMessage("ไม่สามารถตรวจสอบ Token ได้ กรุณาลองใหม่ภายหลัง");
        });
    }, [location.search]);


  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const t = queryParams.get("token");
    if (t) setToken(t);
    else {
      setStatus("error");
      setMessage("ไม่พบ Token รีเซ็ตรหัสผ่าน");
    }
  }, [location.search]);

  const handleSubmit = async () => {
    if (!password || password.length < 6) {
      setMessage("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
      setStatus("error");
      return;
    }
    if (password !== confirm) {
      setMessage("รหัสผ่านไม่ตรงกัน");
      setStatus("error");
      return;
    }

    setStatus("loading");
    try {
      const res = await fetch(`${API_URL}/user/resetPassword`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ token, password }).toString(),
      });

      const result = await res.json();
      console.log(`${API_URL}/user/resetPassword`)
      if (res.ok) {
        
        setStatus("success");
        setMessage(result.message || "ตั้งรหัสผ่านใหม่สำเร็จ");
      } else {
        throw new Error(result.message || "เกิดข้อผิดพลาด");
      }
    } catch (err: any) {
      setStatus("error");
      setMessage(err.message);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f0f2f5",
        fontFamily: "'Noto Sans Thai', sans-serif",
      }}
    >
      <Paper sx={{ p: 4, borderRadius: 2, textAlign: "center", maxWidth: 450, width: "100%" }}>
        <Typography variant="h5" sx={{ fontWeight: "bold", mb: 2, color: "#28378B",fontFamily: "'Noto Sans Thai', sans-serif", }}>
          ตั้งรหัสผ่านใหม่
        </Typography>

        {status === "loading" ? (
          <Box><CircularProgress /></Box>
        ) : (
          <>
            {status === "error" && <Alert severity="error" sx={{ mb: 2 }}>{message}</Alert>}
            {status === "success" && (
              <>
                <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>
                <Button
                  variant="contained"
                  onClick={() => navigate("/")}
                  sx={{ mt: 1, fontFamily: "Noto Sans Thai" }}
                >
                  กลับเข้าสู่ระบบ
                </Button>
              </>
            )}

            {status !== "success" && (
              <>
                <TextField
                  label="รหัสผ่านใหม่"
                  type="password"
                  fullWidth
                  variant="outlined"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  sx={{ mb: 2 }}
                  InputProps={{ sx: { borderRadius: "12px" } }}
                />
                <TextField
                  label="ยืนยันรหัสผ่านใหม่"
                  type="password"
                  fullWidth
                  variant="outlined"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  sx={{ mb: 2 }}
                  InputProps={{ sx: { borderRadius: "12px" } }}
                />
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  onClick={handleSubmit}
                  sx={{ fontFamily: "Noto Sans Thai" }}
                >
                  ตั้งรหัสผ่านใหม่
                </Button>
              </>
            )}
          </>
        )}
      </Paper>
    </Box>
  );
};

export default ResetPasswordPage;
