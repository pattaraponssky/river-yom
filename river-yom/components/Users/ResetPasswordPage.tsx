import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryToken = searchParams.get("token");
  const theme = useTheme();
  const primary = theme.palette.primary.main;

  const [validatedToken, setValidatedToken] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<"validating" | "idle" | "submitting" | "success" | "error">("validating");
  const [message, setMessage] = useState("");
  const missingToken = !queryToken;
  const displayStatus = missingToken ? "error" : status;
  const displayMessage = missingToken ? "ไม่พบ Token รีเซ็ตรหัสผ่าน" : message;

  // ตรวจสอบ token กับ backend ครั้งเดียวตอนโหลดหน้า
  useEffect(() => {
    if (!queryToken) {
      return;
    }

    fetch(`${API_URL}/user/validateResetToken`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ token: queryToken }).toString(),
    })
      .then((res) => res.json())
      .then((result) => {
        if (result.valid) {
          setValidatedToken(queryToken);
          setStatus("idle");
          setMessage("");
        } else {
          setValidatedToken(null);
          setStatus("error");
          setMessage(result.message || "Token ไม่ถูกต้องหรือหมดอายุ");
        }
      })
      .catch(() => {
        setValidatedToken(null);
        setStatus("error");
        setMessage("ไม่สามารถตรวจสอบ Token ได้ กรุณาลองใหม่ภายหลัง");
      });
  }, [queryToken]);

  const handleSubmit = async () => {
    if (!queryToken) {
      return;
    }
    if (!password || password.length < 8) {
      setMessage("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร");
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
        body: new URLSearchParams({ token: queryToken, password }).toString(),
      });

      const result = await res.json();

      if (res.ok) {
        setStatus("success");
        setMessage(result.message || "ตั้งรหัสผ่านใหม่สำเร็จ");
      } else {
        throw new Error(result.message || "เกิดข้อผิดพลาด");
      }
    } catch (err: unknown) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    }
  };

  const tokenValid = validatedToken !== null && validatedToken === queryToken;
  const isFormStage = tokenValid && (status === "idle" || status === "submitting" || status === "error");

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

        {displayStatus === "validating" ? (
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, py: 3 }}>
            <CircularProgress />
            <Typography sx={{ fontFamily: "Prompt", color: "text.secondary", fontSize: "0.9rem" }}>
              กำลังตรวจสอบลิงก์...
            </Typography>
          </Box>
        ) : (
          <>
            {displayStatus === "error" && (
              <Alert severity="error" sx={{ mb: 2, textAlign: "left", fontFamily: "Prompt" }}>
                {displayMessage}
              </Alert>
            )}

            {displayStatus === "success" && (
              <>
                <Alert severity="success" sx={{ mb: 2, textAlign: "left", fontFamily: "Prompt" }}>
                  {displayMessage}
                </Alert>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={() => router.push('/dashboard')}
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
            {isFormStage && (
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