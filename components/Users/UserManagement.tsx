"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  Snackbar,
  Alert,
  Paper,
  CircularProgress,
  IconButton,
} from "@mui/material";
import { API_URL } from "../../lib/utility";
import PeopleIcon from "@mui/icons-material/People";
import Badge from "@mui/material/Badge";
import EditIcon from "@mui/icons-material/Edit";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import AddIcon from "@mui/icons-material/Add";
import { fontTitle, getCellStyle, HeaderCellStyle, titleStyle } from "@/theme/style";
import { useAuth } from "@/contexts/AuthContext"; // ถ้ามี context auth อยู่แล้ว

interface User {
  User_ID: number;
  Username: string;
  Name: string;
  email: string;
  Status: number;
  iduser_level: number;
  CreateDate: string; // เปลี่ยนเป็น string เพราะ JSON ส่งมาเป็น ISO string
}

const mapUserLevel = (level: number | string | undefined): string => {
  const lvl = Number(level);
  switch (lvl) {
    case 1: return "Operator";
    case 2: return "Admin";
    default: return "ไม่ทราบระดับ";
  }
};

const UserManagement: React.FC = () => {
  const { currentUser } = useAuth(); // ใช้เพื่อเช็คสิทธิ์ถ้าต้องการ (optional)
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" | "info" | "warning" }>({
    open: false,
    message: "",
    severity: "success",
  });

  const [openTempDialog, setOpenTempDialog] = useState(false);
  const [tempUsers, setTempUsers] = useState<User[]>([]);
  const [tempCount, setTempCount] = useState(0);
  const [showAlertDialog, setShowAlertDialog] = useState(false);
  const hasShownAlert = useRef(false);

  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [newUser, setNewUser] = useState({
    Username: "",
    Name: "",
    email: "",
    password: "",
    iduser_level: 1,
  });
  const [addFormErrors, setAddFormErrors] = useState<{ [key: string]: string }>({});

  // โหลดผู้ใช้ทั้งหมด
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/user/users`, { credentials: "include" });
      if (!res.ok) throw new Error("โหลดผู้ใช้ไม่สำเร็จ");
      const data = await res.json();
      setUsers(data);
    } catch (err: any) {
      setSnackbar({ open: true, message: err.message || "โหลดข้อมูลผู้ใช้ล้มเหลว", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  // โหลดคำขอลงทะเบียนชั่วคราว
  const fetchTempUsers = async () => {
    try {
      const res = await fetch(`${API_URL}/user/user_temp`, { credentials: "include" });
      if (!res.ok) throw new Error("โหลดคำขอไม่สำเร็จ");
      const data = await res.json();
      setTempUsers(data);
      setTempCount(data.length);

      if (data.length > 0 && !hasShownAlert.current && !openTempDialog) {
        setShowAlertDialog(true);
        hasShownAlert.current = true;
      }
    } catch (err) {
      console.error("fetchTempUsers error:", err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchTempUsers();

    const interval = setInterval(() => {
      if (!openTempDialog) fetchTempUsers(); // โหลดเฉพาะเมื่อ dialog ปิด
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (openTempDialog) {
      fetchTempUsers();
    }
  }, [openTempDialog]);

  const handleEditClick = (user: User) => setSelectedUser(user);
  const handleCloseEdit = () => setSelectedUser(null);

  const handleSaveEdit = async () => {
    if (!selectedUser) return;
    try {
      const res = await fetch(`${API_URL}/user/users/${selectedUser.User_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(selectedUser),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "แก้ไขไม่สำเร็จ");
      }
      setSnackbar({ open: true, message: "แก้ไขสำเร็จ", severity: "success" });
      handleCloseEdit();
      fetchUsers();
    } catch (err: any) {
      setSnackbar({ open: true, message: err.message, severity: "error" });
    }
  };

  const validateAddForm = () => {
    const errors: { [key: string]: string } = {};
    if (!newUser.Username.trim()) errors.Username = "กรุณากรอก Username";
    if (!newUser.Name.trim()) errors.Name = "กรุณากรอกชื่อ";
    if (!newUser.email.includes("@")) errors.email = "อีเมลไม่ถูกต้อง";
    if (newUser.password.length < 6) errors.password = "รหัสผ่านต้อง 6 ตัวอักษรขึ้นไป";
    if (![1, 2].includes(newUser.iduser_level)) errors.iduser_level = "ระดับต้องเป็น 1 หรือ 2";
    setAddFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddUser = async () => {
    if (!validateAddForm()) return;

    try {
      const res = await fetch(`${API_URL}/user/register`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        credentials: "include",
        body: new URLSearchParams({
          username: newUser.Username,
          name: newUser.Name,
          email: newUser.email,
          password: newUser.password,
          iduser_level: newUser.iduser_level.toString(),
        }).toString(),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.messages?.error || data.message || "เพิ่มผู้ใช้ไม่สำเร็จ");

      setSnackbar({ open: true, message: "เพิ่มผู้ใช้สำเร็จ", severity: "success" });
      setOpenAddDialog(false);
      setNewUser({ Username: "", Name: "", email: "", password: "", iduser_level: 1 });
      setAddFormErrors({});
      fetchUsers();
    } catch (err: any) {
      setSnackbar({ open: true, message: err.message, severity: "error" });
    }
  };

  const handleApprove = async (userId: number) => {
    if (!window.confirm("ยืนยันการอนุมัติผู้ใช้นี้?")) return;
    try {
      const res = await fetch(`${API_URL}/user/approve/${userId}`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("อนุมัติไม่สำเร็จ");
      setSnackbar({ open: true, message: "อนุมัติสำเร็จ", severity: "success" });
      fetchUsers();
      fetchTempUsers();
    } catch (err: any) {
      setSnackbar({ open: true, message: err.message, severity: "error" });
    }
  };

  const handleReject = async (userId: number) => {
    if (!window.confirm("ยืนยันการปฏิเสธและลบคำขอนี้?")) return;
    try {
      const res = await fetch(`${API_URL}/user/reject/${userId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("ลบคำขอไม่สำเร็จ");
      setSnackbar({ open: true, message: "ลบคำขอสำเร็จ", severity: "success" });
      fetchTempUsers();
    } catch (err: any) {
      setSnackbar({ open: true, message: err.message, severity: "error" });
    }
  };

  return (
    <Box p={2}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" sx={{ ...fontTitle, fontWeight: "bold" }}>
          การจัดการผู้ใช้งาน
        </Typography>

        <Box>
          <Button
            variant="contained"
            color="info"
            onClick={() => setOpenTempDialog(true)}
            sx={{ ...titleStyle, mr: 2 }}
          >
            <Badge badgeContent={tempCount} color="error">
              <PeopleIcon sx={{ mr: 1 }} />
              คำขอลงทะเบียน
            </Badge>
          </Button>

          <Button
            variant="contained"
            color="success"
            startIcon={<AddIcon />}
            onClick={() => setOpenAddDialog(true)}
            sx={titleStyle}
          >
            เพิ่มผู้ใช้
          </Button>
        </Box>
      </Box>

      <Paper sx={{ overflowX: "auto", position: "relative" }}>
        {loading && (
          <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "rgba(255,255,255,0.7)" }}>
            <CircularProgress />
          </Box>
        )}
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={HeaderCellStyle}>Username</TableCell>
              <TableCell sx={HeaderCellStyle}>ชื่อ</TableCell>
              <TableCell sx={HeaderCellStyle}>Email</TableCell>
              <TableCell sx={HeaderCellStyle}>ระดับ</TableCell>
              <TableCell sx={HeaderCellStyle}>วันที่สร้าง</TableCell>
              <TableCell sx={HeaderCellStyle} align="right">จัดการ</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user, index) => (
              <TableRow key={user.User_ID}>
                <TableCell sx={getCellStyle(index)}>{user.Username}</TableCell>
                <TableCell sx={getCellStyle(index)}>{user.Name}</TableCell>
                <TableCell sx={getCellStyle(index)}>{user.email}</TableCell>
                <TableCell sx={getCellStyle(index)}>{mapUserLevel(user.iduser_level)}</TableCell>
                <TableCell sx={getCellStyle(index)}>
                  {new Date(user.CreateDate).toLocaleDateString("th-TH")}
                </TableCell>
                <TableCell sx={getCellStyle(index)} align="right">
                  <IconButton color="warning" onClick={() => handleEditClick(user)}>
                    <EditIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {/* Dialog แก้ไขผู้ใช้ */}
      <Dialog open={!!selectedUser} onClose={handleCloseEdit} fullWidth maxWidth="sm">
        <DialogTitle>แก้ไขผู้ใช้งาน</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Username"
            value={selectedUser?.Username || ""}
            onChange={(e) => setSelectedUser(prev => prev ? { ...prev, Username: e.target.value } : null)}
            fullWidth
          />
          <TextField
            margin="dense"
            label="ชื่อ"
            value={selectedUser?.Name || ""}
            onChange={(e) => setSelectedUser(prev => prev ? { ...prev, Name: e.target.value } : null)}
            fullWidth
          />
          <TextField
            margin="dense"
            label="Email"
            type="email"
            value={selectedUser?.email || ""}
            onChange={(e) => setSelectedUser(prev => prev ? { ...prev, email: e.target.value } : null)}
            fullWidth
          />
          <TextField
            margin="dense"
            label="ระดับผู้ใช้ (1 = Operator, 2 = Admin)"
            type="number"
            value={selectedUser?.iduser_level ?? 1}
            onChange={(e) => setSelectedUser(prev => prev ? { ...prev, iduser_level: Number(e.target.value) } : null)}
            fullWidth
            inputProps={{ min: 1, max: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEdit}>ยกเลิก</Button>
          <Button onClick={handleSaveEdit} variant="contained" color="primary">
            บันทึก
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog คำขอลงทะเบียน */}
      <Dialog open={openTempDialog} onClose={() => setOpenTempDialog(false)} fullWidth maxWidth="md">
        <DialogTitle>
          <PeopleIcon sx={{ mr: 1, verticalAlign: "middle" }} />
          คำขอลงทะเบียน ({tempCount})
        </DialogTitle>
        <DialogContent>
          {tempUsers.length === 0 ? (
            <Typography align="center" py={4}>ไม่มีคำขอลงทะเบียนในขณะนี้</Typography>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={HeaderCellStyle}>Username</TableCell>
                  <TableCell sx={HeaderCellStyle}>ชื่อ</TableCell>
                  <TableCell sx={HeaderCellStyle}>Email</TableCell>
                  <TableCell sx={HeaderCellStyle}>ระดับ</TableCell>
                  <TableCell sx={HeaderCellStyle} align="right">อนุมัติ</TableCell>
                  <TableCell sx={HeaderCellStyle} align="right">ปฏิเสธ</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tempUsers.map((user, index) => (
                  <TableRow key={user.User_ID}>
                    <TableCell sx={getCellStyle(index)}>{user.Username}</TableCell>
                    <TableCell sx={getCellStyle(index)}>{user.Name}</TableCell>
                    <TableCell sx={getCellStyle(index)}>{user.email}</TableCell>
                    <TableCell sx={getCellStyle(index)}>{mapUserLevel(user.iduser_level)}</TableCell>
                    <TableCell align="right">
                      <IconButton color="success" onClick={() => handleApprove(user.User_ID)}>
                        <CheckCircleIcon />
                      </IconButton>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton color="error" onClick={() => handleReject(user.User_ID)}>
                        <DeleteForeverIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenTempDialog(false)} color="inherit">
            ปิด
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog แจ้งเตือนมีคำขอใหม่ */}
      <Dialog open={showAlertDialog} onClose={() => setShowAlertDialog(false)}>
        <DialogTitle sx={{ textAlign: "center" }}>มีคำขอลงทะเบียนใหม่!</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ textAlign: "center" }}>
            มีผู้ใช้รออนุมัติ {tempCount} ราย
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", pb: 3 }}>
          <Badge badgeContent={tempCount} color="error">
            <Button
              variant="contained"
              color="primary"
              onClick={() => {
                setOpenTempDialog(true);
                setShowAlertDialog(false);
              }}
              startIcon={<PeopleIcon />}
            >
              ตรวจสอบคำขอ
            </Button>
          </Badge>
        </DialogActions>
      </Dialog>

      {/* Dialog เพิ่มผู้ใช้ */}
      <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle>เพิ่มผู้ใช้งานใหม่</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Username"
            value={newUser.Username}
            onChange={(e) => setNewUser({ ...newUser, Username: e.target.value })}
            error={!!addFormErrors.Username}
            helperText={addFormErrors.Username}
            fullWidth
          />
          <TextField
            margin="dense"
            label="ชื่อจริง"
            value={newUser.Name}
            onChange={(e) => setNewUser({ ...newUser, Name: e.target.value })}
            error={!!addFormErrors.Name}
            helperText={addFormErrors.Name}
            fullWidth
          />
          <TextField
            margin="dense"
            label="Email"
            type="email"
            value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
            error={!!addFormErrors.email}
            helperText={addFormErrors.email}
            fullWidth
          />
          <TextField
            margin="dense"
            label="รหัสผ่าน"
            type="password"
            value={newUser.password}
            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
            error={!!addFormErrors.password}
            helperText={addFormErrors.password}
            fullWidth
          />
          <TextField
            margin="dense"
            label="ระดับ (1=Operator, 2=Admin)"
            type="number"
            value={newUser.iduser_level}
            onChange={(e) => setNewUser({ ...newUser, iduser_level: Number(e.target.value) })}
            error={!!addFormErrors.iduser_level}
            helperText={addFormErrors.iduser_level}
            fullWidth
            inputProps={{ min: 1, max: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddDialog(false)}>ยกเลิก</Button>
          <Button onClick={handleAddUser} variant="contained" color="success">
            เพิ่มผู้ใช้
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
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
    </Box>
  );
};

export default UserManagement;