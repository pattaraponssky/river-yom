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
import { API_URL } from '@/lib/utility';
import { titleStyle } from '@/theme/style';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import EquipmentDialog from '@/components/Equipment/EquipmentDialog';
import { apiRequest } from '@/lib/api';

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

type SortField = 'id' | 'name' | 'type' | 'location' | 'status' | 'updated_at' | 'created_at';
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

export default function EquipmentPage() {
  const router = useRouter();
  const { currentUser, loading: authLoading, hasPermission } = useAuth();

  const [equipments, setEquipments]         = useState<Equipment[]>([]);
  const [error, setError]                   = useState<string | null>(null);
  const [searchTerm, setSearchTerm]         = useState('');
  const [page, setPage]                     = useState(1);
  const [sortField, setSortField]           = useState<SortField>('updated_at');
  const [sortOrder, setSortOrder]           = useState<SortOrder>('desc');
  const [filterStatus, setFilterStatus]     = useState('');
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
      setEquipments(json.data || []);
    } catch (err: any) {
      setError(err.message);
    }
  };

  useEffect(() => {
    if (!authLoading && currentUser && hasPermission(1)) fetchEquipments();
  }, [authLoading, currentUser]);

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

    // 1. filter by search
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      data = data.filter(row =>
        [row.name, row.type, row.location, row.status, String(row.id)]
          .some(v => (v ?? '').toLowerCase().includes(q))
      );
    }

    // 2. filter by status
    if (filterStatus) {
      data = data.filter(row => row.status === filterStatus);
    }

    // 3. sort
    data.sort((a, b) => {
      const aVal = a[sortField] ?? '';
      const bVal = b[sortField] ?? '';

      // numeric id
      if (sortField === 'id') {
        return sortOrder === 'asc'
          ? Number(a.id) - Number(b.id)
          : Number(b.id) - Number(a.id);
      }

      // date fields
      if (sortField === 'updated_at' || sortField === 'created_at') {
        const aTime = new Date(aVal).getTime();
        const bTime = new Date(bVal).getTime();
        return sortOrder === 'asc' ? aTime - bTime : bTime - aTime;
      }

      // string fields
      const cmp = String(aVal).localeCompare(String(bVal), 'th');
      return sortOrder === 'asc' ? cmp : -cmp;
    });

    return data;
  }, [equipments, searchTerm, filterStatus, sortField, sortOrder]);

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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" sx={{ ...titleStyle, fontWeight: 'bold' }}>
          รายการอุปกรณ์
        </Typography>
        <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={() => { setEquipmentToEdit(null); setOpenDialog(true); }}>
          เพิ่มอุปกรณ์ใหม่
        </Button>
      </Box>

      {/* ─── Filter Bar ──────────────────────────────────────── */}
      <Paper sx={{ p: 2, mb: 2, borderRadius: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <FilterListIcon color="action" />

        <TextField
          placeholder="ค้นหาชื่อ / ประเภท / สถานที่..."
          value={searchTerm}
          onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
          size="small"
          sx={{ minWidth: 260 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
        />

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

        {/* active filters badge */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', ml: 'auto', alignItems: 'center' }}>
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
        <Table sx={{ minWidth: 800 }}>
          <TableHead>
            <TableRow sx={{ bgcolor: 'primary.main' }}>
              {/* คอลัมน์ที่ไม่ sort */}
              <TableCell sx={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>ประวัติ</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>จัดการ</TableCell>

              {/* คอลัมน์ที่ sort ได้ */}
              <SortCell field="id"         label="ID" />
              <SortCell field="name"       label="ชื่ออุปกรณ์" />
              <SortCell field="type"       label="ประเภท" />
              <SortCell field="location"   label="สถานที่" />
              <SortCell field="status"     label="สถานะ" align="center" />
              <SortCell field="updated_at" label="แก้ไขล่าสุด" />
              <SortCell field="created_at" label="วันที่เพิ่ม" />
            </TableRow>
          </TableHead>

          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 6, fontFamily: 'Prompt', color: 'text.secondary' }}>
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
                      <IconButton color="info" size="small" onClick={() => router.push(`/equipment/${row.id}/maintenance`)}>
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

                  <TableCell sx={{ fontFamily: 'Prompt' }}>{row.id}</TableCell>
                  <TableCell sx={{ fontFamily: 'Prompt', fontWeight: 500 }}>{row.name}</TableCell>
                  <TableCell sx={{ fontFamily: 'Prompt' }}>{row.type}</TableCell>
                  <TableCell sx={{ fontFamily: 'Prompt' }}>{row.location || '-'}</TableCell>

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