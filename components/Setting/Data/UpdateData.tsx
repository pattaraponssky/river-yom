import React, { useRef, useState } from "react";
import {
  Paper,
  Typography,
  Button,
  Snackbar,
  Alert,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Menu,
  MenuItem,
} from "@mui/material";
import Papa from "papaparse";
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { API_URL } from "@/lib/utility"; // Adjust path as needed
import { titleStyle } from "@/theme/style";

interface PreviewRow {
  res_code: string;
  date: string;
  status: "insert" | "update";
  data: Record<string, any>;
}

const HeaderCellStyle = {
    border: "0px solid #ddd",
    fontFamily: "Prompt",
    fontWeight: "bold",
    textAlign: "center" as const,
    backgroundColor: "rgb(1, 87, 155)",
    color: "white",
    fontSize: { xs: "0.7rem", sm: "0.8rem", md: "1rem" },
  };
  
  const getCellStyle = (index: number) => ({
    border: "0px solid #ddd",
    padding: "10px",
    backgroundColor: index % 2 === 0 ? "#FAFAFA" : "#FFF",
    textAlign: "center" as const,
    fontFamily: "Prompt",
    fontSize: { xs: "0.8rem", sm: "0.9rem" , md: "1rem"},
  });
  

const UploadData: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<PreviewRow[]>([]);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">("success");
  const [fileType, setFileType] = useState<"reservoir" | "flow" | "rain" | "gate" | "sea" | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);


  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const sampleFiles = [
    { label: "ข้อมูลอ่างเก็บน้ำ (CSV)", path: "./exam-upload-data/reservoir_data.csv" },
    { label: "ข้อมูลฝน (CSV)", path: "./exam-upload-data/rain_data.csv" },
    { label: "ข้อมูลน้ำท่า (CSV)", path: "./exam-upload-data/flow_data.csv" },
    { label: "ข้อมูลประตูระบายน้ำ (CSV)", path: "./exam-upload-data/gate_data.csv" },
    { label: "ข้อมูลระดับน้ำทะเล (CSV)", path: "./exam-upload-data/sea_data.csv" },
  ];

  const handleUpload = async () => {
    if (!selectedFile || !fileType) {
      setSnackbarMessage("กรุณาเลือกไฟล์ที่รองรับก่อน");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }
    if (previewData.length === 0) {
      setSnackbarMessage("ไม่มีข้อมูลให้ส่ง");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }
  
    try {
      const dataToSend = previewData.map((item) => item.data);
  
      const apiUploadMap: Record<string, string> = {
        reservoir: `${API_URL}/api/reservoir_update_data`,
        flow: `${API_URL}/api/flow_update_data`,
        rain: `${API_URL}/api/rain_update_data`,
        gate: `${API_URL}/api/gate_update_data`,
        sea: `${API_URL}/api/sea_update_data`,
      };
  
      const response = await fetch(apiUploadMap[fileType], {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(dataToSend),
      });
  
      const data = await response.json();
  
      if (response.ok) {
        setSnackbarMessage(`อัปโหลดข้อมูลสำเร็จ (${data.updated} รายการ)`);
        setSnackbarSeverity("success");
        setPreviewData([]);
        setSelectedFile(null);
        setFileType(null);
      } else {
        setSnackbarMessage(data.message || "เกิดข้อผิดพลาดในการอัปโหลด");
        setSnackbarSeverity("error");
      }
    } catch (error) {
      console.error(error);
      setSnackbarMessage("ไม่สามารถเชื่อมต่อ API ได้");
      setSnackbarSeverity("error");
    } finally {
      setSnackbarOpen(true);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
    setPreviewData([]);
    setFileType(null);
  
    if (!file) return;
  
    const fileName = file.name.toLowerCase();
  
    // ตรวจจับประเภทไฟล์
    let type: "reservoir" | "flow" | "rain" | "gate" | "sea" | null = null;
    if (fileName.includes("reservoir")) type = "reservoir";
    else if (fileName.includes("flow")) type = "flow";
    else if (fileName.includes("rain")) type = "rain";
    else if (fileName.includes("gate")) type = "gate";
    else if (fileName.includes("sea")) type = "sea";
  
    if (!type) {
      setSnackbarMessage("กรุณาตั้งชื่อไฟล์ให้มีคำว่า reservoir, flow, rain, gate หรือ sea");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
  
    setFileType(type);
    setLoadingPreview(true);
  
    try {
      const text = await file.text();
      const parsed = Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
      });
  
      if (parsed.errors.length > 0 || parsed.data.length === 0) {
        setSnackbarMessage("ไฟล์ไม่ถูกต้องหรือไม่มีข้อมูล");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
        setPreviewData([]);
        return;
      }
  
      // เรียก API preview ตามประเภท
      const apiPreviewMap: Record<string, string> = {
        reservoir: `${API_URL}/api/reservoir_preview_update`,
        flow: `${API_URL}/api/flow_preview_update`,
        rain: `${API_URL}/api/rain_preview_update`,
        gate: `${API_URL}/api/gate_preview_update`,
        sea: `${API_URL}/api/sea_preview_update`,
      };
  
      const response = await fetch(apiPreviewMap[type], {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ [type]: parsed.data }),
      });
  
      if (!response.ok) {
        throw new Error("ไม่สามารถเรียกดูตัวอย่างข้อมูลได้");
      }
  
      const preview = await response.json();
      setPreviewData(preview);
    } catch (error) {
      setSnackbarMessage("เกิดข้อผิดพลาดในการอ่านไฟล์");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      setPreviewData([]);
    } finally {
      setLoadingPreview(false);
    }
  };
  
  return (
    <Box sx={{ fontFamily: "'Prompt', sans-serif"}}>
         <Typography sx={{ marginBottom: "1rem", fontWeight: 600, ...titleStyle, color: "#28378B" }}>
          อัปโหลดข้อมูลย้อนหลัง
        </Typography>
      <Paper sx={{ p: { xs: 2, sm: 4 }, borderRadius: 2, backgroundColor: "#f0f0f0" }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            flexDirection: "column",
            gap: 2,
          }}
        >
          {fileType && (
            <Typography
              sx={{
                ...titleStyle,
                fontWeight: "bold",
                color: "#333",
                textAlign: "center",
                mt: 1,
              }}
            >
              ประเภทข้อมูล: <strong>{fileType}</strong>
            </Typography>
          )}
          {previewData.length === 0 && (
            <Button
            component="label"
            fullWidth
            sx={{
              fontWeight: "bold",
              ...titleStyle,
              backgroundColor: "#198754",
              color: "#fff",
              borderRadius: 2,
              textTransform: "none",
              minHeight: "60px",
              width: "100%",
              maxWidth: 400,
            }}
            >
           เลือกไฟล์ข้อมูล (.csv)
            <input type="file" hidden accept=".csv" ref={fileInputRef} onChange={handleFileChange} />
          </Button>
          )}
  
          {selectedFile && (
            <Typography
              sx={{
                ...titleStyle,
                color: "text.secondary",
                wordBreak: "break-word",
                textAlign: "center",
                my:1
              }}
            >
              ไฟล์ที่เลือก: {selectedFile.name}
            </Typography>
          )}
        </Box>
  
        {loadingPreview && (
          <Box textAlign="center" my={3}>
            <CircularProgress />
            <Typography sx={{ mt: 2, ...titleStyle }} color="text.secondary">
              กำลังโหลดตัวอย่างข้อมูล...
            </Typography>
          </Box>
        )}
  
        {!loadingPreview && previewData.length > 0 && previewData[0] && (
          <>
            <Typography sx={{ fontSize: "1.1rem", fontWeight: "bold" }} gutterBottom fontFamily="'Prompt', sans-serif">
              สถานะข้อมูลที่ถูกอัปเดต
            </Typography>
            <TableContainer sx={{ maxHeight: 500, mb: 2 }}>
              <Table stickyHeader size="small" aria-label="preview table">
                <TableHead>
                  <TableRow>
                    {Object.keys(previewData[0].data).map((key) => (
                      <TableCell key={key} sx={HeaderCellStyle}>
                        {key}
                      </TableCell>
                    ))}
                    <TableCell sx={HeaderCellStyle}>สถานะ</TableCell>
                  </TableRow>
                </TableHead>
  
                <TableBody>
                  {previewData.slice(0, 100).map((row, idx) => (
                    <TableRow key={idx}>
                      {Object.keys(row.data).map((col) => (
                        <TableCell key={col} sx={getCellStyle(idx)}>
                          {row.data[col]}
                        </TableCell>
                      ))}
                      <TableCell
                        sx={{
                          ...getCellStyle(idx),
                          fontWeight: "bold",
                          color: row.status === "insert" ? "green" : "orange",
                        }}
                      >
                        {row.status === "insert" ? "เพิ่มข้อมูล" : "อัปเดต"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Typography sx={{ fontSize: "0.9rem", fontWeight: "bold", color: "red" }} gutterBottom fontFamily="'Prompt', sans-serif">
              แสดงสูงสุดแค่ 100 ข้อมูลแรก
            </Typography>
          </>
        )}
  
        {!loadingPreview && previewData.length === 0 && selectedFile && (
          <Typography color="textSecondary" mt={2} fontFamily="'Prompt', sans-serif">
            ไฟล์นี้ไม่มีข้อมูลที่จะแสดง
          </Typography>
        )}
  
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            gap: 2,
            mt: 2,
          }}
        >
          <Button
            variant="contained"
            color="success"
            onClick={handleUpload}
            disabled={!selectedFile || previewData.length === 0}
            sx={{
              fontSize: "1rem",
              fontFamily: "'Prompt', sans-serif",
              borderRadius: 2,
              width: { xs: "100%", sm: "auto" },
            }}
          >
            อัปโหลด
          </Button>
          {!loadingPreview && previewData.length > 0 && previewData[0] && (
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              setSelectedFile(null);
              setPreviewData([]);
              if (fileInputRef.current) {
                fileInputRef.current.value = ""; // รีเซ็ต input
              }
            }}
            sx={{
              fontSize: "1rem",
              fontFamily: "'Prompt', sans-serif",
              borderRadius: 2,
              width: { xs: "100%", sm: "auto" },
            }}
          >
            ยกเลิก
          </Button>
          )}
        <Button
            variant="contained"
            onClick={handleClick}
            endIcon={<ArrowDropDownIcon />}
            sx={{
              fontSize: "1rem",
              fontFamily: "'Prompt', sans-serif",
              backgroundColor: "#1976d2",
              color: "white",
              borderRadius: 2,
              textTransform: "none",
              "&:hover": {
                backgroundColor: "#115293",
              },
              width: { xs: "100%", sm: "auto" },
            }}
          >
            ดาวน์โหลดไฟล์ตัวอย่าง
          </Button>

          <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
            {sampleFiles.map((file) => (
              <MenuItem
                key={file.path}
                component="a"
                href={file.path}
                download
                onClick={handleClose}
                sx={{ fontFamily: "'Prompt', sans-serif" }}
              >
                {file.label}
              </MenuItem>
            ))}
          </Menu>
        </Box>
      </Paper>
  
      <Snackbar open={snackbarOpen} autoHideDuration={5000} onClose={() => setSnackbarOpen(false)}>
        <Alert severity={snackbarSeverity} onClose={() => setSnackbarOpen(false)} sx={{ fontFamily: "'Prompt', sans-serif" }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};  

export default UploadData;