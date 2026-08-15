import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  CircularProgress,
  Alert,
  InputAdornment,
  IconButton,
  useTheme,
  alpha,
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import LockIcon from "@mui/icons-material/Lock";
import { API_URL } from '../../lib/utility';

const ResetPasswordPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const primary = theme.palette.primary.main;

  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<"validating" | "idle" | "submitting" | "success" | "error">("validating");
  const [message, setMessage] = useState("");

  // ตรวจสอบ token กับ backend ครั้งเดียวตอนโหลดหน้า
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const t = queryParams.get("token");

    if (!t) {
      setStatus("error");
      setMessage("ไม่พบ Token รีเซ็ตรหัสผ่าน");
      return;
    }

    setToken(t);
    setStatus("validating");

    fetch(`${API_URL}/user/validateResetToken`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ token: t }).toString(),
    })
      .then((res) => res.json())
      .then((result) => {
        if (result.valid) {
          setStatus("idle");
          setMessage("");
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

    setStatus("submitting");
    setMessage("");
    try {
      const res = await fetch(`${API_URL}/user/resetPassword`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ token, password }).toString(),
      });

      const result = await res.json();

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

  const isFormStage = status === "idle" || status === "submitting" || status === "error";

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        bgcolor: "background.default",
        fontFamily: "'Prompt', sans-serif",
        px: 2,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 4,
          borderRadius: 3,
          textAlign: "center",
          maxWidth: 450,
          width: "100%",
          border: `1px solid ${alpha(primary, 0.12)}`,
        }}
      >
        <Typography
          variant="h5"
          sx={{ fontWeight: "bold", mb: 3, color: primary, fontFamily: "'Prompt', sans-serif" }}
        >
          ตั้งรหัสผ่านใหม่
        </Typography>

        {status === "validating" ? (
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, py: 3 }}>
            <CircularProgress />
            <Typography sx={{ fontFamily: "Prompt", color: "text.secondary", fontSize: "0.9rem" }}>
              กำลังตรวจสอบลิงก์...
            </Typography>
          </Box>
        ) : (
          <>
            {status === "error" && (
              <Alert severity="error" sx={{ mb: 2, textAlign: "left", fontFamily: "Prompt" }}>
                {message}
              </Alert>
            )}

            {status === "success" && (
              <>
                <Alert severity="success" sx={{ mb: 2, textAlign: "left", fontFamily: "Prompt" }}>
                  {message}
                </Alert>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={() => navigate("/")}
                  sx={{
                    mt: 1,
                    fontFamily: "Prompt",
                    fontWeight: 600,
                    borderRadius: "999px",
                    py: 1.2,
                    textTransform: "none",
                    background: `linear-gradient(90deg, ${primary}, ${theme.palette.secondary.main})`,
                  }}
                >
                  กลับเข้าสู่ระบบ
                </Button>
              </>
            )}

            {/* แสดงฟอร์มได้ตราบใดที่ token ยัง valid อยู่ (idle / submitting / error หลัง submit ผิดพลาด) */}
            {isFormStage && token && (
              <>
                <TextField
                  label="รหัสผ่านใหม่"
                  type={showPassword ? "text" : "password"}
                  fullWidth
                  variant="outlined"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={status === "submitting"}
                  sx={{ mb: 2 }}
                  InputProps={{
                    sx: { borderRadius: "12px" },
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon sx={{ fontSize: 20, color: primary }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword((v) => !v)}
                          edge="end"
                          size="small"
                          aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                        >
                          {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  label="ยืนยันรหัสผ่านใหม่"
                  type={showPassword ? "text" : "password"}
                  fullWidth
                  variant="outlined"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  disabled={status === "submitting"}
                  sx={{ mb: 3 }}
                  InputProps={{
                    sx: { borderRadius: "12px" },
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon sx={{ fontSize: 20, color: primary }} />
                      </InputAdornment>
                    ),
                  }}
                />
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  onClick={handleSubmit}
                  disabled={status === "submitting"}
                  sx={{
                    fontFamily: "Prompt",
                    fontWeight: 600,
                    borderRadius: "999px",
                    py: 1.2,
                    textTransform: "none",
                    background: `linear-gradient(90deg, ${primary}, ${theme.palette.secondary.main})`,
                  }}
                >
                  {status === "submitting" ? (
                    <CircularProgress size={22} sx={{ color: "#fff" }} />
                  ) : (
                    "ตั้งรหัสผ่านใหม่"
                  )}
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