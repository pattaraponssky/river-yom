'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Container, Typography, Box, CircularProgress, Alert, Button,
  IconButton, Tooltip, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, TextField, InputAdornment, Pagination,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
  TableSortLabel, Select, MenuItem, FormControl, InputLabel, Chip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import HistoryIcon from '@mui/icons-material/History';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import PlaceIcon from '@mui/icons-material/Place';
import { API_URL } from '@/lib/utility';
import { titleStyle } from '@/theme/style';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import EquipmentDialog from '@/components/Equipment/EquipmentDialog';
import { apiRequest } from '@/lib/api';

// ─── ต้องตรงกับตาราง equipment ใหม่ (ผูกกับ tele_info ผ่าน sta_code) ──────────
interface Equipment {
  id?: string;
  sta_code: string;
  name: string;
  type: 'radar_sensor' | 'rain_gauge' | 'camera' | 'solar_panel' | 'battery' | 'datalogger' | 'gate_actuator' | 'network' | 'other';
  serial_number: string | null;
  brand_model: string | null;
  purchase_date: string | null;
  warranty_expiry: string | null;
  photo: string | null;
  status: 'active' | 'maintenance' | 'broken' | 'retired';
  created_at: string;
  updated_at: string;
}

interface StationOption {
  sta_code: string;
  sta_name: string;
}

type SortField = 'id' | 'sta_code' | 'name' | 'type' | 'status' | 'updated_at' | 'created_at';
type SortOrder = 'asc' | 'desc';

const STATUS_OPTIONS = [
  { value: '', label: 'ทั้งหมด' },
  { value: 'active', label: 'ใช้งานอยู่' },
  { value: 'maintenance', label: 'บำรุงรักษา' },
  { value: 'broken', label: 'ชำรุด' },
  { value: 'retired', label: 'ปลดระวาง' },
];

const STATUS_COLOR: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
  active:      'success',
  maintenance: 'warning',
  broken:      'error',
  retired:     'default',
};

const STATUS_LABEL: Record<string, string> = {
  active:      'ใช้งานอยู่',
  maintenance: 'บำรุงรักษา',
  broken:      'ชำรุด',
  retired:     'ปลดระวาง',
};

const TYPE_LABEL: Record<string, string> = {
  radar_sensor:  'เรดาร์วัดระดับน้ำ',
  rain_gauge:    'สถานีวัดน้ำฝน',
  camera:        'กล้อง CCTV',
  solar_panel:   'ระบบไฟฟ้า/โซล่าเซลล์',
  battery:       'แบตเตอรี่',
  datalogger:    'Data Logger',
  gate_actuator: 'ระบบควบคุมประตูน้ำ',
  network:       'ระบบเครือข่าย',
  other:         'อื่นๆ',
};

