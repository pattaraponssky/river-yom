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
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { API_URL } from '@/lib/utility';
import { titleStyle } from '@/theme/style';
import { useParams, useRouter } from 'next/navigation';
import SearchIcon from '@mui/icons-material/Search';
import { useAuth } from '@/contexts/AuthContext';

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

  if (loading) {
    return <div>กำลังตรวจสอบสิทธิ์...</div>;
  }
  
  if (!currentUser || currentUser.iduser_level < 2) {
    return <div>ไม่มีสิทธิ์เข้าถึงหน้านี้</div>;
  }

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

  // ฟังก์ชันย้อนกลับไปหน้ารายการอุปกรณ์
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

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* ปุ่มย้อนกลับ + หัวข้อ */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 ,justifyContent: 'space-between'}}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
                variant="contained"
                color="primary"
                onClick={handleBack}
                startIcon={<ArrowBackIcon />}
                sx={{ ...titleStyle, minWidth: 160 }}
                >
            ย้อนกลับ
          </Button>

                  <Typography
            variant="h5"
            component="h1"
            sx={{
              ...titleStyle,
              fontWeight: 'bold',
              color: 'text.primary',
            }}
          >
            ประวัติการบำรุงรักษา - อุปกรณ์ ID: {id}
            {records.length > 0 ? ` (${records.length} รายการ)` : ''}
          </Typography>
        </Box>
      {/* ช่องค้นหา */}
       
          <TextField
            placeholder="ค้นหาประวัติการบำรุงรักษา..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="medium"
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
    </Container>
  );
}