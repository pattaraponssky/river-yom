// components/Setting/Info/StationTable.tsx
import React, { useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  InputAdornment,
  LinearProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TextField,
  Tooltip,
  Typography,
  alpha,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import ImageIcon from "@mui/icons-material/Image";
import SaveIcon from "@mui/icons-material/Save";
import { API_URL, DEFAULT_STATION_PHOTO, getStationFallbackPhoto, resolvePhotoUrl } from "@/lib/utility";
import { uploadFile } from "@/lib/api";
import { Theme } from "@mui/material/styles";
import { StationField, StationInfoConfig } from "./stationInfoConfig";

type SortOrder = "asc" | "desc";
type DialogMode = "add" | "edit" | null;
type StationRow = Record<string, unknown>;

interface StationTableProps {
  stations: StationRow[];
  config: StationInfoConfig;
  onAdd: (data: Record<string, unknown>) => void;
  onEdit: (data: Record<string, unknown>) => void;
  onDelete: (id: string) => void;
}

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const formatValue = (value: unknown) => {
  if (value === null || value === undefined || value === "") return "-";
  return String(value);
};

export const StationTable: React.FC<StationTableProps> = ({
  stations,
  config,
  onAdd,
  onEdit,
  onDelete,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [formData, setFormData] = useState<StationRow>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<StationRow | null>(null);
  const [openRemovePhotoDialog, setOpenRemovePhotoDialog] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fieldMap = useMemo(
    () => new Map(config.fields.map((field) => [field.name, field])),
    [config.fields]
  );

  const sections = useMemo(() => {
    const grouped = new Map<string, StationField[]>();
    config.fields.forEach((field) => {
      if (!grouped.has(field.section)) grouped.set(field.section, []);
      grouped.get(field.section)!.push(field);
    });
    return Array.from(grouped.entries());
  }, [config.fields]);

  const displayColumns = useMemo(
    () => config.tableColumns.filter((column) => column !== config.idField && column !== config.nameField),
    [config]
  );

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortField(field);
    setSortOrder("asc");
  };

  const processedStations = useMemo(() => {
    let data = [...stations];

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      data = data.filter((row) =>
        Object.values(row).some((value) => String(value ?? "").toLowerCase().includes(q))
      );
    }

    if (sortField) {
      data.sort((a, b) => {
        const aValue = a[sortField] ?? "";
        const bValue = b[sortField] ?? "";
        const result = String(aValue).localeCompare(String(bValue), "th", { numeric: true });
        return sortOrder === "asc" ? result : -result;
      });
    }

    return data;
  }, [stations, searchTerm, sortField, sortOrder]);

  const getTablePhoto = (row: StationRow) => {
    const storedPhoto = typeof row.photo === "string" ? row.photo : undefined;
    const code = row[config.idField];
    const fallbackCode = typeof code === "string" || typeof code === "number" ? String(code) : undefined;

    return (
      resolvePhotoUrl(storedPhoto) ||
      getStationFallbackPhoto(config.imageFolder, fallbackCode) ||
      DEFAULT_STATION_PHOTO
    );
  };

  const getFormPhoto = () => {
    const storedPhoto = typeof formData.photo === "string" ? formData.photo : undefined;
    const code = formData[config.idField];
    const fallbackCode = typeof code === "string" || typeof code === "number" ? String(code) : undefined;

    return resolvePhotoUrl(storedPhoto) || getStationFallbackPhoto(config.imageFolder, fallbackCode);
  };

  const openAddDialog = () => {
    setFormData({});
    setFormErrors({});
    setUploadError(null);
    setDialogMode("add");
  };

  const openEditDialog = (row: StationRow) => {
    setFormData({ ...row });
    setFormErrors({});
    setUploadError(null);
    setDialogMode("edit");
  };

  const closeDialog = () => {
    if (uploading) return;
    setDialogMode(null);
    setFormData({});
    setFormErrors({});
    setUploadError(null);
    setDragActive(false);
  };

  const handleOpenDeleteDialog = (row: StationRow) => {
    setDeleteTarget(row);
    setOpenDeleteDialog(true);
  };

  const updateField = (name: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => {
      if (!prev[name] && !prev._form) return prev;
      const next = { ...prev };
      delete next[name];
      delete next._form;
      return next;
    });
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    config.requiredFields.forEach((name) => {
      const value = formData[name];
      if (value === null || value === undefined || String(value).trim() === "") {
        errors[name] = "กรุณากรอกข้อมูล";
      }
    });

    if (Object.keys(errors).length > 0) {
      errors._form = "กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const buildPayload = () => {
    const payload: Record<string, unknown> = {};

    config.fields.forEach((field) => {
      let value = formData[field.name];
      if (typeof value === "string") value = value.trim();

      if (field.type === "number") {
        payload[field.name] =
          value === null || value === undefined || value === "" ? null : Number(value);
      } else {
        payload[field.name] = typeof value === "string" ? value.trim() : value ?? null;
      }
    });

    payload.photo = formData.photo || null;
    return payload;
  };

  const handleSubmit = () => {
    if (uploading || !validateForm()) return;

    if (dialogMode === "add") {
      onAdd(buildPayload());
    } else if (dialogMode === "edit") {
      onEdit(buildPayload());
    }

    closeDialog();
  };

  const handleDeleteSubmit = () => {
    if (!deleteTarget) return;
    onDelete(String(deleteTarget[config.idField] ?? ""));
    setOpenDeleteDialog(false);
    setDeleteTarget(null);
  };

  const uploadImage = async (file: File) => {
    setUploadError(null);

    if (!file.type.startsWith("image/")) {
      setUploadError("กรุณาเลือกไฟล์รูปภาพเท่านั้น");
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setUploadError("รูปภาพต้องมีขนาดไม่เกิน 5 MB");
      return;
    }

    setUploading(true);

    const form = new FormData();
    form.append("file", file);
    form.append("type", config.key);

    const code = formData[config.idField];
    if (code) form.append("code", String(code));

    try {
      const res = await uploadFile(`${API_URL}/api/station_photo/upload`, form);
      const json = await res.json();

      if (!res.ok || json.status !== "success") {
        throw new Error(json.message || json.messages?.file || "อัปโหลดรูปภาพไม่สำเร็จ");
      }

      updateField("photo", json.data.path);
    } catch (error: unknown) {
      setUploadError(error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) uploadImage(file);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    const file = event.dataTransfer.files?.[0];
    if (file) uploadImage(file);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => setDragActive(false);

  const removePhoto = () => {
    updateField("photo", "");
    setOpenRemovePhotoDialog(false);
  };

  const headerCellSx = {
    bgcolor: config.accent,
    color: "common.white",
    fontFamily: "Prompt",
    fontWeight: 600,
    fontSize: { xs: "0.68rem", md: "0.78rem" },
    whiteSpace: "nowrap",
    borderBottom: "none",
    py: 1.5,
    "& .MuiTableSortLabel-root": { color: "inherit" },
    "& .MuiTableSortLabel-root:hover": { color: "inherit" },
    "& .MuiTableSortLabel-root.Mui-active": { color: "inherit" },
    "& .MuiTableSortLabel-icon": { color: "inherit !important" },
  };

  const bodyCellSx = (index: number) => (theme: Theme) => ({
    fontFamily: "Prompt",
    fontSize: { xs: "0.72rem", md: "0.8rem" },
    color: "text.primary",
    borderBottom: `1px solid ${theme.palette.divider}`,
    backgroundColor:
      index % 2 === 0
        ? theme.palette.mode === "dark"
          ? alpha(theme.palette.background.paper, 0.65)
          : "#FAFBFC"
        : "transparent",
    py: 1.25,
  });

  const formPhoto = getFormPhoto();
  const isEdit = dialogMode === "edit";
  const dialogTitle = isEdit ? `แก้ไข${config.title}` : config.addLabel;
  const dialogSubtitle = isEdit
    ? `รหัส ${formData[config.idField] ?? "-"}`
    : "กรอกข้อมูลสถานีและเพิ่มรูปภาพประกอบ";

  return (
    <Box sx={{ width: "100%" }}>
      <Paper
        elevation={0}
        sx={{
          position: "relative",
          overflow: "hidden",
          mb: 2.5,
          borderRadius: 3,
          p: { xs: 2, md: 2.5 },
          color: "common.white",
          background: `linear-gradient(135deg, ${config.accent} 0%, ${alpha(config.accent, 0.82)} 62%, ${alpha(config.accent, 0.66)} 100%)`,
        }}
      >
        <Box
          sx={{
            position: "absolute",
            width: 180,
            height: 180,
            borderRadius: "50%",
            top: -80,
            right: -40,
            bgcolor: "rgba(255,255,255,0.08)",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            width: 110,
            height: 110,
            borderRadius: "50%",
            bottom: -70,
            left: "38%",
            bgcolor: "rgba(255,255,255,0.06)",
          }}
        />

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems={{ xs: "stretch", sm: "center" }}
          justifyContent="space-between"
          sx={{ position: "relative" }}
        >
          <Stack direction="row" spacing={1.75} alignItems="center">
            <Box
              sx={{
                width: 52,
                height: 52,
                borderRadius: 2,
                bgcolor: "rgba(255,255,255,0.16)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                "& svg": { fontSize: 30 },
              }}
            >
              {config.icon}
            </Box>
            <Box>
              <Typography sx={{ fontFamily: "Prompt", fontWeight: 700, fontSize: { xs: "0.95rem", md: "1.1rem" } }}>
                {config.title}
              </Typography>
              <Typography sx={{ fontFamily: "Prompt", fontSize: { xs: "0.72rem", md: "0.8rem" }, opacity: 0.9 }}>
                {config.subtitle}
              </Typography>
            </Box>
          </Stack>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openAddDialog}
            sx={{
              bgcolor: "common.white",
              color: config.accent,
              fontFamily: "Prompt",
              fontWeight: 700,
              whiteSpace: "nowrap",
              px: 2.25,
              "&:hover": { bgcolor: "rgba(255,255,255,0.9)" },
            }}
          >
            {config.addLabel}
          </Button>
        </Stack>
      </Paper>

      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        alignItems={{ xs: "stretch", sm: "center" }}
        justifyContent="space-between"
        sx={{ mb: 1.5 }}
      >
        <TextField
          placeholder={config.searchPlaceholder}
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          size="small"
          sx={{
            width: { xs: "100%", sm: 380 },
            bgcolor: "background.paper",
            "& .MuiOutlinedInput-root": { borderRadius: 2, fontFamily: "Prompt" },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
            endAdornment: searchTerm ? (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearchTerm("")} aria-label="ล้างคำค้นหา">
                  <CloseIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ) : undefined,
          }}
        />

        <Stack direction="row" spacing={1} alignItems="center">
          <Chip
            size="small"
            label={`แสดง ${processedStations.length} / ${stations.length} สถานี`}
            sx={{ fontFamily: "Prompt", bgcolor: alpha(config.accent, 0.1), color: config.accent, fontWeight: 600 }}
          />
        </Stack>
      </Stack>

      <Paper elevation={0} sx={{ borderRadius: 3, border: (theme) => `1px solid ${theme.palette.divider}`, overflow: "hidden" }}>
        <TableContainer sx={{ maxHeight: { md: "calc(100vh - 390px)" } }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={headerCellSx} width={72}>
                  รูปภาพ
                </TableCell>
                <TableCell sx={headerCellSx}>
                  <TableSortLabel
                    active={sortField === config.idField}
                    direction={sortField === config.idField ? sortOrder : "asc"}
                    onClick={() => handleSort(config.idField)}
                  >
                    สถานี
                  </TableSortLabel>
                </TableCell>

                {displayColumns.map((column) => (
                  <TableCell key={column} sx={headerCellSx}>
                    <TableSortLabel
                      active={sortField === column}
                      direction={sortField === column ? sortOrder : "asc"}
                      onClick={() => handleSort(column)}
                    >
                      {fieldMap.get(column)?.label ?? column}
                    </TableSortLabel>
                  </TableCell>
                ))}

                <TableCell sx={headerCellSx} align="center" width={100}>
                  จัดการ
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {processedStations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={displayColumns.length + 3} align="center" sx={{ py: 7 }}>
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5 }}>
                      <Box
                        sx={{
                          width: 58,
                          height: 58,
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          bgcolor: alpha(config.accent, 0.1),
                          color: config.accent,
                        }}
                      >
                        <ImageIcon />
                      </Box>
                      <Typography sx={{ fontFamily: "Prompt", fontWeight: 600 }}>
                        {searchTerm ? "ไม่พบสถานีที่ตรงกับคำค้นหา" : config.emptyText}
                      </Typography>
                      {!searchTerm && (
                        <Button variant="outlined" startIcon={<AddIcon />} onClick={openAddDialog} sx={{ fontFamily: "Prompt" }}>
                          {config.addLabel}
                        </Button>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                processedStations.map((row, index) => {
                  const code = row[config.idField];
                  const name = row[config.nameField];

                  return (
                    <TableRow key={String(code ?? index)} hover>
                      <TableCell sx={bodyCellSx(index)} align="center">
                        <Box
                          component="img"
                          src={getTablePhoto(row)}
                          alt={String(name || code || "station")}
                          onError={(event) => {
                            const image = event.currentTarget as HTMLImageElement;
                            if (image.src !== DEFAULT_STATION_PHOTO) {
                              image.src = DEFAULT_STATION_PHOTO;
                            }
                          }}
                          sx={{
                            width: 52,
                            height: 52,
                            objectFit: "cover",
                            borderRadius: 2,
                            border: (theme) => `1px solid ${theme.palette.divider}`,
                            bgcolor: "grey.100",
                          }}
                        />
                      </TableCell>

                      <TableCell sx={bodyCellSx(index)}>
                        <Typography sx={{ fontFamily: "Prompt", fontWeight: 700, fontSize: { xs: "0.76rem", md: "0.82rem" } }}>
                          {formatValue(code)}
                        </Typography>
                        <Typography sx={{ fontFamily: "Prompt", fontSize: { xs: "0.68rem", md: "0.74rem" }, color: "text.secondary" }}>
                          {formatValue(name)}
                        </Typography>
                      </TableCell>

                      {displayColumns.map((column) => (
                        <TableCell key={column} sx={bodyCellSx(index)}>
                          {formatValue(row[column])}
                        </TableCell>
                      ))}

                      <TableCell sx={bodyCellSx(index)} align="center">
                        <Stack direction="row" spacing={0.5} justifyContent="center">
                          <Tooltip title="แก้ไขข้อมูล">
                            <IconButton
                              size="small"
                              onClick={() => openEditDialog(row)}
                              sx={{ color: config.accent, bgcolor: alpha(config.accent, 0.08) }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="ลบข้อมูล">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleOpenDeleteDialog(row)}
                              sx={{ bgcolor: (theme) => alpha(theme.palette.error.main, 0.08) }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog
        open={dialogMode !== null}
        onClose={closeDialog}
        fullWidth
        maxWidth="md"
        PaperProps={{ sx: { borderRadius: 3, "& .MuiButton-root": { fontSize: "0.82rem" }, "& .MuiInputBase-input": { fontSize: "0.85rem" }, "& .MuiInputLabel-root": { fontSize: "0.82rem" }, "& .MuiFormHelperText-root": { fontSize: "0.72rem" } } }}
      >
        <DialogTitle sx={{ p: 0 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              p: 2.25,
              color: "common.white",
              background: `linear-gradient(135deg, ${config.accent}, ${alpha(config.accent, 0.78)})`,
            }}
          >
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: 2,
                bgcolor: "rgba(255,255,255,0.16)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                "& svg": { fontSize: 24 },
              }}
            >
              {config.icon}
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontFamily: "Prompt", fontWeight: 700, fontSize: "0.95rem" }}>
                {dialogTitle}
              </Typography>
              <Typography sx={{ fontFamily: "Prompt", fontSize: "0.72rem", opacity: 0.9 }}>
                {dialogSubtitle}
              </Typography>
            </Box>
            <IconButton onClick={closeDialog} sx={{ color: "common.white" }} aria-label="ปิด">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent dividers sx={{ p: { xs: 2, md: 3 } }}>
          {formErrors._form && (
            <Alert severity="error" sx={{ mb: 2, fontFamily: "Prompt" }}>
              {formErrors._form}
            </Alert>
          )}

          <Box sx={{ mb: 3 }}>
            <Typography sx={{ fontFamily: "Prompt", fontWeight: 700, mb: 1.25 }}>
              รูปภาพสถานี
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ xs: "stretch", sm: "center" }}>
              <Box
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => !uploading && fileInputRef.current?.click()}
                sx={{
                  position: "relative",
                  width: { xs: "100%", sm: 210 },
                  height: 132,
                  borderRadius: 2.5,
                  border: "1.5px dashed",
                  borderColor: dragActive ? config.accent : "divider",
                  bgcolor: dragActive ? alpha(config.accent, 0.08) : "action.hover",
                  overflow: "hidden",
                  cursor: uploading ? "progress" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.18s ease",
                }}
              >
                <Stack
                  alignItems="center"
                  spacing={0.5}
                  sx={{ position: "absolute", inset: 0, justifyContent: "center", color: "text.secondary" }}
                >
                  <ImageIcon fontSize="large" />
                  <Typography sx={{ fontFamily: "Prompt", fontSize: "0.75rem" }}>
                    คลิกหรือลากรูปมาวาง
                  </Typography>
                </Stack>

                {formPhoto && (
                  <Box
                    component="img"
                    src={formPhoto}
                    alt="ตัวอย่างรูปสถานี"
                    onError={(event) => {
                      (event.currentTarget as HTMLImageElement).style.opacity = "0";
                    }}
                    sx={{
                      position: "absolute",
                      inset: 0,
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                )}

                {formPhoto && (
                  <Box
                    sx={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: "rgba(0,0,0,0.28)",
                      color: "#fff",
                      opacity: 0,
                      transition: "opacity 0.18s ease",
                      "&:hover": { opacity: 1 },
                    }}
                  >
                    <CloudUploadIcon />
                  </Box>
                )}

                {uploading && (
                  <Box sx={{ position: "absolute", inset: 0, bgcolor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <CircularProgress size={28} sx={{ color: "#fff" }} />
                  </Box>
                )}
              </Box>

              <Stack spacing={1} sx={{ flex: 1 }}>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                  <Button
                    variant="outlined"
                    startIcon={<CloudUploadIcon />}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    sx={{ fontFamily: "Prompt" }}
                  >
                    {formPhoto ? "เปลี่ยนรูปภาพ" : "เลือกรูปภาพ"}
                  </Button>

                  {Boolean(formData.photo) && (
                    <Button
                      color="error"
                      onClick={() => setOpenRemovePhotoDialog(true)}
                      disabled={uploading}
                      sx={{ fontFamily: "Prompt" }}
                    >
                      ลบรูปที่อัปโหลด
                    </Button>
                  )}
                </Stack>

                <Typography sx={{ fontFamily: "Prompt", fontSize: "0.75rem", color: "text.secondary" }}>
                  รองรับ JPG, PNG และ WebP ขนาดไม่เกิน 5 MB
                </Typography>

                {Boolean(formData.photo) && (
                  <Chip
                    size="small"
                    label="อัปโหลดรูปภาพแล้ว"
                    color="success"
                    variant="outlined"
                    sx={{ alignSelf: "flex-start", fontFamily: "Prompt" }}
                  />
                )}

                {uploadError && (
                  <Alert severity="error" sx={{ fontFamily: "Prompt", py: 0.25 }}>
                    {uploadError}
                  </Alert>
                )}
              </Stack>
            </Stack>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              hidden
              onChange={handleFileChange}
            />

            {uploading && <LinearProgress sx={{ mt: 1.5, borderRadius: 1 }} />}
          </Box>

          <Divider sx={{ mb: 2.5 }} />

          <Stack spacing={2.5}>
            {sections.map(([section, fields]) => (
              <Box key={section}>
                <Typography
                  sx={{
                    fontFamily: "Prompt",
                    fontWeight: 700,
                    fontSize: "0.72rem",
                    color: "text.secondary",
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    mb: 1,
                  }}
                >
                  {section}
                </Typography>

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
                    gap: 1.5,
                  }}
                >
                  {fields.map((field) => (
                    <TextField
                      key={field.name}
                      label={field.label}
                      value={formData[field.name] ?? ""}
                      onChange={(event) => updateField(field.name, event.target.value)}
                      type={field.type === "number" ? "number" : "text"}
                      fullWidth
                      size="small"
                      required={field.required}
                      error={Boolean(formErrors[field.name])}
                      helperText={formErrors[field.name] ?? ""}
                      placeholder={field.placeholder}
                      multiline={field.multiline}
                      inputProps={{ step: field.type === "number" ? "any" : undefined }}
                      InputLabelProps={{ shrink: field.type === "number" ? true : undefined }}
                      InputProps={{
                        readOnly: field.readOnly || (isEdit && field.name === config.idField),
                      }}
                      sx={{
                        gridColumn: field.span === 2 || field.multiline ? "1 / -1" : undefined,
                        "& .MuiOutlinedInput-root": { fontFamily: "Prompt", borderRadius: 2 },
                        "& .MuiInputLabel-root": { fontFamily: "Prompt" },
                        "& .MuiFormHelperText-root": { fontFamily: "Prompt" },
                      }}
                    />
                  ))}
                </Box>
              </Box>
            ))}
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={closeDialog} disabled={uploading} sx={{ fontFamily: "Prompt" }}>
            ยกเลิก
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSubmit}
            disabled={uploading}
            sx={{ fontFamily: "Prompt", fontWeight: 700, bgcolor: config.accent, "&:hover": { bgcolor: config.accent } }}
          >
            {isEdit ? "บันทึกการแก้ไข" : config.addLabel}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)} PaperProps={{ sx: { borderRadius: 3, "& .MuiButton-root": { fontSize: "0.82rem" }, "& .MuiInputBase-input": { fontSize: "0.85rem" }, "& .MuiInputLabel-root": { fontSize: "0.82rem" }, "& .MuiFormHelperText-root": { fontSize: "0.72rem" } } }}>
        <DialogTitle sx={{ fontFamily: "Prompt", fontWeight: 700 }}>
          ยืนยันการลบข้อมูล
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontFamily: "Prompt" }}>
            ต้องการลบสถานี{" "}
            <strong>
              {formatValue(deleteTarget?.[config.idField])} {formatValue(deleteTarget?.[config.nameField])}
            </strong>{" "}
            ใช่หรือไม่?
          </Typography>
          <Alert severity="warning" sx={{ mt: 2, fontFamily: "Prompt" }}>
            ข้อมูลสถานีจะถูกลบออกจากระบบและไม่สามารถกู้คืนได้
          </Alert>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenDeleteDialog(false)} sx={{ fontFamily: "Prompt" }}>
            ยกเลิก
          </Button>
          <Button variant="contained" color="error" startIcon={<DeleteIcon />} onClick={handleDeleteSubmit} sx={{ fontFamily: "Prompt" }}>
            ลบข้อมูล
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openRemovePhotoDialog} onClose={() => setOpenRemovePhotoDialog(false)} PaperProps={{ sx: { borderRadius: 3, "& .MuiButton-root": { fontSize: "0.82rem" } } }}>
        <DialogTitle sx={{ fontFamily: "Prompt", fontWeight: 700 }}>
          ยืนยันการลบรูปภาพ
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontFamily: "Prompt" }}>
            ต้องการลบรูปที่อัปโหลดใช่หรือไม่?
          </Typography>
          <Alert severity="warning" sx={{ mt: 2, fontFamily: "Prompt" }}>
            รูปภาพจะถูกลบออกและไม่สามารถกู้คืนได้
          </Alert>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenRemovePhotoDialog(false)} sx={{ fontFamily: "Prompt" }}>
            ยกเลิก
          </Button>
          <Button variant="contained" color="error" startIcon={<DeleteIcon />} onClick={removePhoto} sx={{ fontFamily: "Prompt" }}>
            ลบรูปภาพ
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
