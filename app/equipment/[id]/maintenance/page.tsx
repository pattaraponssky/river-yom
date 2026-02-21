// app/equipment/[id]/maintenance/page.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  InputAdornment,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  IconButton,
  Tooltip,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { API_URL } from '@/lib/utility';
import { useParams, useRouter } from 'next/navigation';
import SearchIcon from '@mui/icons-material/Search';
import { useAuth } from '@/contexts/AuthContext';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

interface MaintenanceRecord {
  id: number;
  equipment_id: string;
  maintenance_date: string;
  type: string;
  technician_name: string;
  cost: number;
  description: string;
  next_due_date: string | null;
  status: string;
}

export default function EquipmentMaintenancePage() {
  const { id } = useParams(); // ดึง ID จาก URL
  const router = useRouter(); // เพิ่ม router เพื่อย้อนกลับ
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { currentUser, loading } = useAuth();

  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [newRecord, setNewRecord] = useState<Partial<MaintenanceRecord>>({
    equipment_id: id as string,
    maintenance_date: new Date().toISOString().split('T')[0],
    type: 'preventive',
    technician_name: '',
    cost: 0,
    description: '',
    next_due_date: '',
    status: 'completed',
  });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editRecord, setEditRecord] = useState<MaintenanceRecord | null>(null); 

  useEffect(() => {
    const fetchMaintenance = async () => {
      try {
        setError(null);

        const res = await fetch(`${API_URL}/api/equipments/${id}/maintenance`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
          },
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || `ดึงข้อมูลล้มเหลว: ${res.status}`);
        }

        const json = await res.json();
        setRecords(json.data || []);
      } catch (err: any) {
        setError(err.message || 'เกิดข้อผิดพลาดในการดึงข้อมูลการบำรุงรักษา');
        console.error('Fetch error:', err);
      } finally {
      }
    };

    if (id) fetchMaintenance();
  }, [id]);

  const handleBack = () => {
    router.back(); // ย้อนกลับไปหน้าที่มาก่อนหน้า (ปกติคือ /equipment)
  };

  const filteredRecords = useMemo(() => {
    if (!searchTerm) return records;
    const lowerSearch = searchTerm.toLowerCase();
    return records.filter(record =>
      Object.values(record).some(value =>
        String(value).toLowerCase().includes(lowerSearch)
      )
    );
  }, [records, searchTerm]);

  const handleOpenAdd = () => setOpenAddDialog(true);
  const handleCloseAdd = () => {
    setOpenAddDialog(false);
    setSubmitError(null);
    // reset form
    setNewRecord({
      equipment_id: id as string,
      maintenance_date: new Date().toISOString().split('T')[0],
      type: 'preventive',
      technician_name: '',
      cost: 0,
      description: '',
      next_due_date: '',
      status: 'completed',
    });
  };

  // ฟังก์ชันบันทึกข้อมูลใหม่
  const handleSubmit = async () => {
    setSubmitLoading(true);
    setSubmitError(null);

    try {
      const res = await fetch(`${API_URL}/api/equipments/${id}/maintenance`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(newRecord),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || err.error || 'บันทึกข้อมูลล้มเหลว');
      }

      const json = await res.json();
      // เพิ่ม record ใหม่เข้า list ทันที (optimistic update)
      setRecords((prev) => [json.data, ...prev]);

      handleCloseAdd();
      alert('บันทึกประวัติการบำรุงรักษาสำเร็จ');
    } catch (err: any) {
      setSubmitError(err.message || 'เกิดข้อผิดพลาดในการบันทึก');
      console.error('Submit error:', err);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewRecord((prev) => ({
      ...prev,
      [name]: name === 'cost' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSelectChange = (e: any) => {
    const { name, value } = e.target;
    setNewRecord((prev) => ({ ...prev, [name]: value }));
  };

  // ฟังก์ชันเปิด Dialog แก้ไข
  const handleEdit = (record: MaintenanceRecord) => {
    setEditRecord(record);
    setOpenEditDialog(true);
  };

  // ฟังก์ชันลบ (ยืนยันก่อน)
  const handleDeleteClick = (recordId: number) => {
    if (!confirm('ยืนยันการลบประวัติการบำรุงรักษานี้หรือไม่?')) return;

    deleteMaintenance(recordId);
  };

  // ฟังก์ชันลบจริง
  const deleteMaintenance = async (recordId: number) => {
    try {
      const res = await fetch(`${API_URL}/api/equipments/${id}/maintenance/${recordId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Accept': 'application/json' },
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'ลบข้อมูลล้มเหลว');
      }

      // ลบออกจาก state ทันที
      setRecords((prev) => prev.filter(r => r.id !== recordId));
      alert('ลบประวัติการบำรุงรักษาสำเร็จ');
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
      console.error(err);
    }
  };

  const handleUpdate = async () => {
    if (!editRecord) return;

    setSubmitLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/equipments/${id}/maintenance/${editRecord.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editRecord),
      });

      if (!res.ok) throw new Error('แก้ไขล้มเหลว');

      const json = await res.json();
      // อัปเดต state
      setRecords((prev) =>
        prev.map((r) => (r.id === editRecord.id ? json.data : r))
      );

      setOpenEditDialog(false);
      alert('แก้ไขสำเร็จ');
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

    if (loading) {
    return <div>กำลังตรวจสอบสิทธิ์...</div>;
  }
  
  if (!currentUser || currentUser.iduser_level < 2) {
    return <div>ไม่มีสิทธิ์เข้าถึงหน้านี้</div>;
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* ปุ่มย้อนกลับ + หัวข้อ */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 ,justifyContent: 'space-between'}}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
            
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button variant="contained" color="primary" onClick={handleBack} startIcon={<ArrowBackIcon />}>
              ย้อนกลับ
            </Button>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              color="success"
              startIcon={<AddIcon />}
              onClick={handleOpenAdd}
            >
              เพิ่มประวัติการบำรุงรักษา
            </Button>
          </Box>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
              ประวัติการบำรุงรักษา - อุปกรณ์ ID: {id}
              {records.length > 0 ? ` (${records.length} รายการ)` : ''}
            </Typography>
          </Box>

        </Box>
      {/* ช่องค้นหา */}
          
          <TextField
            placeholder="ค้นหาประวัติการบำรุงรักษา..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            sx={{ width: { xs: '100%', sm: 320 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            />
        
        </Box>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress size={60} />
        </Box>
      ) : filteredRecords.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            {searchTerm ? 'ไม่พบประวัติที่ตรงกับการค้นหา' : 'ยังไม่มีประวัติการบำรุงรักษาสำหรับอุปกรณ์นี้'}
          </Typography>
        </Box>
      ) : (
        <Box
          sx={{
            bgcolor: 'background.paper',
            borderRadius: 2,
            overflow: 'hidden',
            boxShadow: 3,
          }}
        >
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'primary.main' }}>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>
                    การจัดการ
                  </TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>วันที่บำรุง</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>ประเภท</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>ช่างผู้รับผิดชอบ</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>ค่าใช้จ่าย</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>รายละเอียด</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>กำหนดครั้งถัดไป</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>สถานะ</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRecords.map((record, index) => (
                  <TableRow key={record.id} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                    <TableCell align="center">
                      <Tooltip title="แก้ไข">
                        <IconButton
                          color="primary"
                          size="small"
                          onClick={() => handleEdit(record)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="ลบ">
                        <IconButton
                          color="error"
                          size="small"
                          onClick={() => handleDeleteClick(record.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                    <TableCell>{record.maintenance_date}</TableCell>
                    <TableCell>{record.type}</TableCell>
                    <TableCell>{record.technician_name || '-'}</TableCell>
                    <TableCell>{record.cost ? record.cost.toLocaleString() + ' บาท' : '-'}</TableCell>
                    <TableCell>{record.description || '-'}</TableCell>
                    <TableCell>{record.next_due_date || '-'}</TableCell>
                    <TableCell>
                      <Box
                        sx={{
                          px: 1.5,
                          py: 0.5,
                          borderRadius: 12,
                          bgcolor:
                            record.status === 'completed' ? 'success.main' :
                            record.status === 'pending' ? 'warning.main' :
                            'error.main',
                          color: 'white',
                          fontSize: '0.85rem',
                          fontWeight: 'bold',
                          textAlign: 'center',
                        }}
                      >
                        {record.status === 'completed' ? 'เสร็จสิ้น' :
                         record.status === 'pending' ? 'รอดำเนินการ' : 'ล้มเหลว'}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Dialog เพิ่มประวัติการบำรุงรักษา */}
      <Dialog open={openAddDialog} onClose={handleCloseAdd} maxWidth="md" fullWidth>
        <DialogTitle>เพิ่มประวัติการบำรุงรักษาใหม่</DialogTitle>
        <DialogContent>
          {submitError && <Alert severity="error" sx={{ mb: 2 }}>{submitError}</Alert>}

          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="วันที่บำรุงรักษา"
                type="date"
                name="maintenance_date"
                value={newRecord.maintenance_date || ''}
                onChange={handleInputChange}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth required>
                <InputLabel>ประเภทการบำรุงรักษา</InputLabel>
                <Select
                  name="type"
                  value={newRecord.type || 'preventive'}
                  label="ประเภทการบำรุงรักษา"
                  onChange={handleSelectChange}
                >
                  <MenuItem value="preventive">ป้องกัน (Preventive)</MenuItem>
                  <MenuItem value="corrective">แก้ไข (Corrective)</MenuItem>
                  <MenuItem value="predictive">คาดการณ์ (Predictive)</MenuItem>
                  <MenuItem value="other">อื่นๆ</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="ช่างผู้รับผิดชอบ"
                name="technician_name"
                value={newRecord.technician_name || ''}
                onChange={handleInputChange}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="ค่าใช้จ่าย (บาท)"
                name="cost"
                type="number"
                value={newRecord.cost || ''}
                onChange={handleInputChange}
                InputProps={{ inputProps: { min: 0 } }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="รายละเอียด"
                name="description"
                multiline
                rows={3}
                value={newRecord.description || ''}
                onChange={handleInputChange}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="กำหนดครั้งถัดไป"
                type="date"
                name="next_due_date"
                value={newRecord.next_due_date || ''}
                onChange={handleInputChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth required>
                <InputLabel>สถานะ</InputLabel>
                <Select
                  name="status"
                  value={newRecord.status || 'completed'}
                  label="สถานะ"
                  onChange={handleSelectChange}
                >
                  <MenuItem value="completed">เสร็จสิ้น</MenuItem>
                  <MenuItem value="pending">รอดำเนินการ</MenuItem>
                  <MenuItem value="failed">ล้มเหลว</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseAdd} disabled={submitLoading}>
            ยกเลิก
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmit}
            disabled={submitLoading}
            startIcon={submitLoading ? <CircularProgress size={20} /> : null}
          >
            {submitLoading ? 'กำลังบันทึก...' : 'บันทึก'}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>แก้ไขประวัติการบำรุงรักษา</DialogTitle>
        <DialogContent>
          {editRecord && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {/* วันที่บำรุงรักษา */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  required
                  label="วันที่บำรุงรักษา"
                  type="date"
                  name="maintenance_date"
                  value={editRecord.maintenance_date || ''}
                  onChange={(e) =>
                    setEditRecord({ ...editRecord, maintenance_date: e.target.value })
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              {/* ประเภทการบำรุงรักษา */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth required>
                  <InputLabel>ประเภทการบำรุงรักษา</InputLabel>
                  <Select
                    name="type"
                    value={editRecord.type || 'preventive'}
                    label="ประเภทการบำรุงรักษา"
                    onChange={(e) =>
                      setEditRecord({ ...editRecord, type: e.target.value as string })
                    }
                  >
                    <MenuItem value="preventive">ป้องกัน (Preventive)</MenuItem>
                    <MenuItem value="corrective">แก้ไข (Corrective)</MenuItem>
                    <MenuItem value="predictive">คาดการณ์ (Predictive)</MenuItem>
                    <MenuItem value="other">อื่นๆ</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* ช่างผู้รับผิดชอบ */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="ช่างผู้รับผิดชอบ"
                  name="technician_name"
                  value={editRecord.technician_name || ''}
                  onChange={(e) =>
                    setEditRecord({ ...editRecord, technician_name: e.target.value })
                  }
                />
              </Grid>

              {/* ค่าใช้จ่าย */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="ค่าใช้จ่าย (บาท)"
                  name="cost"
                  type="number"
                  value={editRecord.cost ?? ''}
                  onChange={(e) =>
                    setEditRecord({
                      ...editRecord,
                      cost: parseFloat(e.target.value) || 0,
                    })
                  }
                  InputProps={{
                    inputProps: { min: 0 },
                    endAdornment: <InputAdornment position="end">บาท</InputAdornment>,
                  }}
                />
              </Grid>

              {/* รายละเอียด */}
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="รายละเอียด"
                  name="description"
                  multiline
                  rows={3}
                  value={editRecord.description || ''}
                  onChange={(e) =>
                    setEditRecord({ ...editRecord, description: e.target.value })
                  }
                />
              </Grid>

              {/* กำหนดครั้งถัดไป */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="กำหนดครั้งถัดไป"
                  type="date"
                  name="next_due_date"
                  value={editRecord.next_due_date || ''}
                  onChange={(e) =>
                    setEditRecord({ ...editRecord, next_due_date: e.target.value })
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              {/* สถานะ */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth required>
                  <InputLabel>สถานะ</InputLabel>
                  <Select
                    name="status"
                    value={editRecord.status || 'completed'}
                    label="สถานะ"
                    onChange={(e) =>
                      setEditRecord({ ...editRecord, status: e.target.value as string })
                    }
                  >
                    <MenuItem value="completed">เสร็จสิ้น</MenuItem>
                    <MenuItem value="pending">รอดำเนินการ</MenuItem>
                    <MenuItem value="failed">ล้มเหลว</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)}>ยกเลิก</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleUpdate}
            disabled={submitLoading}
          >
            บันทึกการแก้ไข
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}