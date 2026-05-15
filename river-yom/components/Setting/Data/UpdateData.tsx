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
  Chip,
} from "@mui/material";
import Papa from "papaparse";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import DownloadIcon from "@mui/icons-material/Download";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { API_URL } from "@/lib/utility";
import { getCellStyle, HeaderCellStyle, titleStyle } from "@/theme/style";
import { apiRequest } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PreviewRow {
  res_code: string;
  date: string;
  status: "insert" | "update";
  data: Record<string, any>;
}

type FileType = "reservoir" | "flow" | "rain" | "gate" | "sea";

// ─── Constants ────────────────────────────────────────────────────────────────

const sampleFiles: { key: FileType; label: string; path: string }[] = [
  // { key: "reservoir", label: "ข้อมูลอ่างเก็บน้ำ", path: "./exam-upload-data/reservoir_data.csv" },
  { key: "rain", label: "ข้อมูลฝน",              path: "./exam-upload-data/rain_data.csv"  },
  { key: "flow", label: "ข้อมูลน้ำท่า",           path: "./exam-upload-data/flow_data.csv"  },
  { key: "gate", label: "ข้อมูลประตูระบายน้ำ",    path: "./exam-upload-data/gate_data.csv"  },
  // { key: "sea",  label: "ข้อมูลระดับน้ำทะเล",    path: "./exam-upload-data/sea_data.csv"   },
];

const API_PREVIEW_MAP: Record<FileType, string> = {
  reservoir: `${API_URL}/api/reservoir_preview_update`,
  flow:      `${API_URL}/api/flow_preview_update`,
  rain:      `${API_URL}/api/rain_preview_update`,
  gate:      `${API_URL}/api/gate_preview_update`,
  sea:       `${API_URL}/api/sea_preview_update`,
};

const API_UPLOAD_MAP: Record<string, string> = {
  // reservoir: `${API_URL}/api/reservoir_update_data`,
  flow: `${API_URL}/api/flow_update_data`,
  rain: `${API_URL}/api/rain_update_data`,
  gate: `${API_URL}/api/gate_update_data`,
  // sea:  `${API_URL}/api/sea_update_data`,
};

// ─── Component ────────────────────────────────────────────────────────────────

