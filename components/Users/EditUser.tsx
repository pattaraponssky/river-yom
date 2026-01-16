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


interface User {
  Username: string;
  email?: string;
  Name?: string;
  Password?: string;
}

interface EditUserProps {
  token: string;
}

const EditUser: React.FC<EditUserProps> = ({ token }) => {
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
  
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser.username) {
          setUsername(parsedUser.username);
        } else {
          setError('ไม่พบชื่อผู้ใช้ในข้อมูล Local Storage');
        }
      } catch (e) {
        setError('ไม่สามารถแปลงข้อมูลจาก Local Storage ได้');
      }
    } else {
      setError('ไม่พบข้อมูลผู้ใช้ใน Local Storage');
    }
  
    setLoading(false);
  }, []);
  
  useEffect(() => {
    const fetchUser = async () => {
      if (!username) return;
  
      // console.log(`Fetching user data for username: ${username}`);
  
      try {
        const res = await fetch(`${API_URL}/user/getUserByUsername/${username}`, {
          method: 'GET',
          credentials: 'include', 
          headers: {
            'Content-Type': 'application/json',
          },
        });
  
        if (!res.ok) {
          throw new Error('ไม่สามารถโหลดข้อมูลผู้ใช้');
        }
  
        const data = await res.json();
        setUser({ ...data, Password: '' });
      } catch (err) {
        setError('ไม่สามารถโหลดข้อมูลผู้ใช้');
      } finally {
        setLoading(false);
      }
    };
  
    fetchUser();
  }, [username, token]);
  

  // อัปเดตค่าจากฟอร์ม แปลง iduser_level กับ Status เป็น number
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
  
    setUser(prev => {
      if (!prev) return null;
      return { ...prev, [name]: value };
    });
  };

  function getCookie(name: string) {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    if (match) return match[2];
    return null;
  }
  
  // ส่งคำขออัปเดตข้อมูล
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !username) return;
    setSaving(true);
    setError(null);
    setSuccess(false);
    const csrfToken = getCookie('csrf_cookie_name');
    // เตรียมข้อมูลส่ง โดยตัด Password ถ้าว่าง
    const payload = { ...user };
    if (!payload.Password) {
      delete payload.Password;
    }

    try {
      fetch(`${API_URL}/user/updateUser/${username}`, {
        method: 'PUT',
        credentials: 'include',  // เพื่อให้ส่ง cookie ด้วย
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': csrfToken || '',
        },
        body: JSON.stringify(payload),
      })
      setSuccess(true);
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <CircularProgress />;
  if (!loading && !user) return <Typography textAlign="center">ไม่พบข้อมูลผู้ใช้</Typography>;
  

  return (
    <Container maxWidth="md" sx={{ mt: 2, mb: 2 }}>
      <Typography sx={{ ...titleStyle, fontWeight: "600" }} mt={4} mb={2}>
        แก้ไขข้อมูลผู้ใช้
      </Typography>
  
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="ชื่อผู้ใช้"
              name="Username"
              value={user?.Username || ''}
              onChange={handleChange}
              fullWidth
              margin="normal"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="อีเมล"
              name="email"
              value={user?.email || ''}
              onChange={handleChange}
              fullWidth
              margin="normal"
            />
          </Grid>
  
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="ชื่อเต็ม"
              name="Name"
              value={user?.Name || ''}
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
              value={user?.Password || ''}
              onChange={handleChange}
              fullWidth
              margin="normal"
            />
          </Grid>
        </Grid>
  
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mt: 2 }}>บันทึกสำเร็จ</Alert>}
  
        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={saving}
          fullWidth
          sx={{ ...titleStyle, mt: 2, py: 1.5, fontWeight: 'bold' }}
        >
          {saving ? 'กำลังบันทึก...' : 'บันทึก'}
        </Button>
      </Box>
    </Container>
  );
}
export default EditUser;
