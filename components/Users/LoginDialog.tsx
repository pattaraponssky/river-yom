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
import ForgotPasswordDialog from "./ForgotPasswordDialog"; // ✅ เรียกใช้ component ที่คุณมีอยู่แล้ว
import { API_URL } from '../../lib/utility';
import { textStyle } from '../../theme/style';

interface User {
  iduser_level: number;
  username: string;
  email: string;
}

interface LoginDialogProps {
  open: boolean;
  onClose: () => void;
  onLoginSuccess?: (user: User) => void;
}

const LoginDialog: React.FC<LoginDialogProps> = ({ open, onClose, onLoginSuccess }) => {
  const [registerOpen, setRegisterOpen] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false); // ✅ state สำหรับ dialog ลืมรหัสผ่าน
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

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

      localStorage.setItem("user", JSON.stringify(result.user));
      if (onLoginSuccess) onLoginSuccess(result.user);
      setSnackbar({ open: true, message: "เข้าสู่ระบบสำเร็จ", severity: "success" });

      onClose();
      setTimeout(() => window.location.reload(), 300);
    } catch (err: any) {
      setSnackbar({ open: true, message: err.message, severity: "error" });
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
          sx: { borderRadius: "1.5rem", overflow: "hidden" },
        }}
      >
        <Box
          display="flex"
          flexDirection={isMobile ? "column" : "row"}
          height={isMobile ? "auto" : 600}
        >
          <Box
            flex={1}
            p={4}
            sx={{
              backgroundImage: `url('/images/bg_dialog.png')`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              minHeight:"30vh"
            }}
          />

          <Box
            flex={1}
            p={4}
            display="flex"
            flexDirection="column"
            justifyContent="center"
            sx={{ backgroundColor: "#fff" }}
          >
            <Typography
              variant="h6"
              mb={2}
              fontWeight="bold"
              textAlign="center"
              sx={{ fontFamily: "Noto Sans Thai" }}
            >
              เข้าสู่ระบบ
            </Typography>

            <TextField
              label="username"
              variant="outlined"
              fullWidth
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              sx={{ mb: 2 }}
              InputProps={{ sx: { borderRadius: "12px" } }}
            />
            <TextField
              label="password"
              variant="outlined"
              type="password"
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{ mb: 2 }}
              InputProps={{ sx: { borderRadius: "12px" } }}
            />

            <Button
              variant="contained"
              fullWidth
              onClick={handleLogin}
              sx={{
                background: "linear-gradient(to right, #1976D2, #42A5F5)",
                fontWeight: "bold",
                borderRadius: 999,
                py: 1,
                letterSpacing: 1,
                mb: 2,
              }}
            >
              LOGIN
            </Button>

            <Typography sx={{ ...textStyle }} align="center">
              ยังไม่มีบัญชี?{" "}
              <Button
                sx={{ ...textStyle }}
                variant="text"
                color="primary"
                onClick={() => {
                  onClose();
                  setRegisterOpen(true);
                }}
              >
                สมัครสมาชิก
              </Button>
            </Typography>

            {/* ✅ เพิ่มปุ่ม “ลืมรหัสผ่าน?” */}
            <Typography sx={{ ...textStyle, mt: 1 }} align="center">
              <Button
                sx={{ ...textStyle }}
                variant="text"
                color="secondary"
                onClick={() => {
                  onClose();
                  setForgotOpen(true);
                }}
              >
                ลืมรหัสผ่าน?
              </Button>
            </Typography>
          </Box>
        </Box>
      </Dialog>

      {/* ✅ เรียกใช้ component ที่คุณมีอยู่แล้ว */}
      <RegisterDialog open={registerOpen} onClose={() => setRegisterOpen(false)} />
      <ForgotPasswordDialog open={forgotOpen} onClose={() => setForgotOpen(false)} />

      {/* Snackbar แจ้งเตือน */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity as any}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default LoginDialog;