const UploadData: React.FC = () => {
  const [selectedFile, setSelectedFile]     = useState<File | null>(null);
  const [previewData, setPreviewData]       = useState<PreviewRow[]>([]);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [uploading, setUploading]           = useState(false);
  const [fileType, setFileType]             = useState<FileType | null>(null);
  const [isDragging, setIsDragging]         = useState(false);
  const [snackbarOpen, setSnackbarOpen]         = useState(false);
  const [snackbarMessage, setSnackbarMessage]   = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">("success");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Helpers ──────────────────────────────────────────────────────────────

  const showSnackbar = (msg: string, sev: "success" | "error") => {
    setSnackbarMessage(msg);
    setSnackbarSeverity(sev);
    setSnackbarOpen(true);
  };

  const resetState = () => {
    setSelectedFile(null);
    setFileType(null);
    setPreviewData([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ─── File processing ──────────────────────────────────────────────────────

  const processFile = async (file: File) => {
    resetState();
    setSelectedFile(file);

    const name = file.name.toLowerCase();
    const type = (["reservoir", "flow", "rain", "gate", "sea"] as FileType[]).find((t) =>
      name.includes(t)
    ) ?? null;

    if (!type) {
      showSnackbar("กรุณาตั้งชื่อไฟล์ให้มีคำว่า flow, rain หรือ gate", "error");
      if (fileInputRef.current) fileInputRef.current.value = "";
      setSelectedFile(null);
      return;
    }

    setFileType(type);
    setLoadingPreview(true);

    try {
      const text = await file.text();
      const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });

      if (parsed.errors.length > 0 || parsed.data.length === 0) {
        showSnackbar("ไฟล์ไม่ถูกต้องหรือไม่มีข้อมูล", "error");
        setPreviewData([]);
        return;
      }

      const response = await apiRequest(API_PREVIEW_MAP[type], {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ [type]: parsed.data }),
      });

      if (!response.ok) throw new Error("preview failed");

      const preview = await response.json();
      setPreviewData(preview);
    } catch {
      showSnackbar("เกิดข้อผิดพลาดในการอ่านไฟล์", "error");
      setPreviewData([]);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  // ─── Upload ───────────────────────────────────────────────────────────────

  const handleUpload = async () => {
    if (!selectedFile || !fileType || previewData.length === 0) return;

    setUploading(true);
    try {
      const response = await apiRequest(API_UPLOAD_MAP[fileType], {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(previewData.map((r) => r.data)),
      });

      const data = await response.json();

      if (response.ok) {
        showSnackbar(`อัปโหลดข้อมูลสำเร็จ (${data.updated} รายการ)`, "success");
        resetState();
      } else {
        showSnackbar(data.message || "เกิดข้อผิดพลาดในการอัปโหลด", "error");
      }
    } catch {
      showSnackbar("ไม่สามารถเชื่อมต่อ API ได้", "error");
    } finally {
      setUploading(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <Box sx={{ fontFamily: "'Prompt', sans-serif" }}>
      <Typography sx={{ mb: "1rem", fontWeight: 600, ...titleStyle, color: "#28378B" }}>
        อัปโหลดข้อมูลย้อนหลัง
      </Typography>

      <Paper sx={{ p: { xs: 2, sm: 4 }, borderRadius: 2 }}>

        {/* ── ขั้นตอนการใช้งาน ── */}
        <Box sx={{ mb: 3 }}>
          <Typography sx={{ fontSize: "1rem", fontWeight: 600, color: "text.disabled", letterSpacing: "0.06em", mb: 1.5, textTransform: "uppercase", fontFamily: "'Prompt', sans-serif" }}>
            ขั้นตอนการใช้งาน
          </Typography>
          {[
            { n: 1, main: "ดาวน์โหลดไฟล์ตัวอย่างด้านล่าง",                    sub: "เลือกประเภทข้อมูลที่ต้องการ: flow / rain / gate" },
            { n: 2, main: "กรอกข้อมูลในไฟล์ตัวอย่าง โดยคงชื่อไฟล์เดิมไว้",        sub: "ระบบตรวจจับประเภทจากชื่อไฟล์ — อย่าเปลี่ยนชื่อ" },
            { n: 3, main: "เลือกไฟล์เพื่ออัปโหลด ระบบจะแสดงตัวอย่างก่อนบันทึก",   sub: "ตรวจสอบสถานะ insert / update แล้วกด ยืนยัน" },
          ].map((s) => (
            <Box key={s.n} sx={{ display: "flex", gap: 1.5, mb: 1.5, alignItems: "flex-start" }}>
              <Box sx={{ width: 24, height: 24, borderRadius: "50%", bgcolor: "#28378B", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 600, flexShrink: 0, mt: "2px" }}>
                {s.n}
              </Box>
              <Box>
                <Typography sx={{ fontFamily: "'Prompt', sans-serif", fontSize: "0.975rem", color: "text.primary", lineHeight: 1.5 }}>{s.main}</Typography>
                <Typography sx={{ fontFamily: "'Prompt', sans-serif", fontSize: "0.875rem", color: "text.secondary" }}>{s.sub}</Typography>
              </Box>
            </Box>
          ))}
        </Box>

        <Box sx={{ height: "0.5px", bgcolor: "divider", mb: 3 }} />

        {/* ── ไฟล์ตัวอย่าง ── */}
        <Box sx={{ mb: 3 }}>
          <Typography sx={{ fontFamily: "'Prompt', sans-serif", fontSize: "0.75rem", fontWeight: 600, color: "text.disabled", letterSpacing: "0.06em", mb: 1.5, textTransform: "uppercase" }}>
            ไฟล์ตัวอย่าง
          </Typography>
          {sampleFiles.map((f) => (
            <Box
              key={f.key}
              sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2, py: 1.25, mb: 1, borderRadius: 1.5, bgcolor: "grey.50", border: "0.5px solid", borderColor: "divider" }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <UploadFileIcon sx={{ fontSize: 18, color: "#185FA5" }} />
                <Typography sx={{ fontFamily: "'Prompt', sans-serif", fontSize: "0.875rem" }}>{f.label}</Typography>
                <Chip label={f.key} size="small" sx={{ fontFamily: "'Prompt', sans-serif", fontSize: "0.7rem", height: 20, bgcolor: "#E6F1FB", color: "#0C447C" }} />
              </Box>
              <Button
                component="a"
                href={f.path}
                download
                size="small"
                startIcon={<DownloadIcon sx={{ fontSize: 15 }} />}
                sx={{ fontFamily: "'Prompt', sans-serif", fontSize: "0.75rem", color: "#185FA5", textTransform: "none", minWidth: "auto", px: 1 }}
              >
                ดาวน์โหลด
              </Button>
            </Box>
          ))}
        </Box>

        <Box sx={{ height: "0.5px", bgcolor: "divider", mb: 3 }} />

        {/* ── Drop zone / ไฟล์ที่เลือก ── */}
        {selectedFile ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 2.5, py: 2, borderRadius: 2, bgcolor: "grey.50", border: "0.5px solid", borderColor: "divider" }}>
            <UploadFileIcon sx={{ color: "#28378B", fontSize: 22, flexShrink: 0 }} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontFamily: "'Prompt', sans-serif", fontWeight: 600, fontSize: "0.875rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {selectedFile.name}
              </Typography>
              {fileType && (
                <Typography sx={{ fontFamily: "'Prompt', sans-serif", fontSize: "0.75rem", color: "text.secondary" }}>
                  ประเภท: <strong>{fileType}</strong> · {(selectedFile.size / 1024).toFixed(1)} KB
                </Typography>
              )}
            </Box>
            <Button
              size="small"
              onClick={resetState}
              sx={{ fontFamily: "'Prompt', sans-serif", fontSize: "0.75rem", color: "text.secondary", textTransform: "none" }}
            >
              เปลี่ยนไฟล์
            </Button>
          </Box>
        ) : (
          <Box
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            sx={{
              border: "1.5px dashed",
              borderColor: isDragging ? "#28378B" : "divider",
              borderRadius: 2,
              py: 4,
              px: 2,
              textAlign: "center",
              bgcolor: isDragging ? "rgba(40,55,139,0.04)" : "grey.50",
              transition: "all 0.2s",
              cursor: "pointer",
              "&:hover": { borderColor: "#28378B", bgcolor: "rgba(40,55,139,0.03)" },
            }}
          >
            <FolderOpenIcon sx={{ fontSize: 36, color: isDragging ? "#28378B" : "text.disabled", mb: 1 }} />
            <Typography sx={{ fontFamily: "'Prompt', sans-serif", fontSize: "0.9rem", fontWeight: 500, color: "text.primary", mb: 0.5 }}>
              ลากไฟล์มาวางที่นี่ หรือกดเพื่อเลือก
            </Typography>
            <Typography sx={{ fontFamily: "'Prompt', sans-serif", fontSize: "0.75rem", color: "text.secondary" }}>
              รองรับเฉพาะไฟล์ .csv · ชื่อไฟล์ต้องมีคำว่า flow / rain / gate
            </Typography>
            <input type="file" hidden accept=".csv" ref={fileInputRef} onChange={handleFileChange} />
          </Box>
        )}

        {/* ── Loading ── */}
        {loadingPreview && (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <CircularProgress size={28} sx={{ color: "#28378B" }} />
            <Typography sx={{ fontFamily: "'Prompt', sans-serif", mt: 1.5, color: "text.secondary", fontSize: "0.875rem" }}>
              กำลังโหลดตัวอย่างข้อมูล...
            </Typography>
          </Box>
        )}

        {/* ── Preview table ── */}
        {!loadingPreview && previewData.length > 0 && previewData[0] && (
          <Box sx={{ mt: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
              <Typography sx={{ fontFamily: "'Prompt', sans-serif", fontWeight: 600, fontSize: "0.9rem" }}>
                ตัวอย่างข้อมูลที่จะอัปเดต
              </Typography>
              <Typography sx={{ fontFamily: "'Prompt', sans-serif", fontSize: "0.75rem", color: "error.main" }}>
                แสดงสูงสุด 100 แถวแรก
              </Typography>
            </Box>
            <TableContainer sx={{ maxHeight: 500, mb: 2, borderRadius: 2, border: "0.5px solid", borderColor: "divider" }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    {Object.keys(previewData[0].data).map((key) => (
                      <TableCell key={key} sx={HeaderCellStyle}>{key}</TableCell>
                    ))}
                    <TableCell sx={HeaderCellStyle}>สถานะ</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {previewData.slice(0, 100).map((row, idx) => (
                    <TableRow key={idx}>
                      {Object.keys(row.data).map((col) => (
                        <TableCell key={col} sx={getCellStyle(idx)}>{row.data[col]}</TableCell>
                      ))}
                      <TableCell
                        sx={getCellStyle(idx)}
                        style={{ fontWeight: "bold", color: row.status === "insert" ? "green" : "orange" }}
                      >
                        {row.status === "insert" ? "เพิ่มข้อมูล" : "อัปเดต"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {!loadingPreview && previewData.length === 0 && selectedFile && (
          <Typography sx={{ fontFamily: "'Prompt', sans-serif", color: "text.secondary", mt: 2, fontSize: "0.875rem" }}>
            ไฟล์นี้ไม่มีข้อมูลที่จะแสดง
          </Typography>
        )}

        {/* ── Action buttons ── */}
        <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 1.5, mt: 3, flexWrap: "wrap" }}>
          <Button
            variant="contained"
            startIcon={uploading ? <CircularProgress size={16} color="inherit" /> : <CheckCircleOutlineIcon />}
            onClick={handleUpload}
            disabled={!selectedFile || previewData.length === 0 || uploading}
            sx={{
              fontFamily: "'Prompt', sans-serif",
              bgcolor: "#1a7a44",
              "&:hover": { bgcolor: "#145f35" },
              borderRadius: 1.5,
              textTransform: "none",
              fontSize: "0.9rem",
              px: 3,
              width: { xs: "100%", sm: "auto" },
            }}
          >
            {uploading ? "กำลังอัปโหลด..." : "ยืนยันอัปโหลด"}
          </Button>

          {!loadingPreview && previewData.length > 0 && (
            <Button
              variant="outlined"
              color="error"
              onClick={resetState}
              sx={{
                fontFamily: "'Prompt', sans-serif",
                borderRadius: 1.5,
                textTransform: "none",
                fontSize: "0.9rem",
                width: { xs: "100%", sm: "auto" },
              }}
            >
              ยกเลิก
            </Button>
          )}
        </Box>

        {!selectedFile && (
          <Typography sx={{ fontFamily: "'Prompt', sans-serif", fontSize: "0.75rem", color: "text.disabled", mt: 1.5 }}>
            ปุ่มยืนยันจะเปิดใช้งานหลังระบบแสดงตัวอย่างข้อมูลแล้ว
          </Typography>
        )}
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