import React, { useEffect, useState } from "react";
import {
  Box, TextField, Button, Typography,
  Snackbar, Alert, Stack
} from "@mui/material";
import { API_URL } from "@/lib/utility";
import { titleStyle } from "@/theme/style";


const EditAboutUs: React.FC = () => {
  const [aboutUs, setAboutUs] = useState("");
  const [contact, setContact] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error"
  });

  const fetchAboutUs = async () => {
    try {
      const res = await fetch(`${API_URL}/aboutus`);
      const data = await res.json();
      setAboutUs(data.about_us || "");
      setContact(data.contact || "");
      setAddress(data.address || "");
    } catch (err) {
      console.error(err);
      setSnackbar({
        open: true,
        message: "โหลดข้อมูลไม่สำเร็จ",
        severity: "error"
      });
    }
  };

  useEffect(() => {
    fetchAboutUs();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/aboutus/update/1`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          about_us: aboutUs,
          contact: contact,
          address: address
        }),
      });

      if (!res.ok) throw new Error("อัปเดตข้อมูลไม่สำเร็จ");

      setSnackbar({
        open: true,
        message: "บันทึกข้อมูลสำเร็จ",
        severity: "success"
      });
    } catch (err) {
      console.log(err);
      
      setSnackbar({
        open: true,
        message: "เกิดข้อผิดพลาดขณะบันทึก",
        severity: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: {md:4,xs:1}, margin: "0 auto" }}>
      <Typography fontWeight="bold" mb={2} sx={titleStyle}>
        แก้ไขข้อมูลเว็บไซต์
      </Typography>

      <Stack spacing={3}>
        <TextField
          label="เกี่ยวกับเรา"
          value={aboutUs}
          onChange={(e) => setAboutUs(e.target.value)}
          multiline
          rows={4}
          fullWidth
          InputProps={{ sx: { borderRadius: 2 } }}
        />
        <TextField
          label="ช่องทางติดต่อ"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          multiline
          rows={3}
          fullWidth
          InputProps={{ sx: { borderRadius: 2 } }}
        />
        <TextField
          label="ที่อยู่"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          multiline
          rows={3}
          fullWidth
          InputProps={{ sx: { borderRadius: 2 } }}
        />

        <Button
          variant="contained"
          color="primary"
          onClick={handleSave}
          disabled={loading}
          sx={{ fontWeight: "bold", fontFamily: "Prompt" }}
        >
          {loading ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
        </Button>
      </Stack>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EditAboutUs;
