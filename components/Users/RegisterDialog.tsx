// RegisterDialog.tsx
import React, { useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Box, Typography, Stack,
  useMediaQuery, useTheme, Snackbar, Alert
} from "@mui/material";
import { API_URL } from '../../lib/utility';
import { textStyle } from '../../theme/style';
import { apiRequest } from "@/lib/api";

interface RegisterDialogProps {
  open: boolean;
  onClose: () => void;
}

const RegisterDialog: React.FC<RegisterDialogProps> = ({ open, onClose }) => {
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [snackbar, setSnackbar] = useState<{ open: boolean, message: string, severity: "success" | "error" }>({
    open: false,
    message: '',
    severity: "success"
  });

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleRegister = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setSnackbar({ open: true, message: "รูปแบบอีเมลไม่ถูกต้อง", severity: "error" });
      return;
    }

    if (password.length < 6) {
      setSnackbar({ open: true, message: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร", severity: "error" });
      return;
    }

    if (password !== confirmPassword) {
      setSnackbar({ open: true, message: "รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน", severity: "error" });
      return;
    }

    setLoading(true);
    try {
      const response = await apiRequest(`${API_URL}/user/register`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          username,
          name,
          email,
          password,
        }).toString(),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.messages?.error || result.message || "เกิดข้อผิดพลาดในการสมัครสมาชิก"); // handle message from CI backend
      }

      // เปลี่ยนข้อความแจ้งเตือนหลังสมัครสำเร็จ
      setSnackbar({ open: true, message: "สมัครสมาชิกสำเร็จ! กรุณาตรวจสอบอีเมลของคุณเพื่อยืนยันบัญชี", severity: "success" });
      onClose();
      setUsername("");
      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setSnackbar({ open: true, message: `เกิดข้อผิดพลาด: ${err.message}`, severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={() => { if (!loading) onClose(); }}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: "1.5rem", overflow: "hidden" } }}
      >
        <Box display="flex" flexDirection={isMobile ? "column" : "row"} height={isMobile ? "auto" : 600}>
          <Box flex={1} p={2} display="flex" flexDirection="column" justifyContent="center" sx={{ backgroundColor: "#fff" }}>
            <Box sx={{ textAlign: "center", pb: 2 }}>
              <DialogTitle sx={{ fontWeight: "bold", fontSize: "1.6rem", fontFamily: "Prompt" }}>
                สมัครสมาชิก
              </DialogTitle>
              <Typography variant="body2" color="text.secondary" sx={{ ...textStyle}}>
                โปรดกรอกข้อมูลเพื่อสร้างบัญชีใหม่
              </Typography>
            </Box>

            <DialogContent>
              <Stack spacing={2}>
                <TextField
                  label="Name"
                  fullWidth
                  variant="outlined"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                  InputProps={{ sx: { borderRadius: "12px" } }}
                />
                <TextField
                  label="Email"
                  type="email"
                  fullWidth
                  variant="outlined"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  InputProps={{ sx: { borderRadius: "12px" } }}
                />
                <TextField
                  label="Username"
                  fullWidth
                  variant="outlined"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  InputProps={{ sx: { borderRadius: "12px" } }}
                />
                <TextField
                  label="Password"
                  type="password"
                  fullWidth
                  variant="outlined"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  InputProps={{ sx: { borderRadius: "12px" } }}
                />
                <TextField
                  label="Confirm Password"
                  type="password"
                  fullWidth
                  variant="outlined"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  InputProps={{ sx: { borderRadius: "12px" } }}
                />
              </Stack>
            </DialogContent>

            <DialogActions sx={{ justifyContent: "space-between", px: 3, pb: 2 }}>
              <Button onClick={onClose} color="inherit" disabled={loading} sx={{ ...textStyle, fontFamily: "Prompt" }}>
                ยกเลิก
              </Button>
              <Button
                sx={{ ...textStyle, fontFamily: "Prompt" }}
                variant="contained"
                color="primary"
                onClick={handleRegister}
                disabled={loading}
              >
                {loading ? "กำลังสมัคร..." : "สมัครสมาชิก"}
              </Button>
            </DialogActions>
          </Box>

          <Box
            flex={1}
            p={4}
            sx={{
              backgroundImage: `url('/images/reservoir/ks.jpeg')`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
        </Box>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default RegisterDialog;