export default function EquipmentPage() {
  const router = useRouter();
  const { currentUser, loading: authLoading, hasPermission } = useAuth();

  const [equipments, setEquipments]         = useState<Equipment[]>([]);
  const [stations, setStations]             = useState<StationOption[]>([]);
  const [error, setError]                   = useState<string | null>(null);
  const [searchTerm, setSearchTerm]         = useState('');
  const [page, setPage]                     = useState(1);
  const [sortField, setSortField]           = useState<SortField>('updated_at');
  const [sortOrder, setSortOrder]           = useState<SortOrder>('desc');
  const [filterStatus, setFilterStatus]     = useState('');
  const [filterStaCode, setFilterStaCode]   = useState('');
  const [openDialog, setOpenDialog]         = useState(false);
  const [equipmentToEdit, setEquipmentToEdit] = useState<Equipment | null>(null);
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
  const [deleteId, setDeleteId]             = useState<string | null>(null);
  const rowsPerPage = 10;

  const fetchEquipments = async () => {
    try {
      setError(null);
      const res = await fetch(`${API_URL}/api/equipments`, { credentials: 'include' });
      if (!res.ok) throw new Error('ดึงข้อมูลล้มเหลว');
      const json = await res.json();
      setEquipments(Array.isArray(json.data) ? json.data : []);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const fetchStations = async () => {
    try {
      const res = await fetch(`${API_URL}/api/stations`, { credentials: 'include' });
      if (!res.ok) return;
      const json = await res.json();
      setStations(Array.isArray(json.data) ? json.data : []);
    } catch {
      // ไม่ critical — แค่ใช้สำหรับตัวกรอง/แสดงชื่อสถานี ถ้าดึงไม่ได้ก็แสดงแค่ sta_code แทน
    }
  };

  useEffect(() => {
    if (!authLoading && currentUser && hasPermission(1)) {
      fetchEquipments();
      fetchStations();
    }
  }, [authLoading, currentUser]);

  const staNameByCode = useMemo(() => {
    const map: Record<string, string> = {};
    stations.forEach(s => { map[s.sta_code] = s.sta_name; });
    return map;
  }, [stations]);

  // ─── Sort handler ─────────────────────────────────────────────
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setPage(1);
  };

  // ─── Filter → Sort → Paginate ─────────────────────────────────
  const processedData = useMemo(() => {
    let data = [...equipments];

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      data = data.filter(row =>
        [row.name, row.type, row.sta_code, row.serial_number, row.brand_model, row.status, String(row.id)]
          .some(v => (v ?? '').toString().toLowerCase().includes(q))
      );
    }

    if (filterStatus) {
      data = data.filter(row => row.status === filterStatus);
    }

    if (filterStaCode) {
      data = data.filter(row => row.sta_code === filterStaCode);
    }

    data.sort((a, b) => {
      const aVal = a[sortField] ?? '';
      const bVal = b[sortField] ?? '';

      if (sortField === 'id') {
        return sortOrder === 'asc'
          ? Number(a.id) - Number(b.id)
          : Number(b.id) - Number(a.id);
      }

      if (sortField === 'updated_at' || sortField === 'created_at') {
        const aTime = new Date(aVal).getTime();
        const bTime = new Date(bVal).getTime();
        return sortOrder === 'asc' ? aTime - bTime : bTime - aTime;
      }

      const cmp = String(aVal).localeCompare(String(bVal), 'th');
      return sortOrder === 'asc' ? cmp : -cmp;
    });

    return data;
  }, [equipments, searchTerm, filterStatus, filterStaCode, sortField, sortOrder]);

  const paginatedData = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return processedData.slice(start, start + rowsPerPage);
  }, [processedData, page]);

  const totalPages = Math.ceil(processedData.length / rowsPerPage);

  // ─── Helpers ──────────────────────────────────────────────────
  const SortCell = ({
    field, label, align = 'left',
  }: {
    field: SortField;
    label: string;
    align?: 'left' | 'center' | 'right';
  }) => (
    <TableCell
      align={align}
      sx={{ color: 'white', fontWeight: 'bold', whiteSpace: 'nowrap',
            '& .MuiTableSortLabel-root': { color: 'white !important' },
            '& .MuiTableSortLabel-root.Mui-active': { color: 'white !important' },
            '& .MuiTableSortLabel-icon': { color: 'white !important' },
      }}
    >
      <TableSortLabel
        active={sortField === field}
        direction={sortField === field ? sortOrder : 'asc'}
        onClick={() => handleSort(field)}
        sx={{ color: 'white', '&:hover': { color: 'rgba(255,255,255,0.8)' } }}
      >
        {label}
      </TableSortLabel>
    </TableCell>
  );

  const formatDate = (s: string) => {
    if (!s) return '-';
    return new Date(s).toLocaleString('th-TH', {
      day: '2-digit', month: 'short', year: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });
  };

  // ─── Auth guard ───────────────────────────────────────────────
  if (authLoading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>;
  }
  if (!currentUser || !hasPermission(1)) {
    return <Box sx={{ p: 4, textAlign: 'center' }}><Typography variant="h6" color="error">ไม่มีสิทธิ์เข้าถึงหน้านี้</Typography></Box>;
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>

      {/* ─── Header ──────────────────────────────────────────── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ ...titleStyle, fontWeight: 'bold' }}>
            รายการอุปกรณ์ (ทุกสถานี)
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'Prompt' }}>
            มุมมองรวมสำหรับแอดมิน — ถ้าจะดูอุปกรณ์แยกตามสถานี ไปที่หน้า{' '}
            <Box component="span" sx={{ color: 'primary.main', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => router.push('/stations')}>
              รายการสถานี
            </Box>
          </Typography>
        </Box>
        <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={() => { setEquipmentToEdit(null); setOpenDialog(true); }}>
          เพิ่มอุปกรณ์ใหม่
        </Button>
      </Box>

      {/* ─── Filter Bar ──────────────────────────────────────── */}
      <Paper sx={{ p: 2, mb: 2, mt: 2, borderRadius: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <FilterListIcon color="action" />

        <TextField
          placeholder="ค้นหาชื่อ / ประเภท / สถานี / S/N..."
          value={searchTerm}
          onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
          size="small"
          sx={{ minWidth: 260 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
        />

        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel sx={{ fontFamily: 'Prompt' }}>สถานี</InputLabel>
          <Select
            value={filterStaCode}
            label="สถานี"
            onChange={e => { setFilterStaCode(e.target.value); setPage(1); }}
            sx={{ fontFamily: 'Prompt' }}
          >
            <MenuItem value="" sx={{ fontFamily: 'Prompt' }}>ทั้งหมด</MenuItem>
            {stations.map(s => (
              <MenuItem key={s.sta_code} value={s.sta_code} sx={{ fontFamily: 'Prompt' }}>
                {s.sta_code} — {s.sta_name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel sx={{ fontFamily: 'Prompt' }}>สถานะ</InputLabel>
          <Select
            value={filterStatus}
            label="สถานะ"
            onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
            sx={{ fontFamily: 'Prompt' }}
          >
            {STATUS_OPTIONS.map(o => (
              <MenuItem key={o.value} value={o.value} sx={{ fontFamily: 'Prompt' }}>{o.label}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', ml: 'auto', alignItems: 'center' }}>
          {filterStaCode && (
            <Chip size="small" label={`สถานี: ${filterStaCode}`} onDelete={() => setFilterStaCode('')} />
          )}
          {filterStatus && (
            <Chip
              size="small"
              label={`สถานะ: ${STATUS_LABEL[filterStatus]}`}
              onDelete={() => setFilterStatus('')}
              color={STATUS_COLOR[filterStatus]}
            />
          )}
          {searchTerm && (
            <Chip size="small" label={`ค้นหา: "${searchTerm}"`} onDelete={() => setSearchTerm('')} />
          )}
          <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'Prompt' }}>
            {processedData.length} รายการ
          </Typography>
        </Box>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* ─── Table ───────────────────────────────────────────── */}
      <TableContainer component={Paper} sx={{ borderRadius: 2, overflowX: 'auto', boxShadow: 3 }}>
        <Table sx={{ minWidth: 900 }}>
          <TableHead>
            <TableRow sx={{ bgcolor: 'primary.main' }}>
              <TableCell sx={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>ประวัติ</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>จัดการ</TableCell>

              <SortCell field="sta_code"   label="สถานี" />
              <SortCell field="name"       label="ชื่ออุปกรณ์" />
              <SortCell field="type"       label="ประเภท" />
              <SortCell field="status"     label="สถานะ" align="center" />
              <SortCell field="updated_at" label="แก้ไขล่าสุด" />
              <SortCell field="created_at" label="วันที่เพิ่ม" />
            </TableRow>
          </TableHead>

          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 6, fontFamily: 'Prompt', color: 'text.secondary' }}>
                  ไม่พบรายการที่ตรงกับเงื่อนไข
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((row, idx) => (
                <TableRow
                  key={row.id}
                  hover
                  sx={{ bgcolor: idx % 2 === 0 ? 'action.hover' : 'inherit' }}
                >
                  <TableCell align="center">
                    <Tooltip title="ประวัติการบำรุงรักษา">
                      <IconButton color="info" size="small" onClick={() => router.push(`/equipment/maintenance?id=${row.id}`)}>
                        <HistoryIcon fontSize="medium" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>

                  <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                    <Tooltip title="แก้ไข">
                      <IconButton color="primary" size="small" onClick={() => { setEquipmentToEdit(row); setOpenDialog(true); }}>
                        <EditIcon fontSize="medium" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="ลบ">
                      <IconButton color="error" size="small" onClick={() => { setDeleteId(row.id!); setOpenDeleteConfirm(true); }}>
                        <DeleteIcon fontSize="medium" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>

                  <TableCell sx={{ fontFamily: 'Prompt' }}>
                    <Box
                      sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer', color: 'primary.main' }}
                      onClick={() => router.push(`/stations/${encodeURIComponent(row.sta_code)}`)}
                    >
                      <PlaceIcon fontSize="small" />
                      <Box>
                        <Typography component="span" sx={{ fontWeight: 600, fontFamily: 'Prompt', display: 'block', lineHeight: 1.2 }}>
                          {row.sta_code}
                        </Typography>
                        {staNameByCode[row.sta_code] && (
                          <Typography component="span" variant="caption" color="text.secondary" sx={{ fontFamily: 'Prompt' }}>
                            {staNameByCode[row.sta_code]}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </TableCell>

                  <TableCell sx={{ fontFamily: 'Prompt', fontWeight: 500 }}>
                    {row.name}
                    {row.serial_number && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontFamily: 'Prompt' }}>
                        S/N: {row.serial_number}
                      </Typography>
                    )}
                  </TableCell>

                  <TableCell sx={{ fontFamily: 'Prompt' }}>{TYPE_LABEL[row.type] ?? row.type}</TableCell>

                  <TableCell align="center">
                    <Chip
                      label={STATUS_LABEL[row.status] ?? row.status}
                      color={STATUS_COLOR[row.status] ?? 'default'}
                      size="small"
                      sx={{ fontFamily: 'Prompt', fontWeight: 'bold', minWidth: 90 }}
                    />
                  </TableCell>

                  <TableCell sx={{ fontFamily: 'Prompt', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                    {formatDate(row.updated_at)}
                  </TableCell>
                  <TableCell sx={{ fontFamily: 'Prompt', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                    {formatDate(row.created_at)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ─── Pagination ──────────────────────────────────────── */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, v) => setPage(v)}
            color="primary"
            showFirstButton
            showLastButton
          />
        </Box>
      )}

      {/* ─── Dialogs ─────────────────────────────────────────── */}
      <EquipmentDialog
        open={openDialog}
        onClose={() => { setOpenDialog(false); setEquipmentToEdit(null); }}
        onSuccess={() => { fetchEquipments(); setOpenDialog(false); setEquipmentToEdit(null); }}
        equipmentToEdit={equipmentToEdit}
        stationOptions={stations}
      />

      <Dialog open={openDeleteConfirm} onClose={() => setOpenDeleteConfirm(false)}>
        <DialogTitle>ยืนยันการลบ</DialogTitle>
        <DialogContent>
          <DialogContentText>คุณแน่ใจหรือไม่ที่จะลบอุปกรณ์นี้? การกระทำนี้ไม่สามารถย้อนกลับได้</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteConfirm(false)}>ยกเลิก</Button>
          <Button
            color="error"
            variant="contained"
            onClick={async () => {
              if (!deleteId) return;
              try {
                const res = await apiRequest(`${API_URL}/api/equipments/delete/${deleteId}`, {
                  method: 'POST', credentials: 'include',
                });
                if (!res.ok) throw new Error('ลบล้มเหลว');
                setEquipments(prev => prev.filter(e => e.id !== deleteId));
                setOpenDeleteConfirm(false);
                setDeleteId(null);
              } catch (e: any) {
                setError(e.message);
              }
            }}
          >
            ลบ
          </Button>
        </DialogActions>
      </Dialog>

    </Container>
  );
}