'use client';

import React, { useEffect, useState } from 'react';
import {
  TextField,
  Button,
  Container,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Grid,
} from '@mui/material';
import { API_URL } from '../../lib/utility';
import { titleStyle } from '../../theme/style';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';

interface User {
  username: string;
  email?: string;
  name?: string;
  password?: string;
}

const EditUser: React.FC = () => {  // ลบ token prop เพราะไม่ใช้แล้ว
  const { currentUser, loading: authLoading } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // ดึงข้อมูลผู้ใช้จาก currentUser (ที่ AuthContext จัดการให้แล้ว)
  useEffect(() => {
    if (authLoading) return; // รอ auth โหลดเสร็จ

    if (!currentUser) {
      setError('กรุณาเข้าสู่ระบบก่อน');
      setLoading(false);
      return;
    }

    // currentUser มาจาก backend หลัง login/checkAuth → ใช้เลย
    setUser({
      username: currentUser.username || '',
      name: currentUser.name || '',
      email: currentUser.email || '',
      password: '', // ไม่เคยมี password ใน context (ปลอดภัย)
    });

    setLoading(false);
  }, [currentUser, authLoading]);

  // อัปเดตค่าจากฟอร์ม
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUser((prev) => (prev ? { ...prev, [name]: value } : null));
  };

  // ดึง CSRF token จาก cookie (ถ้า backend ใช้ CSRF)
  function getCookie(name: string) {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? match[2] : null;
  }

  // ส่งคำขออัปเดตข้อมูล
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !currentUser?.username) return;

    setSaving(true);
    setError(null);
    setSuccess(false);

    const csrfToken = getCookie('csrf_cookie_name'); // ถ้า backend ใช้ CSRF

    // เตรียม payload (ไม่ส่ง Password ถ้าว่าง)
    const payload = { ...user };
    if (!payload.password?.trim()) {
      delete payload.password;
    }

    try {
      const res = await apiRequest(`${API_URL}/user/updateUser/${currentUser.username}`, {
        method: 'PUT',
        credentials: 'include', // ส่ง cookie ด้วย (สำคัญ!)
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'บันทึกไม่สำเร็จ');
      }

      setSuccess(true);

      // อัปเดต currentUser ใน context ด้วย (ถ้า backend ส่ง user ใหม่กลับมา)
      const updatedData = await res.json();
      // ถ้า context มี setCurrentUser ให้เรียก
      // setCurrentUser(updatedData.user || currentUser);
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!currentUser || !user) {
    return (
      <Typography textAlign="center" color="error" mt={4}>
        ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบอีกครั้ง
      </Typography>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 2, mb: 2 }}>
      <Typography sx={{ ...titleStyle, fontWeight: '600' }} mt={4} mb={2}>
        แก้ไขข้อมูลผู้ใช้
      </Typography>

      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="ชื่อผู้ใช้"
              name="Username"
              value={user.username || ''}
              onChange={handleChange}
              fullWidth
              margin="normal"
              disabled // ถ้าไม่อยากให้แก้ username ได้
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="อีเมล"
              name="email"
              value={user.email || ''}
              onChange={handleChange}
              fullWidth
              margin="normal"
              type="email"
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="ชื่อเต็ม"
              name="Name"
              value={user.name || ''}
              onChange={handleChange}
              fullWidth
              margin="normal"
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="รหัสผ่าน (เว้นว่างหากไม่เปลี่ยน)"
              name="Password"
              type="password"
              value={user.password || ''}
              onChange={handleChange}
              fullWidth
              margin="normal"
              helperText="เว้นว่างหากไม่ต้องการเปลี่ยนรหัสผ่าน"
            />
          </Grid>
        </Grid>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mt: 2 }}>
            บันทึกข้อมูลสำเร็จ
          </Alert>
        )}

        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={saving}
          fullWidth
          sx={{ ...titleStyle, mt: 3, py: 1.5, fontWeight: 'bold' }}
        >
          {saving ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
        </Button>
      </Box>
    </Container>
  );
};

export default EditUser;