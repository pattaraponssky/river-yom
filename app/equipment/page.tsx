// app/equipment/page.tsx
"use client";

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

interface Equipment {
  id: string;
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
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;
  const { currentUser, requirePermission } = useAuth();

  useEffect(() => {
    if (!loading) {
          requirePermission(1, '/dashboard');
        }
      }, [loading, requirePermission]);
    
    if (loading) {
      return <div>กำลังตรวจสอบสิทธิ์...</div>;
    }
    
    if (!currentUser || currentUser.iduser_level < 2) {
      return <div>ไม่มีสิทธิ์เข้าถึงหน้านี้</div>;
    }

  useEffect(() => {
    const fetchEquipments = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`${API_URL}/api/equipments`, {
          method: 'GET',
          credentials: 'include',
          headers: { 'Accept': 'application/json' },
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || `ดึงข้อมูลล้มเหลว: ${res.status}`);
        }

        const json = await res.json();
        setEquipments(json.data || []);
      } catch (err: any) {
        setError(err.message || 'เกิดข้อผิดพลาดในการดึงข้อมูล');
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEquipments();
  }, []);

  // กรองข้อมูลตามคำค้นหา
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

  const handlePageChange = (_: any, value: number) => {
    setPage(value);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* หัวข้อ + ปุ่มเพิ่ม */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 4,
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Typography
          variant="h4"
          component="h1"
          sx={{
            ...titleStyle,
            fontWeight: 'bold',
            color: 'text.primary',
          }}
        >
          รายการอุปกรณ์
        </Typography>
        <Box sx={{ gap: 2, display: 'flex', flexWrap: 'wrap' }}>
        <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                sx={{ ...titleStyle, minWidth: 160 }}
                >
            เพิ่มอุปกรณ์ใหม่
            </Button>

            <TextField
            placeholder="ค้นหาอุปกรณ์..."
            value={searchTerm}
            onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1); // รีเซ็ตหน้าเมื่อค้นหาใหม่
            }}
            size="medium"
            sx={{ width: { xs: '100%', sm: 300 } }}
            InputProps={{
                startAdornment: (
                <InputAdornment position="start">
                    <SearchIcon />
                </InputAdornment>
                ),
            }}
            />
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress size={60} />
        </Box>
      ) : filteredEquipments.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            {searchTerm ? 'ไม่พบข้อมูลที่ตรงกับการค้นหา' : 'ยังไม่มีข้อมูลอุปกรณ์'}
          </Typography>
        </Box>
      ) : (
        <>
          <TableContainer
            component={Paper}
            sx={{
              borderRadius: 2,
              overflowX: 'auto',
              boxShadow: 3,
              bgcolor: 'background.paper',
            }}
          >
            <Table sx={{ minWidth: 650 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: 'primary.main' }}>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>
                    ประวัติการบำรุง
                  </TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>
                    จัดการ
                  </TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>ID</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>ชื่ออุปกรณ์</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>ประเภท</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>สถานที่</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>พิกัด</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>
                    สถานะ
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedData.map((row, index) => (
                  <TableRow
                    key={row.id}
                    sx={{
                      '&:hover': { bgcolor: 'action.hover' },
                      bgcolor: index % 2 === 0 ? 'action.hover' : 'inherit',
                    }}
                  >
                    <TableCell align="center">
                      <Tooltip title="ดูประวัติการบำรุงรักษา">
                        <IconButton
                          color="info"
                          size="small"
                          onClick={() => router.push(`/equipment/${row.id}/maintenance`)}
                        >
                          <HistoryIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="แก้ไข">
                        <IconButton color="primary" size="small">
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="ลบ">
                        <IconButton color="error" size="small">
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                    <TableCell>{row.id}</TableCell>
                    <TableCell>{row.name}</TableCell>
                    <TableCell>{row.type}</TableCell>
                    <TableCell>{row.location}</TableCell>
                    <TableCell>
                      {row.latitude && row.longitude
                        ? `${Number(row.latitude).toFixed(6)} / ${Number(row.longitude).toFixed(6)}`
                        : '-'}
                    </TableCell>
                    <TableCell align="center">
                      <Box
                        sx={{
                          px: 1.5,
                          py: 0.5,
                          borderRadius: 12,
                          bgcolor:
                            row.status === 'active' ? 'success.main' :
                            row.status === 'maintenance' ? 'warning.main' :
                            row.status === 'broken' ? 'error.main' : 'grey.500',
                          color: 'white',
                          fontSize: '0.85rem',
                          fontWeight: 'bold',
                          minWidth: 100,
                        }}
                      >
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

          {/* Pagination */}
          {Math.ceil(filteredEquipments.length / rowsPerPage) > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={Math.ceil(filteredEquipments.length / rowsPerPage)}
                page={page}
                onChange={handlePageChange}
                color="primary"
                size="large"
              />
            </Box>
          )}
        </>
      )}
    </Container>
  );
}