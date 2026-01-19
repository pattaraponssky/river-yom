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
  DialogActions,
  TextField,
  Snackbar,
  Alert,
  Paper,
} from "@mui/material";
import { API_URL } from '../../lib/utility';
import Users from "@mui/icons-material/People";
import Badge from "@mui/material/Badge";
interface User {
  User_ID: number;
  Username: string;
  Name: string;
  email: string;
  Status: number;
  iduser_level: number;
  CreateDate : Date;
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

const HeaderFont = {
    fontFamily: "Prompt",
    fontWeight: "bold",
}

const mapUserLevel = (level: number | string | undefined) => {
    switch (Number(level)) {
      case 1:
        return 'Operator';
      case 2:
        return 'Admin';
      default:
        return 'ไม่ทราบระดับ';
    }
  };

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
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
    iduser_level: 1
    });

  const fetchTempUsers = async () => {
    try {
      const res = await fetch(`${API_URL}/user/user_temp`, { credentials: "include" });
      const data = await res.json();
      setTempUsers(data);
      setTempCount(data.length);
  
      if (data.length > 0 && !hasShownAlert.current) {
        setShowAlertDialog(true);
        hasShownAlert.current = true;  // ตั้ง flag กันเด้งซ้ำ
      }
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: "โหลดคำขอลงทะเบียนไม่สำเร็จ", severity: "error" });
    }
  };
  
  
  useEffect(() => {
    if (openTempDialog) {
      fetchTempUsers();
    }
  }, [openTempDialog]);

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_URL}/user/users`, { credentials: "include" });
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: "โหลดข้อมูลผู้ใช้ไม่สำเร็จ", severity: "error" });
    }
  };

  const handleEditClick = (user: User) => {
    setSelectedUser(user);
  };

  const handleCloseDialog = () => {
    setSelectedUser(null);
  };

  const handleSave = async () => {
    if (!selectedUser) return;

    try {
      const res = await fetch(`${API_URL}/user/users/${selectedUser.User_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(selectedUser),
      });

      if (!res.ok) {
        throw new Error("แก้ไขข้อมูลไม่สำเร็จ");
      }

      setSnackbar({ open: true, message: "แก้ไขข้อมูลสำเร็จ", severity: "success" });
      handleCloseDialog();
      fetchUsers();
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: "เกิดข้อผิดพลาดขณะบันทึก", severity: "error" });
    }
  };

  useEffect(() => {
    fetchTempUsers(); // โหลดรอบแรก
  
    const interval = setInterval(() => {
      fetchTempUsers(); // เช็กคำขอซ้ำทุก 30 วินาที
    }, 30000);
  
    return () => clearInterval(interval); // เคลียร์เมื่อ component ถูกถอด
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchTempUsers(); // โหลดคำขอรอบแรก
  }, []);
  const handleApprove = async (userId: number) => {
    const confirm = window.confirm("คุณต้องการยืนยันคำขอนี้หรือไม่?");
    if (!confirm) return;
  
    try {
      const res = await fetch(`${API_URL}/user/approve/${userId}`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("ไม่สามารถยืนยันผู้ใช้ได้");
  
      setSnackbar({ open: true, message: "ยืนยันผู้ใช้งานสำเร็จ", severity: "success" });
      fetchUsers();
      fetchTempUsers();
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: "เกิดข้อผิดพลาดขณะยืนยัน", severity: "error" });
    }
  };
  
  const handleReject = async (userId: number) => {
    const confirm = window.confirm("คุณแน่ใจว่าต้องการลบคำขอนี้?");
    if (!confirm) return;
  
    try {
      const res = await fetch(`${API_URL}/user/reject/${userId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("ไม่สามารถลบคำขอได้");
  
      setSnackbar({ open: true, message: "ลบคำขอลงทะเบียนสำเร็จ", severity: "success" });
      fetchTempUsers();
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: "เกิดข้อผิดพลาดขณะลบคำขอ", severity: "error" });
    }
  };
  
  return (
    <Box p={2}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography sx={HeaderFont}>
                การจัดการผู้ใช้งาน
            </Typography>
        <Button
            variant="contained"
            color="info"
            onClick={() => setOpenTempDialog(true)}
            sx={HeaderFont}
            >
            <Badge badgeContent={tempCount} color="error">
                <Users style={{ marginRight: 8 }} /> คำขอลงทะเบียน
            </Badge>
        </Button>
        </Box>
      <Paper sx={{overflowX: "auto"}}>
        <Table >
          <TableHead>
            <TableRow>
              <TableCell sx={HeaderCellStyle}>Username</TableCell>
              <TableCell sx={HeaderCellStyle}>ชื่อผู้ใช้</TableCell>
              <TableCell sx={HeaderCellStyle}>Email</TableCell>
              <TableCell sx={HeaderCellStyle}>ระดับ</TableCell>
              <TableCell sx={HeaderCellStyle}>วันที่สร้าง</TableCell>
              <TableCell sx={HeaderCellStyle} align="right">แก้ไข</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user,index) => (
              <TableRow key={user.User_ID}>
                <TableCell sx={getCellStyle(index)}>{user.Username}</TableCell>
                <TableCell sx={getCellStyle(index)}>{user.Name}</TableCell>
                <TableCell sx={getCellStyle(index)}>{user.email}</TableCell>
                <TableCell sx={getCellStyle(index)}>{mapUserLevel(user.iduser_level)}</TableCell>
                <TableCell sx={getCellStyle(index)}>{new Date(user.CreateDate).toLocaleDateString()}</TableCell>
                <TableCell sx={getCellStyle(index)} align="right">
                  <Button variant="contained" color="warning" onClick={() => handleEditClick(user)} sx={HeaderFont}>
                    แก้ไข
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {/* Edit Dialog */}
      <Dialog open={!!selectedUser} onClose={handleCloseDialog} fullWidth maxWidth="sm">
        <DialogTitle sx={{fontFamily: "Prompt",fontWeight:"bold"}}>แก้ไขผู้ใช้งาน</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          <TextField
            sx={{mt:1,}}
            label="ชื่อผู้ใช้"
            value={selectedUser?.Username || ""}
            onChange={(e) => setSelectedUser({ ...selectedUser!, Username: e.target.value })}
            fullWidth
          />
          <TextField
            label="ชื่อจริง"
            value={selectedUser?.Name || ""}
            onChange={(e) => setSelectedUser({ ...selectedUser!, Name: e.target.value })}
            fullWidth
          />
          <TextField
            label="Email"
            value={selectedUser?.email || ""}
            onChange={(e) => setSelectedUser({ ...selectedUser!, email: e.target.value })}
            fullWidth
          />
          <TextField
            label="ระดับผู้ใช้ (1=Operator, 2=Admin)"
            type="number"
            value={selectedUser?.iduser_level || 2}
            onChange={(e) =>
              setSelectedUser({ ...selectedUser!, iduser_level: Number(e.target.value) })
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} sx={HeaderFont}>ยกเลิก</Button>
          <Button onClick={handleSave} variant="contained" sx={HeaderFont}>
            บันทึก 
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openTempDialog} onClose={() => setOpenTempDialog(false)} fullWidth maxWidth="md">
       <DialogTitle sx={{ fontFamily: "Prompt", fontWeight: "bold" }}><Users style={{ marginRight: 8 }} /> คำขอลงทะเบียน</DialogTitle>
        <DialogContent>
            {tempUsers.length === 0 ? (
            <Typography sx={{ fontFamily: "Prompt" }}>ไม่มีคำขอลงทะเบียน</Typography>
            ) : (
            <Table>
                <TableHead>
                <TableRow>
                    <TableCell sx={HeaderCellStyle}>Username</TableCell>
                    <TableCell sx={HeaderCellStyle}>ชื่อผู้ใช้</TableCell>
                    <TableCell sx={HeaderCellStyle}>Email</TableCell>
                    <TableCell sx={HeaderCellStyle}>ระดับ</TableCell>
                    <TableCell sx={HeaderCellStyle} align="right">ยืนยัน</TableCell>
                    <TableCell sx={HeaderCellStyle} align="right">ลบ</TableCell>
                </TableRow>
                </TableHead>
                <TableBody>
                    {tempUsers.map((user, index) => (
                        <TableRow key={user.User_ID}>
                        <TableCell sx={getCellStyle(index)}>{user.Username}</TableCell>
                        <TableCell sx={getCellStyle(index)}>{user.Name}</TableCell>
                        <TableCell sx={getCellStyle(index)}>{user.email}</TableCell>
                        <TableCell sx={getCellStyle(index)}>{mapUserLevel(user.iduser_level)}</TableCell>
                        <TableCell sx={getCellStyle(index)} align="right">
                            <Button
                            variant="contained"
                            color="success"
                            onClick={() => handleApprove(user.User_ID)}
                            sx={HeaderFont}
                            >
                            ยืนยัน
                            </Button>
                        </TableCell>
                        <TableCell sx={getCellStyle(index)} align="right">
                            <Button
                                variant="contained"
                                color="error"
                                onClick={() => handleReject(user.User_ID)}
                                sx={HeaderFont}
                                >
                                ลบ
                        </Button>
                        </TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
            </Table>
            )}
        </DialogContent>

        <DialogActions>
            <Button onClick={() => setOpenTempDialog(false)} variant="outlined" color="error" sx={HeaderFont}>ปิด</Button>
        </DialogActions>
        </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity as any} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
     
      <Dialog open={showAlertDialog} onClose={() => setShowAlertDialog(false)}>

            <DialogTitle sx={{ fontFamily: "Prompt", fontWeight: "bold", textAlign: "center" }}>
                มีคำขอลงทะเบียนใหม่
            </DialogTitle>
      
        
      
        <DialogActions sx={{ justifyContent: "center", pb: 2 }}>
            <Badge badgeContent={tempCount} color="error">
                <Button
                variant="contained"
                color="info"
                onClick={() => {
                    setOpenTempDialog(true);       // เปิดรายการคำขอ
                    setShowAlertDialog(false);     // ปิดแจ้งเตือน
                }}
                sx={HeaderFont}
                >
                <Users style={{ marginRight: 8 }} /> ตรวจสอบคำขอ
                </Button>
            </Badge>
            </DialogActions>
        </Dialog>

        <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} fullWidth maxWidth="sm">
            <DialogTitle sx={{ fontFamily: "Prompt", fontWeight: "bold" }}>เพิ่มผู้ใช้งาน</DialogTitle>
            <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
                <TextField label="Username" value={newUser.Username} onChange={(e) => setNewUser({ ...newUser, Username: e.target.value })} fullWidth />
                <TextField label="ชื่อผู้ใช้" value={newUser.Name} onChange={(e) => setNewUser({ ...newUser, Name: e.target.value })} fullWidth />
                <TextField label="Email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} fullWidth />
                <TextField label="Password" type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} fullWidth />
                <TextField
                label="ระดับผู้ใช้ (1=Guest, 2=Admin)"
                type="number"
                value={newUser.iduser_level}
                onChange={(e) => setNewUser({ ...newUser, iduser_level: Number(e.target.value) })}
                fullWidth
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setOpenAddDialog(false)} sx={HeaderFont}>ยกเลิก</Button>
                <Button onClick={async () => {
                try {
                    const res = await fetch(`${API_URL}/user/register`, {
                    method: "POST",
                    headers: { "Content-Type": "application/x-www-form-urlencoded" },
                    body: new URLSearchParams({
                        username: newUser.Username,
                        name: newUser.Name,
                        email: newUser.email,
                        password: newUser.password,
                        iduser_level: newUser.iduser_level.toString()
                    }).toString(),
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.messages?.error || "ไม่สามารถเพิ่มผู้ใช้ได้");
                    setSnackbar({ open: true, message: "เพิ่มผู้ใช้งานสำเร็จ", severity: "success" });
                    setOpenAddDialog(false);
                    setNewUser({ Username: "", Name: "", email: "", password: "", iduser_level: 1 });
                    fetchUsers();
                } catch (err: any) {
                    setSnackbar({ open: true, message: "เกิดข้อผิดพลาด: " + err.message, severity: "error" });
                }
                }} variant="contained" color="primary" sx={HeaderFont}>
                บันทึก
                </Button>
            </DialogActions>
            </Dialog>


       
        <Button
            variant="contained"
            color="success"
            onClick={() => setOpenAddDialog(true)}
            sx={{ ...HeaderFont, my: 2 ,px:2 }}
            >
            เพิ่มผู้ใช้งาน
        </Button>
    </Box>
    
  );
};

export default UserManagement;
