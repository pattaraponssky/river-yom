import React, { useState } from "react";
import {
  Paper,
  Typography,
  Button,
  Snackbar,
  Alert,
  Box,
  CircularProgress,
} from "@mui/material";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { format } from "date-fns";
import { th } from "date-fns/locale"; // Import Thai locale for date-fns
import { API_URL } from "@/lib/utility"; // Adjust path as needed
import { titleStyle } from "@/theme/style";

const ManualUpdateGate: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">("success");

  // State for date range selection
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const handleUpdate = async () => {
    // 1. Validate dates
    if (!startDate || !endDate) {
      setSnackbarMessage("กรุณาเลือกวันเริ่มต้นและวันสิ้นสุด");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }

    if (startDate.getTime() > endDate.getTime()) {
      setSnackbarMessage("วันเริ่มต้นต้องไม่เกินวันสิ้นสุด");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }

    // 2. Format dates to YYYY-MM-DD
    const formattedStartDate = format(startDate, "yyyy-MM-dd");
    const formattedEndDate = format(endDate, "yyyy-MM-dd");

    // 3. Construct API URL for Gate Data
    // This is the key change from ManualUpdateReservoir
    const apiUrl = `${API_URL}/jobs/updateGateFillData/${formattedStartDate}/${formattedEndDate}`;
    console.log("Calling API:", apiUrl);

    setLoading(true);
    setSnackbarOpen(false); // Close any existing snackbar

    try {
      const response = await fetch(apiUrl, {
        method: "GET", // This is a GET request as per your routes example
        credentials: "include", // Include cookies, if necessary for authentication
      });

      const data = await response.json(); // Assuming the API returns JSON

      if (response.ok) {
        setSnackbarMessage(
          data.message || `อัปเดตข้อมูลน้ำท่าสำเร็จสำหรับช่วง ${formattedStartDate} ถึง ${formattedEndDate}`
        );
        setSnackbarSeverity("success");
      } else {
        setSnackbarMessage(data.message || "เกิดข้อผิดพลาดในการอัปเดตข้อมูล");
        setSnackbarSeverity("error");
      }
    } catch (error) {
      console.error("Error updating gate data:", error);
      setSnackbarMessage("ไม่สามารถเชื่อมต่อ API ได้ หรือเกิดข้อผิดพลาดเครือข่าย");
      setSnackbarSeverity("error");
    } finally {
      setLoading(false);
      setSnackbarOpen(true);
    }
  };

  return (
    <Box sx={{ fontFamily: "'Prompt', sans-serif", mt: {md:4,xs:2} }}>
      <Typography variant="h5" sx={{ marginBottom: "1rem", fontWeight: 600, ...titleStyle, color: "#28378B" }}>
        อัปเดตข้อมูลประตูระบายน้ำ (กำหนดวันที่)
      </Typography>
      <Paper sx={{ p: { xs: 2, sm: 4 }, borderRadius: 2, backgroundColor: "#f0f0f0" }}>
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={th}>
          <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 2, mb: 3 }}>
            <DatePicker
              label="วันเริ่มต้น"
              value={startDate}
              onChange={(newValue: React.SetStateAction<Date | null>) => setStartDate(newValue)}
              slotProps={{ textField: { fullWidth: true, InputLabelProps: { sx: { fontFamily: "Prompt" } }, inputProps: { sx: { fontFamily: "Prompt" } } } }}
              format="dd/MM/yyyy"
            />
            <DatePicker
              label="วันสิ้นสุด"
              value={endDate}
              onChange={(newValue: React.SetStateAction<Date | null>) => setEndDate(newValue)}
              slotProps={{ textField: { fullWidth: true, InputLabelProps: { sx: { fontFamily: "Prompt" } }, inputProps: { sx: { fontFamily: "Prompt" } } } }}
              format="dd/MM/yyyy"
            />
          </Box>
        </LocalizationProvider>

        <Button
          variant="contained"
          color="primary"
          onClick={handleUpdate}
          disabled={loading || !startDate || !endDate}
          sx={{
            ...titleStyle,
            borderRadius: 2,
            width: { xs: "100%", sm: "auto" },
            minWidth: 150,
          }}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : "อัปเดตข้อมูล"}
        </Button>
      </Paper>

      <Snackbar open={snackbarOpen} autoHideDuration={5000} onClose={() => setSnackbarOpen(false)}>
        <Alert severity={snackbarSeverity} onClose={() => setSnackbarOpen(false)} sx={{ fontFamily: "'Prompt', sans-serif" }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ManualUpdateGate;