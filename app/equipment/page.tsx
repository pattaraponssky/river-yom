'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Button,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  InputAdornment,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import HistoryIcon from '@mui/icons-material/History';
import SearchIcon from '@mui/icons-material/Search';
import { API_URL } from '@/lib/utility';
import { titleStyle } from '@/theme/style';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import EquipmentDialog from '@/components/Equipment/EquipmentDialog';

interface Equipment {
  id?: string;
  name: string;
  type: string;
  location: string;
  latitude?: string | null;
  longitude?: string | null;
  purchase_date: string | null;
  warranty_expiry: string | null;
  status: 'active' | 'maintenance' | 'broken' | 'retired';
  created_at: string;
  updated_at: string;
}

export default function EquipmentPage() {
  const router = useRouter();
  const { currentUser, loading: authLoading, hasPermission } = useAuth();

  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;
  const [openDialog, setOpenDialog] = useState(false);
  const [equipmentToEdit, setEquipmentToEdit] = useState<Equipment | null>(null);
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchEquipments = async () => {
    try {
      setError(null);
      const res = await fetch(`${API_URL}/api/equipments`, {
        credentials: 'include',
      });

      if (!res.ok) throw new Error('ดึงข้อมูลล้มเหลว');

      const json = await res.json();
      setEquipments(json.data || []);
    } catch (err: any) {
      setError(err.message);
    }
  };

  useEffect(() => {
    if (!authLoading && currentUser && hasPermission(1)) {
      fetchEquipments();
    }
  }, [authLoading, currentUser]);

  // เปิด Dialog เพิ่มใหม่
  const handleAddNew = () => {
    setEquipmentToEdit(null);
    setOpenDialog(true);
  };

  // เปิด Dialog แก้ไข
  const handleEdit = (equipment: Equipment) => {
    setEquipmentToEdit(equipment);
    setOpenDialog(true);
  };

  // ยืนยันลบ
  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
    setOpenDeleteConfirm(true);
  };

  // ลบจริง
  const handleDeleteConfirm = async () => {
    if (!deleteId) return;

    try {
      const res = await fetch(`${API_URL}/api/equipments/delete/${deleteId}`, {
        method: 'POST',  // ตาม routes ของคุณใช้ POST สำหรับ delete
        credentials: 'include',
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'ลบล้มเหลว');
      }

      // ลบออกจาก state ทันที (optimistic update)
      setEquipments(prev => prev.filter(item => item.id !== deleteId));
      setOpenDeleteConfirm(false);
      setDeleteId(null);
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการลบ');
    }
  };

  // หลังบันทึกสำเร็จ (เพิ่มหรือแก้ไข)
  const handleSuccess = () => {
    fetchEquipments(); // รีเฟรชข้อมูล
    setOpenDialog(false);
    setEquipmentToEdit(null);
  };

  const filteredEquipments = useMemo(() => {
    if (!searchTerm) return equipments;

    const lowerSearch = searchTerm.toLowerCase();
    return equipments.filter(row =>
      Object.values(row).some(value =>
        String(value).toLowerCase().includes(lowerSearch)
      )
    );
  }, [equipments, searchTerm]);

  // Pagination
  const paginatedData = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filteredEquipments.slice(start, start + rowsPerPage);
  }, [filteredEquipments, page]);

  const totalPages = Math.ceil(filteredEquipments.length / rowsPerPage);

    if (authLoading) {
      return <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>;
    }

    if (!currentUser || !hasPermission(1)) {
      return <Box sx={{ p: 4, textAlign: 'center' }}><Typography variant="h6" color="error">ไม่มีสิทธิ์เข้าถึงหน้านี้</Typography></Box>;
    }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ ...titleStyle, fontWeight: 'bold' }}>
          รายการอุปกรณ์
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={handleAddNew}>
            เพิ่มอุปกรณ์ใหม่
          </Button>
          <TextField
            placeholder="ค้นหาอุปกรณ์..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            size="small"
            sx={{ width: { xs: '100%', sm: 300 } }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
            }}
          />
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* Dialog เพิ่ม/แก้ไข */}
      <EquipmentDialog
        open={openDialog}
        onClose={() => {
          setOpenDialog(false);
          setEquipmentToEdit(null);
        }}
        onSuccess={handleSuccess}
        equipmentToEdit={equipmentToEdit}
      />

      {/* Confirm ลบ */}
      <Dialog open={openDeleteConfirm} onClose={() => setOpenDeleteConfirm(false)}>
        <DialogTitle>ยืนยันการลบ</DialogTitle>
        <DialogContent>
          <DialogContentText>คุณแน่ใจหรือไม่ที่จะลบอุปกรณ์นี้? การกระทำนี้ไม่สามารถย้อนกลับได้</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteConfirm(false)}>ยกเลิก</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">ลบ</Button>
        </DialogActions>
      </Dialog>

      {/* ... Table และ Pagination เหมือนเดิม */}
      <TableContainer component={Paper} sx={{ borderRadius: 2, overflowX: 'auto', boxShadow: 3 }}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow sx={{ bgcolor: 'primary.main' }}>
              <TableCell sx={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>ประวัติการบำรุง</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>จัดการ</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>ID</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>ชื่ออุปกรณ์</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>ประเภท</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>สถานที่</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>พิกัด</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>สถานะ</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData.map((row, index) => (
              <TableRow key={row.id} sx={{ '&:hover': { bgcolor: 'action.hover' }, bgcolor: index % 2 === 0 ? 'action.hover' : 'inherit' }}>
                <TableCell align="center">
                  <Tooltip title="ดูประวัติการบำรุงรักษา">
                    <IconButton color="info" size="small" onClick={() => router.push(`/equipment/${row.id}/maintenance`)}>
                      <HistoryIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
                <TableCell align="center">
                  <Tooltip title="แก้ไข">
                    <IconButton color="primary" size="small" onClick={() => handleEdit(row)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="ลบ">
                    <IconButton color="error" size="small" onClick={() => handleDeleteClick(row.id!)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
                <TableCell>{row.id}</TableCell>
                <TableCell>{row.name}</TableCell>
                <TableCell>{row.type}</TableCell>
                <TableCell>{row.location}</TableCell>
                <TableCell>
                  {row.latitude && row.longitude ? `${Number(row.latitude).toFixed(6)} / ${Number(row.longitude).toFixed(6)}` : '-'}
                </TableCell>
                <TableCell align="center">
                  <Box sx={{
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 12,
                    bgcolor: row.status === 'active' ? 'success.main' :
                             row.status === 'maintenance' ? 'warning.main' :
                             row.status === 'broken' ? 'error.main' : 'grey.500',
                    color: 'white',
                    fontSize: '0.85rem',
                    fontWeight: 'bold',
                    minWidth: 100,
                  }}>
                    {row.status === 'active' ? 'ใช้งานอยู่' :
                     row.status === 'maintenance' ? 'บำรุงรักษา' :
                     row.status === 'broken' ? 'ชำรุด' : 'ปลดระวาง'}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination เหมือนเดิม */}
    </Container>
  );
}