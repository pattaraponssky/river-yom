// VerifyEmailPage.tsx
import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom"; // ต้องติดตั้ง react-router-dom
import { Box, Typography, CircularProgress, Alert, Paper, Button } from "@mui/material";
import { API_URL } from '../../lib/utility';

const VerifyEmailPage: React.FC = () => {
  const location = useLocation();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const [username, setUsername] = useState("");

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const token = queryParams.get("token");

    if (!token) {
      setStatus("error");
      setMessage("ลิงก์ยืนยันไม่สมบูรณ์ หรือไม่มี Token");
      return;
    }

    const verifyToken = async () => {
      try {
        const response = await fetch(`${API_URL}/verify-email?token=${token}`, {
          method: "GET",
          credentials: "include",
        });
        const result = await response.json();

        if (response.ok) {
          setStatus("success");
          setMessage(result.message || "ยืนยันอีเมลสำเร็จ! บัญชีของคุณพร้อมใช้งานแล้ว");
          setUsername(result.username || "");
          console.log("Verification successful:", result);
          
        } else {
          setStatus("error");
          setMessage(result.message || "เกิดข้อผิดพลาดในการยืนยันอีเมล");
          console.log("Verification failed:", result);
          
        }
      } catch (err: any) {
        setStatus("error");
        setMessage(`ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้: ${err.message}`);
      }
    };

    verifyToken();
  }, [location.search]); // Re-run if query params change

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        backgroundColor: "#f0f2f5",
        fontFamily: "'Prompt', sans-serif",
      }}
    >
      <Paper sx={{ p: 4, borderRadius: 2, textAlign: "center", maxWidth: 500, width: "100%" }}>
        <Typography variant="h5" sx={{ fontWeight: "bold", mb: 2, color: "#28378B",fontFamily: "Prompt"  }}>
          สถานะการยืนยันอีเมล
        </Typography>
        {status === "loading" && (
          <Box>
            <CircularProgress sx={{ mb: 2 }} />
            <Typography>กำลังตรวจสอบลิงก์ยืนยัน...</Typography>
          </Box>
        )}
        {status === "success" && (
          <Alert severity="success" sx={{ mb: 2 }}>
            <Typography sx={{ fontFamily: "Prompt" }}>
              {message}
              {username && (
                <Box component="span" sx={{ display: "block", mt: 1 }}>
                  ชื่อผู้ใช้ของคุณ: <strong>{username}</strong>
                </Box>
              )}
              คำขอลงทะเบียนสำเร็จแล้ว กรุณารอผู้ดูแลยืนยันบัญชีของคุณ
            </Typography>
          </Alert>
        )}
        {status === "error" && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography sx={{fontSize:"1.1rem", fontFamily: "Prompt" }}>{message}</Typography>
          </Alert>
        )}
        {/* อาจเพิ่มปุ่มกลับหน้า Login หรือ Home */}
        <Button variant="contained" href="/" sx={{ fontSize:"1.1rem",mt: 2, fontFamily: "Prompt" }}>
          กลับสู่หน้าหลัก
        </Button>
      </Paper>
    </Box>
  );
};

export default VerifyEmailPage;