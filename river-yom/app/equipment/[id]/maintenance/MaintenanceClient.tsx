// app/equipment/[id]/maintenance/MaintenanceClient.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Container, Typography, Box, CircularProgress, Alert, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Button, InputAdornment,
  TextField, Dialog, DialogActions, DialogContent, DialogTitle, FormControl,
  Grid, InputLabel, MenuItem, Select, IconButton, Tooltip,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { API_URL } from '@/lib/utility';
import { useRouter } from 'next/navigation';   // ← เอา useParams ออก ไม่ต้องใช้แล้ว
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

// ✅ รับ id เป็น prop แทนการดึงจาก useParams()
export default function MaintenanceClient({ id }: { id: string }) {
  const router = useRouter();
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { currentUser, loading } = useAuth();

  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [newRecord, setNewRecord] = useState<Partial<MaintenanceRecord>>({
    equipment_id: id,
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
          headers: { 'Accept': 'application/json' },
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
      }
    };
    if (id) fetchMaintenance();
  }, [id]);

  const handleBack = () => router.back();

  const filteredRecords = useMemo(() => {
    if (!searchTerm) return records;
    const lowerSearch = searchTerm.toLowerCase();
    return records.filter(record =>
      Object.values(record).some(value => String(value).toLowerCase().includes(lowerSearch))
    );
  }, [records, searchTerm]);

  const handleOpenAdd = () => setOpenAddDialog(true);
  const handleCloseAdd = () => {
    setOpenAddDialog(false);
    setSubmitError(null);
    setNewRecord({
      equipment_id: id,
      maintenance_date: new Date().toISOString().split('T')[0],
      type: 'preventive',
      technician_name: '',
      cost: 0,
      description: '',
      next_due_date: '',
      status: 'completed',
    });
  };

  const handleSubmit = async () => {
    setSubmitLoading(true);
    setSubmitError(null);
    try {
      const res = await fetch(`${API_URL}/api/equipments/${id}/maintenance`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(newRecord),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || err.error || 'บันทึกข้อมูลล้มเหลว');
      }
      const json = await res.json();
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
    setNewRecord((prev) => ({ ...prev, [name]: name === 'cost' ? parseFloat(value) || 0 : value }));
  };

  const handleSelectChange = (e: any) => {
    const { name, value } = e.target;
    setNewRecord((prev) => ({ ...prev, [name]: value }));
  };

  const handleEdit = (record: MaintenanceRecord) => {
    setEditRecord(record);
    setOpenEditDialog(true);
  };

  const handleDeleteClick = (recordId: number) => {
    if (!confirm('ยืนยันการลบประวัติการบำรุงรักษานี้หรือไม่?')) return;
    deleteMaintenance(recordId);
  };

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
      setRecords((prev) => prev.map((r) => (r.id === editRecord.id ? json.data : r)));
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
      {/* ...JSX ทั้งหมดเหมือนเดิมทุกอย่าง ไม่ต้องแก้อะไรต่อจากนี้... */}
      {/* คัดลอกส่วน return ทั้งหมดจากไฟล์เดิมมาวางต่อจากตรงนี้ */}
    </Container>
  );
}