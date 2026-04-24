import React, { useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Box, Typography, Stack,
  useTheme, useMediaQuery, Snackbar, Alert
} from "@mui/material";
import { API_URL } from '../../lib/utility';
import { textStyle } from '../../theme/style';
import { apiRequest } from "@/lib/api";

interface ForgotPasswordDialogProps {
  open: boolean;
  onClose: () => void;
}

const ForgotPasswordDialog: React.FC<ForgotPasswordDialogProps> = ({ open, onClose }) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean, message: string, severity: "success" | "error" }>({
    open: false,
    message: "",
    severity: "success"
  });

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });

  const handleSubmit = async () => {
    if (!email) {
      setSnackbar({ open: true, message: "กรุณากรอกอีเมล", severity: "error" });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setSnackbar({ open: true, message: "รูปแบบอีเมลไม่ถูกต้อง", severity: "error" });
      return;
    }

    setLoading(true);
    try {
      const response = await apiRequest(`${API_URL}/user/forgotPassword`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ email }).toString(),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "ไม่สามารถส่งอีเมลรีเซ็ตรหัสผ่านได้");
      }

      setSnackbar({
        open: true,
        message: "ส่งลิงก์รีเซ็ตรหัสผ่านไปยังอีเมลของคุณแล้ว",
        severity: "success"
      });
      setEmail("");
      onClose();
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
        <Box display="flex" flexDirection={isMobile ? "column" : "row"} height={isMobile ? "auto" : 380}>
          <Box flex={1} p={3} display="flex" flexDirection="column" justifyContent="center" sx={{ backgroundColor: "#fff" }}>
            <DialogTitle
              sx={{
                textAlign: "center",
                fontWeight: "bold",
                fontSize: "1.6rem",
                fontFamily: "Prompt"
              }}
            >
              ลืมรหัสผ่าน
            </DialogTitle>
            <DialogContent>
              <Typography variant="body2" color="text.secondary" sx={{ ...textStyle, mb: 2, textAlign: "center" }}>
                กรุณากรอกอีเมลที่คุณใช้สมัคร ระบบจะส่งลิงก์รีเซ็ตรหัสผ่านไปให้
              </Typography>
              <Stack spacing={2}>
                <TextField
                  label="Email"
                  fullWidth
                  type="email"
                  variant="outlined"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                variant="contained"
                color="primary"
                onClick={handleSubmit}
                disabled={loading}
                sx={{ ...textStyle, fontFamily: "Prompt" }}
              >
                {loading ? "กำลังส่ง..." : "ส่งลิงก์รีเซ็ตรหัสผ่าน"}
              </Button>
            </DialogActions>
          </Box>
          <Box
            flex={1}
            sx={{
              backgroundImage: `url('/images/bg.jpg')`,
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

export default ForgotPasswordDialog;
