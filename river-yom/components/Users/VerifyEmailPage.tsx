// VerifyEmailPage.tsx
import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Box, Typography, CircularProgress, Alert, Paper, Button } from "@mui/material";
import { API_URL } from '../../lib/utility';

const VerifyEmailPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const [username, setUsername] = useState("");
  const missingToken = !token;
  const displayStatus = missingToken ? "error" : status;
  const displayMessage = missingToken ? "ลิงก์ยืนยันไม่สมบูรณ์ หรือไม่มี Token" : message;

  useEffect(() => {
    if (!token) {
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
        } else {
          setStatus("error");
          setMessage(result.message || "เกิดข้อผิดพลาดในการยืนยันอีเมล");
        }
      } catch (err: unknown) {
        setStatus("error");
        setMessage(`ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้: ${err instanceof Error ? err.message : "ไม่ทราบสาเหตุ"}`);
      }
    };

    verifyToken();
  }, [token]);

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
        {displayStatus === "loading" && (
          <Box>
            <CircularProgress sx={{ mb: 2 }} />
            <Typography>กำลังตรวจสอบลิงก์ยืนยัน...</Typography>
          </Box>
        )}
        {displayStatus === "success" && (
          <Alert severity="success" sx={{ mb: 2 }}>
            <Typography sx={{ fontFamily: "Prompt" }}>
              {displayMessage}
              {username && (
                <Box component="span" sx={{ display: "block", mt: 1 }}>
                  ชื่อผู้ใช้ของคุณ: <strong>{username}</strong>
                </Box>
              )}
              คำขอลงทะเบียนสำเร็จแล้ว กรุณารอผู้ดูแลยืนยันบัญชีของคุณ
            </Typography>
          </Alert>
        )}
        {displayStatus === "error" && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography sx={{fontSize:"1.1rem", fontFamily: "Prompt" }}>{displayMessage}</Typography>
          </Alert>
        )}
        <Button
          variant="contained"
          onClick={() => router.push('/dashboard')}
          sx={{ fontSize: "1.1rem", mt: 2, fontFamily: "Prompt" }}
        >
          กลับสู่หน้าหลัก
        </Button>
      </Paper>
    </Box>
  );
};

export default VerifyEmailPage;