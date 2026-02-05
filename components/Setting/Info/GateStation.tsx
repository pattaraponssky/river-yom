// InfoGateStation.tsx
import React, { useState, useEffect } from "react";
import {
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Button,
  Snackbar,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { API_URL } from "@/lib/utility";

const HeaderCellStyle = {
  border: "0px solid #ddd",
  fontFamily: "Prompt",
  fontWeight: "bold",
  textAlign: "center",
  backgroundColor: "rgb(1, 87, 155)",
  color: "white",
  fontSize: { xs: "0.7rem", sm: "0.8rem", md: "1rem" },
};

const getCellStyle = (index: number) => ({
  border: "0px solid #ddd",
  padding: "10px",
  backgroundColor: index % 2 === 0 ? "#FAFAFA" : "#FFF",
  textAlign: "center",
  fontFamily: "Prompt",
  fontSize: { xs: "0.8rem", sm: "0.9rem" , md: "1rem"},
});

const InfoGateStation: React.FC = () => {
  const [stations, setStations] = useState<any[]>([]);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">("success");
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [newFeature, setNewFeature] = useState<any>({});
  const [editFeature, setEditFeature] = useState<any>({});
  const [deleteStaCode, setDeleteStaCode] = useState<string>("");

  useEffect(() => {
    fetch(`${API_URL}/api/gate_info`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setStations(data);
        } else if (Array.isArray(data?.data)) {
          setStations(data.data);
        } else {
          console.error("Unexpected response format:", data);
        }
      })
      .catch((err) => console.error("Error loading data:", err));
  }, []);

  const handleEditDialogOpen = (feature: any) => {
    setEditFeature({ ...feature });
    setOpenEditDialog(true);
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, field: string) => {
    setEditFeature({ ...editFeature, [field]: e.target.value });
  };

  const handleEditSave = () => {
    fetch(`${API_URL}/api/gate_info/${editFeature.sta_code}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editFeature),
    })
      .then((res) => res.json())
      .then(() => {
        const updated = stations.map((s) =>
          s.sta_code === editFeature.sta_code ? editFeature : s
        );
        setStations(updated);
        setSnackbarMessage("แก้ไขข้อมูลสำเร็จ");
        setSnackbarSeverity("success");
        setOpenSnackbar(true);
        setOpenEditDialog(false);
      })
      .catch(() => {
        setSnackbarMessage("แก้ไขข้อมูลล้มเหลว");
        setSnackbarSeverity("error");
        setOpenSnackbar(true);
      });
  };

  const handleDeleteConfirm = () => {
    fetch(`${API_URL}/api/gate_info/${deleteStaCode}`, { method: "DELETE" })
      .then((res) => res.json())
      .then(() => {
        setStations(stations.filter((s) => s.sta_code !== deleteStaCode));
        setSnackbarMessage("ลบข้อมูลสำเร็จ");
        setSnackbarSeverity("success");
        setOpenSnackbar(true);
        setOpenDeleteDialog(false);
      })
      .catch(() => {
        setSnackbarMessage("ลบข้อมูลล้มเหลว");
        setSnackbarSeverity("error");
        setOpenSnackbar(true);
      });
  };

  const handleAddFeature = () => {
    if (!newFeature.sta_code || !newFeature.sta_name) {
      setSnackbarMessage("กรุณากรอกข้อมูลที่จำเป็น");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
      return;
    }

    fetch(`${API_URL}/api/gate_info`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newFeature),
    })
      .then((res) => res.json())
          .then(() => {
            fetch(`${API_URL}/api/gate_info`)
            .then((res) => res.json())
            .then((data) => {
              if (Array.isArray(data)) {
                setStations(data);
              } else if (Array.isArray(data?.data)) {
                setStations(data.data);
              }
            });
        setSnackbarMessage("เพิ่มข้อมูลสำเร็จ");
        setSnackbarSeverity("success");
        setOpenSnackbar(true);
        setOpenAddDialog(false);
        setNewFeature({});
      })
      .catch(() => {
        setSnackbarMessage("เพิ่มข้อมูลล้มเหลว");
        setSnackbarSeverity("error");
        setOpenSnackbar(true);
      });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, field: string) => {
    setNewFeature({ ...newFeature, [field]: e.target.value });
  };

  return (
    <Container component="main" sx={{ minWidth: "100%" }}>
      <TableContainer component={Paper} sx={{ borderRadius: 2, mt: {md:2,xs:0} }}>
        <Table>
          <TableHead>
            <TableRow>
            <TableCell sx={HeaderCellStyle}>แก้ไข</TableCell>
            <TableCell sx={HeaderCellStyle}>ลบ</TableCell>
              {stations[0] && Object.keys(stations[0]).map((key) => (
                <TableCell key={key} sx={HeaderCellStyle}>{key}</TableCell>
              ))}           
            </TableRow>
          </TableHead>
          <TableBody>
            {stations.map((row, index) => (
              <TableRow key={index} sx={{ "&:hover": { backgroundColor: "#f5f5f5" } }}>
                <TableCell align="center" sx={getCellStyle(index)}>
                  <IconButton size="small" color="primary" onClick={() => handleEditDialogOpen(row)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                </TableCell>
                <TableCell align="center" sx={getCellStyle(index)}>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => {
                      setDeleteStaCode(row.sta_code);
                      setOpenDeleteDialog(true);
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
                {Object.keys(row).map((key) => (
                  <TableCell key={key} sx={getCellStyle(index)}>
                    {row[key]}
                  </TableCell>
                ))}
          
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Button variant="contained" color="success" onClick={() => setOpenAddDialog(true)} sx={{ mt: 2 ,fontFamily: "Prompt",fontWeight:"bold"}}>
        เพิ่มสถานี
      </Button>

      {/* Add Dialog */}
      <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} fullWidth maxWidth="md">
        <DialogTitle>เพิ่มข้อมูล</DialogTitle>
        <DialogContent>
          {Object.keys(stations[0] || {}).map((key) => (
            <TextField
              key={key}
              label={key}
              fullWidth
              sx={{ mb: 2 }}
              onChange={(e) => handleInputChange(e, key)}
            />
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddDialog(false)}>ยกเลิก</Button>
          <Button onClick={handleAddFeature}>เพิ่ม</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} fullWidth maxWidth="md">
        <DialogTitle>แก้ไขข้อมูล</DialogTitle>
        <DialogContent>
          {Object.keys(editFeature).map((key) => (
            <TextField
              key={key}
              label={key}
              fullWidth
              sx={{ mb: 2 }}
              value={editFeature[key]}
              
              onChange={(e) => handleEditInputChange(e, key)}
            />
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)}>ยกเลิก</Button>
          <Button onClick={handleEditSave}>บันทึก</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>ยืนยันการลบ</DialogTitle>
        <DialogContent>
          คุณต้องการลบข้อมูลสถานีรหัส "{deleteStaCode}" ใช่หรือไม่?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>ยกเลิก</Button>
          <Button onClick={handleDeleteConfirm} color="error">ลบ</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={openSnackbar} autoHideDuration={5000} onClose={() => setOpenSnackbar(false)}>
        <Alert severity={snackbarSeverity} onClose={() => setOpenSnackbar(false)}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default InfoGateStation;
