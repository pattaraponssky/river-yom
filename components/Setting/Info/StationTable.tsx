// components/Setting/Info/StationTable.tsx
import React, { useState, useMemo } from "react";
import {
  Container, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, Button, Snackbar, Alert, Dialog,
  DialogActions, DialogContent, DialogTitle, IconButton, Box,
  Typography, InputAdornment, TableSortLabel,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import SearchIcon from "@mui/icons-material/Search";
import { HeaderCellStyle, getCellStyle } from "@/theme/style";

type SortOrder = "asc" | "desc";

interface StationTableProps {
  // ข้อมูล
  stations: any[];
  // labels
  title: string;
  addLabel: string;
  idField: string;           // ชื่อ field ที่เป็น key เช่น "sta_code" | "res_code"
  requiredFields: string[];  // fields ที่ต้องกรอก เช่น ["sta_code","sta_name"]
  // callbacks
  onAdd: (data: any) => void;
  onEdit: (data: any) => void;
  onDelete: (id: string) => void;
  // optional
  credentials?: boolean;
}

export const StationTable: React.FC<StationTableProps> = ({
  stations,
  title,
  addLabel,
  idField,
  requiredFields,
  onAdd,
  onEdit,
  onDelete,
  credentials = false,
}) => {
  // ─── State ────────────────────────────────────────────────────
  const [searchTerm, setSearchTerm]       = useState("");
  const [sortField, setSortField]         = useState<string>("");
  const [sortOrder, setSortOrder]         = useState<SortOrder>("asc");

  const [openAddDialog, setOpenAddDialog]       = useState(false);
  const [openEditDialog, setOpenEditDialog]     = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [newFeature, setNewFeature]             = useState<any>({});
  const [editFeature, setEditFeature]           = useState<any>({});
  const [deleteId, setDeleteId]                 = useState("");

  // ─── Columns (จาก data row แรก) ───────────────────────────────
  const columns = useMemo(
    () => (stations[0] ? Object.keys(stations[0]) : []),
    [stations]
  );

  // ─── Sort handler ─────────────────────────────────────────────
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  // ─── Filter + Sort ────────────────────────────────────────────
  const processedStations = useMemo(() => {
    let data = [...stations];

    // search
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      data = data.filter(row =>
        Object.values(row).some(v => String(v ?? "").toLowerCase().includes(q))
      );
    }

    // sort
    if (sortField) {
      data.sort((a, b) => {
        const aVal = a[sortField] ?? "";
        const bVal = b[sortField] ?? "";
        const cmp  = String(aVal).localeCompare(String(bVal), "th", { numeric: true });
        return sortOrder === "asc" ? cmp : -cmp;
      });
    }

    return data;
  }, [stations, searchTerm, sortField, sortOrder]);

  // ─── Handlers ─────────────────────────────────────────────────
  const handleAddSubmit = () => {
    const missing = requiredFields.find(f => !newFeature[f]);
    if (missing) return; // parent จะ validate เองใน onAdd
    onAdd(newFeature);
    setOpenAddDialog(false);
    setNewFeature({});
  };

  const handleEditSubmit = () => {
    onEdit(editFeature);
    setOpenEditDialog(false);
  };

  const handleDeleteSubmit = () => {
    onDelete(deleteId);
    setOpenDeleteDialog(false);
  };

  // ─── Render ───────────────────────────────────────────────────
  return (
    <Container component="main" sx={{ minWidth: "100%" }}>

      {/* Search Bar */}
      <Box sx={{ mb: 2, mt: { md: 2, xs: 1 } }}>
        <TextField
          placeholder="ค้นหาข้อมูลสถานี..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          size="small"
          sx={{ width: { xs: "100%", sm: 320 }, fontFamily: "Prompt" }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
        <Typography
          variant="body2"
          sx={{ fontFamily: "Prompt", color: "text.secondary", mt: 0.5, ml: 0.5 }}
        >
          แสดง {processedStations.length} / {stations.length} รายการ
        </Typography>
      </Box>

      {/* Table */}
      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              {/* Action columns */}
              <TableCell sx={HeaderCellStyle}>แก้ไข</TableCell>
              <TableCell sx={HeaderCellStyle}>ลบ</TableCell>

              {/* Data columns (sortable) */}
              {columns.map(col => (
                <TableCell key={col} sx={HeaderCellStyle}>
                  <TableSortLabel
                    active={sortField === col}
                    direction={sortField === col ? sortOrder : "asc"}
                    onClick={() => handleSort(col)}
                    sx={{
                      color: "white !important",
                      "& .MuiTableSortLabel-icon": { color: "white !important" },
                      "&:hover": { color: "rgba(255,255,255,0.8) !important" },
                    }}
                  >
                    {col}
                  </TableSortLabel>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {processedStations.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + 2}
                  align="center"
                  sx={{ py: 4, fontFamily: "Prompt", color: "text.secondary" }}
                >
                  ไม่พบข้อมูลที่ตรงกับการค้นหา
                </TableCell>
              </TableRow>
            ) : (
              processedStations.map((row, index) => (
                <TableRow key={row[idField] ?? index} hover>
                  {/* Edit */}
                  <TableCell align="center" sx={getCellStyle(index)}>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => { setEditFeature({ ...row }); setOpenEditDialog(true); }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </TableCell>

                  {/* Delete */}
                  <TableCell align="center" sx={getCellStyle(index)}>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => { setDeleteId(row[idField]); setOpenDeleteDialog(true); }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>

                  {/* Data cells */}
                  {columns.map(col => (
                    <TableCell key={col} sx={getCellStyle(index)}>
                      {row[col] ?? "-"}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add Button */}
      <Button
        variant="contained"
        color="success"
        onClick={() => setOpenAddDialog(true)}
        sx={{ mt: 2, fontFamily: "Prompt", fontWeight: "bold" }}
      >
        {addLabel}
      </Button>

      {/* ─── Add Dialog ─────────────────────────────────────── */}
      <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} fullWidth maxWidth="md">
        <DialogTitle sx={{ fontFamily: "Prompt", fontWeight: "bold" }}>
          {title}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 2, mt: 2 }}>
            {columns.map(key => (
              <TextField
                key={key}
                label={key}
                fullWidth
                size="small"
                required={requiredFields.includes(key)}
                onChange={e => setNewFeature((prev: any) => ({ ...prev, [key]: e.target.value }))}
                sx={{ fontFamily: "Prompt" }}
                helperText={requiredFields.includes(key) ? "* จำเป็น" : ""}
              />
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setOpenAddDialog(false); setNewFeature({}); }}>
            ยกเลิก
          </Button>
          <Button onClick={handleAddSubmit} variant="contained" color="success">
            เพิ่ม
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── Edit Dialog ────────────────────────────────────── */}
      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} fullWidth maxWidth="md">
        <DialogTitle sx={{ fontFamily: "Prompt", fontWeight: "bold" }}>
          แก้ไข: {editFeature[idField]}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 2, mt: 2 }}>
            {columns.map(key => (
              <TextField
                key={key}
                label={key}
                fullWidth
                size="small"
                value={editFeature[key] ?? ""}
                onChange={e => setEditFeature((prev: any) => ({ ...prev, [key]: e.target.value }))}
                sx={{ fontFamily: "Prompt" }}
              />
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)}>ยกเลิก</Button>
          <Button onClick={handleEditSubmit} variant="contained" color="primary">
            บันทึก
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── Delete Dialog ──────────────────────────────────── */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle sx={{ fontFamily: "Prompt", fontWeight: "bold" }}>
          ยืนยันการลบ
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontFamily: "Prompt" }}>
            คุณต้องการลบข้อมูลรหัส <strong>"{deleteId}"</strong> ใช่หรือไม่?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>ยกเลิก</Button>
          <Button onClick={handleDeleteSubmit} color="error" variant="contained">
            ลบ
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};