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
import { API_URL } from '../../lib/utility';
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
  
  // ตรวจสอบ dark mode
  const isDarkMode = theme.palette.mode === "dark";

  // เลือก background ตาม theme (หรือ fallback ถ้าไม่มีรูป dark)
  const leftBg = isDarkMode 
    ? "url('/images/bg_dialog.png') /* หรือสีทึบ theme.palette.background.default */" 
    : "url('/images/bg_dialog.png')";

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
            // ไม่ต้อง set background ตรงนี้ เพราะ Paper จะใช้ theme.palette.background.paper อัตโนมัติ
          },
        }}
      >
        <Box
          display="flex"
          flexDirection={isMobile ? "column" : "row"}
          height={isMobile ? "auto" : 600}
          // ให้ Dialog container เคารพ theme มากขึ้น
          sx={{ bgcolor: "background.default" }} // เพิ่มเผื่อกรณีมี gap
        >
          {/* ส่วนซ้าย - รูปภาพ / พื้นหลัง */}
          <Box
            flex={1}
            p={4}
            sx={{
              backgroundImage: leftBg,
              backgroundSize: "cover",
              backgroundPosition: "center",
              minHeight: "30vh",
              // เพิ่ม overlay เบา ๆ ใน dark mode ถ้าต้องการให้ข้อความชัดขึ้น
              ...(isDarkMode && {
                position: "relative",
                "&:after": {
                  content: '""',
                  position: "absolute",
                  inset: 0,
                  background: "rgba(0,0,0,0.45)", // overlay มืดช่วยให้ readable
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
            // ใช้สีพื้นหลังจาก theme อัตโนมัติ (paper)
            sx={{ 
              bgcolor: "background.paper",
              color: "text.primary", // ให้ข้อความหลักตาม theme
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
              // MUI v5+ TextField ปรับตาม theme อัตโนมัติดีมากแล้ว
              // แต่ถ้าอยาก control หนักกว่านี้ก็ใช้ InputProps ได้
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
                // ใช้ gradient จาก primary ถ้าต้องการ หรือปล่อย default ตาม theme
                // ถ้าอยากคง gradient เดิม แต่ปรับ opacity ใน dark mode
                background: isDarkMode
                  ? "linear-gradient(to right, #1976D2cc, #42A5F5cc)" // เพิ่มความโปร่งแสงนิดหน่อย
                  : "linear-gradient(to right, #1976D2, #42A5F5)",
                fontWeight: "bold",
                borderRadius: 999,
                py: 1.2,
                letterSpacing: 1,
                mb: 2.5,
                boxShadow: isDarkMode ? 4 : 2, // shadow เบา ๆ ใน dark mode
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
                color="primary" // เปลี่ยนจาก secondary เป็น primary ให้ดูกลมกลืนกว่า
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