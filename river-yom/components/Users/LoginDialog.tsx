import React, { useState } from "react";
import {
  Dialog,
  Box,
  TextField,
  Button,
  Typography,
  useMediaQuery,
  useTheme,
  Snackbar,
  Alert,
} from "@mui/material";
import RegisterDialog from "./RegisterDialog";
import ForgotPasswordDialog from "./ForgotPasswordDialog";
import { API_URL, Path_URL } from '../../lib/utility';
import { textStyle } from '../../theme/style';

interface LoginDialogProps {
  open: boolean;
  onClose: () => void;
  onLoginSuccess?: () => void;
}

const LoginDialog: React.FC<LoginDialogProps> = ({ open, onClose, onLoginSuccess }) => {
  const [registerOpen, setRegisterOpen] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [snackbar, setSnackbar] = useState({ 
    open: false, 
    message: "", 
    severity: "success" as "success" | "error" | "info" | "warning" 
  });

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isDarkMode = theme.palette.mode === "dark";

  // path รูปพื้นหลังฝั่งซ้าย (ตอนนี้ใช้รูปเดียวกันทั้ง light/dark)
  const leftBgUrl = `${Path_URL}/images/bg_dialog.jpg`;

  const handleLogin = async () => {
    try {
      const response = await fetch(`${API_URL}/user/login`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          username,
          password,
        }).toString(),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "เกิดข้อผิดพลาด");
      onLoginSuccess?.();

      setSnackbar({
        open: true,
        message: "เข้าสู่ระบบสำเร็จ",
        severity: "success",
      });

      onClose();
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err.message,
        severity: "error",
      });
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { 
            borderRadius: "1.5rem", 
            overflow: "hidden",
          },
        }}
      >
        <Box
          display="flex"
          flexDirection={isMobile ? "column" : "row"}
          height={isMobile ? "auto" : 600}
          sx={{ bgcolor: "background.default" }}
        >
          {/* ส่วนซ้าย - รูปภาพ / พื้นหลัง */}
          <Box
            flex={1}
            p={4}
            sx={{
              // แก้บั๊ก: ต้องห่อ path ด้วย url() ไม่งั้น CSS จะไม่แสดงรูปเลย
              backgroundImage: `url("${leftBgUrl}")`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              minHeight: "30vh",
              display: { xs: "none", sm: "block" }, // ซ่อนบน mobile จอเล็กมากถ้าพื้นที่ไม่พอ (ปรับได้ตามต้องการ)
              ...(isDarkMode && {
                position: "relative",
                "&:after": {
                  content: '""',
                  position: "absolute",
                  inset: 0,
                  background: "rgba(0,0,0,0.45)",
                  pointerEvents: "none",
                },
              }),
            }}
          />

          {/* ส่วนขวา - ฟอร์ม */}
          <Box
            flex={1}
            p={4}
            display="flex"
            flexDirection="column"
            justifyContent="center"
            sx={{ 
              bgcolor: "background.paper",
              color: "text.primary",
            }}
          >
            <Typography
              variant="h6"
              mb={3}
              fontWeight="bold"
              textAlign="center"
              sx={{ fontFamily: "Prompt" }}
            >
              เข้าสู่ระบบ
            </Typography>

            <TextField
              label="username"
              variant="outlined"
              fullWidth
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              sx={{ mb: 2.5 }}
            />

            <TextField
              label="password"
              variant="outlined"
              type="password"
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{ mb: 3 }}
            />

            <Button
              variant="contained"
              fullWidth
              onClick={handleLogin}
              sx={{
                background: isDarkMode
                  ? "linear-gradient(to right, #1976D2cc, #42A5F5cc)"
                  : "linear-gradient(to right, #1976D2, #42A5F5)",
                fontWeight: "bold",
                borderRadius: 999,
                py: 1.2,
                letterSpacing: 1,
                mb: 2.5,
                boxShadow: isDarkMode ? 4 : 2,
              }}
            >
              LOGIN
            </Button>

            <Typography 
              variant="body2" 
              align="center" 
              color="text.secondary"
              sx={{ ...textStyle }}
            >
              ยังไม่มีบัญชี?{" "}
              <Button
                variant="text"
                color="primary"
                onClick={() => {
                  onClose();
                  setRegisterOpen(true);
                }}
                sx={{ textTransform: "none", fontWeight: 500 }}
              >
                สมัครสมาชิก
              </Button>
            </Typography>

            <Typography 
              variant="body2" 
              align="center" 
              color="text.secondary"
              sx={{ mt: 1, ...textStyle }}
            >
              <Button
                variant="text"
                color="primary"
                onClick={() => {
                  onClose();
                  setForgotOpen(true);
                }}
                sx={{ textTransform: "none", fontWeight: 500 }}
              >
                ลืมรหัสผ่าน?
              </Button>
            </Typography>
          </Box>
        </Box>
      </Dialog>

      <RegisterDialog open={registerOpen} onClose={() => setRegisterOpen(false)} />
      <ForgotPasswordDialog open={forgotOpen} onClose={() => setForgotOpen(false)} />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default LoginDialog;