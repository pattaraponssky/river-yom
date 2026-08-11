'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  TextField,
  Button,
  Container,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Grid,
  InputAdornment,
  IconButton,
  Paper,
  Avatar,
  Divider,
  Chip,
  useTheme,
  alpha,
  LinearProgress,
  Fade,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import BadgeIcon from '@mui/icons-material/Badge';
import LockIcon from '@mui/icons-material/Lock';
import SecurityIcon from '@mui/icons-material/Security';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SaveIcon from '@mui/icons-material/Save';
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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getPasswordStrength(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: '', color: 'transparent' };
  let score = 0;
  if (pw.length >= 8) score += 25;
  if (pw.length >= 12) score += 15;
  if (/[A-Z]/.test(pw)) score += 20;
  if (/[0-9]/.test(pw)) score += 20;
  if (/[^A-Za-z0-9]/.test(pw)) score += 20;

  if (score < 40) return { score, label: 'รหัสผ่านอ่อน', color: '#f44336' };
  if (score < 75) return { score, label: 'รหัสผ่านปานกลาง', color: '#ff9800' };
  return { score: Math.min(score, 100), label: 'รหัสผ่านแข็งแรง', color: '#4caf50' };
}

const EditUser: React.FC = () => {
  const theme = useTheme();
  const primary = theme.palette.primary.main;
  const { currentUser, setCurrentUser, loading: authLoading } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!currentUser) {
      setError('กรุณาเข้าสู่ระบบก่อน');
      setLoading(false);
      return;
    }

    setUser({
      username: currentUser.username || '',
      name: currentUser.name || '',
      email: currentUser.email || '',
      password: '',
    });

    setLoading(false);
  }, [currentUser, authLoading]);

  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(false), 3500);
    return () => clearTimeout(t);
  }, [success]);

  const passwordStrength = useMemo(
    () => getPasswordStrength(user?.password || ''),
    [user?.password]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUser((prev) => (prev ? { ...prev, [name]: value } : null));
    setIsDirty(true);
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  function getCookie(name: string) {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? match[2] : null;
  }

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (user?.email && !EMAIL_RE.test(user.email)) {
      errs.email = 'รูปแบบอีเมลไม่ถูกต้อง';
    }

    if (user?.password) {
      if (user.password.length < 8) {
        errs.password = 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร';
      }
      if (user.password !== confirmPassword) {
        errs.confirmPassword = 'รหัสผ่านไม่ตรงกัน';
      }
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !currentUser?.username) return;

    setError(null);
    setSuccess(false);

    if (!validate()) return;

    setSaving(true);

    const csrfToken = getCookie('csrf_cookie_name');

    const payload: User = { ...user };
    if (!payload.password?.trim()) {
      delete payload.password;
    }

    try {
      const res = await apiRequest(`${API_URL}/user/updateUser/${currentUser.username}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'บันทึกไม่สำเร็จ');
      }

      const updatedData = await res.json();
      const mappedUser = {
        username: updatedData.user.Username,
        name: updatedData.user.Name,
        email: updatedData.user.email,
        iduser_level: Number(updatedData.user.iduser_level),
        uid: updatedData.user.User_ID,
      };
      setCurrentUser(mappedUser);

      setUser((prev) => (prev ? { ...prev, password: '' } : null));
      setConfirmPassword('');
      setIsDirty(false);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 10 }}>
        <CircularProgress />
        <Typography sx={{ fontFamily: 'Prompt', color: 'text.secondary', fontSize: '0.9rem' }}>
          กำลังโหลดข้อมูล...
        </Typography>
      </Box>
    );
  }

  if (!currentUser || !user) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Paper
          elevation={0}
          sx={{
            p: 4,
            textAlign: 'center',
            borderRadius: 3,
            border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
            background: alpha(theme.palette.error.main, 0.04),
          }}
        >
          <Typography sx={{ fontFamily: 'Prompt', fontWeight: 600 }} color="error">
            ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบอีกครั้ง
          </Typography>
        </Paper>
      </Container>
    );
  }

  const initial = (user.name || user.username || '?').charAt(0).toUpperCase();

  return (
    <Container maxWidth="md" sx={{ mt: 3, mb: 6 }}>
      {/* ── Header พร้อม Avatar ── */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, sm: 4 },
          mb: 3,
          borderRadius: 4,
          background: `linear-gradient(135deg, ${primary} 0%, ${theme.palette.secondary.main} 100%)`,
          display: 'flex',
          alignItems: 'center',
          gap: 3,
          boxShadow: `0 8px 24px ${alpha(primary, 0.3)}`,
        }}
      >
        <Avatar
          sx={{
            width: 72,
            height: 72,
            fontSize: '1.8rem',
            fontWeight: 700,
            fontFamily: 'Prompt',
            bgcolor: 'rgba(255,255,255,0.2)',
            border: '2px solid rgba(255,255,255,0.4)',
            color: '#fff',
          }}
        >
          {initial}
        </Avatar>
        <Box>
          <Typography sx={{ fontFamily: 'Prompt', fontWeight: 700, fontSize: '1.3rem', color: '#fff' }}>
            {user.name || user.username}
          </Typography>
          <Typography sx={{ fontFamily: 'Prompt', color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>
            @{user.username}
          </Typography>
        </Box>
      </Paper>

      <Box component="form" onSubmit={handleSubmit} noValidate>
        {/* ── ส่วนข้อมูลบัญชี ── */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, sm: 3.5 },
            mb: 3,
            borderRadius: 3,
            border: `1px solid ${alpha(primary, 0.12)}`,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
            <BadgeIcon sx={{ color: primary, fontSize: 20 }} />
            <Typography sx={{ fontFamily: 'Prompt', fontWeight: 600, fontSize: '1rem' }}>
              ข้อมูลบัญชี
            </Typography>
          </Box>
          <Divider sx={{ mb: 2.5, opacity: 0.4 }} />

          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="ชื่อผู้ใช้"
                name="username"
                value={user.username || ''}
                fullWidth
                disabled
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon sx={{ fontSize: 20, color: 'text.disabled' }} />
                      </InputAdornment>
                    ),
                  },
                }}
                helperText="ไม่สามารถเปลี่ยนชื่อผู้ใช้ได้"
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="อีเมล"
                name="email"
                value={user.email || ''}
                onChange={handleChange}
                fullWidth
                type="email"
                error={Boolean(fieldErrors.email)}
                helperText={fieldErrors.email || ' '}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon sx={{ fontSize: 20, color: primary }} />
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Grid>

            <Grid size={12}>
              <TextField
                label="ชื่อเต็ม"
                name="name"
                value={user.name || ''}
                onChange={handleChange}
                fullWidth
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <BadgeIcon sx={{ fontSize: 20, color: primary }} />
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Grid>
          </Grid>
        </Paper>

        {/* ── ส่วนความปลอดภัย ── */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, sm: 3.5 },
            mb: 3,
            borderRadius: 3,
            border: `1px solid ${alpha(primary, 0.12)}`,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
            <SecurityIcon sx={{ color: primary, fontSize: 20 }} />
            <Typography sx={{ fontFamily: 'Prompt', fontWeight: 600, fontSize: '1rem' }}>
              เปลี่ยนรหัสผ่าน
            </Typography>
            <Chip
              label="ไม่บังคับ"
              size="small"
              sx={{ fontFamily: 'Prompt', fontSize: '0.7rem', height: 22 }}
            />
          </Box>
          <Divider sx={{ mb: 2.5, opacity: 0.4 }} />

          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="รหัสผ่านใหม่"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={user.password || ''}
                onChange={handleChange}
                fullWidth
                error={Boolean(fieldErrors.password)}
                helperText={fieldErrors.password || 'เว้นว่างหากไม่ต้องการเปลี่ยน'}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon sx={{ fontSize: 20, color: primary }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword((v) => !v)}
                          edge="end"
                          size="small"
                          aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                        >
                          {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />

              <Fade in={Boolean(user.password)}>
                <Box sx={{ mt: 0.5, minHeight: 20 }}>
                  {user.password && (
                    <>
                      <LinearProgress
                        variant="determinate"
                        value={passwordStrength.score}
                        sx={{
                          height: 4,
                          borderRadius: 2,
                          bgcolor: alpha(theme.palette.text.disabled, 0.15),
                          '& .MuiLinearProgress-bar': {
                            bgcolor: passwordStrength.color,
                            borderRadius: 2,
                          },
                        }}
                      />
                      <Typography
                        sx={{
                          fontFamily: 'Prompt',
                          fontSize: '0.72rem',
                          color: passwordStrength.color,
                          mt: 0.5,
                        }}
                      >
                        {passwordStrength.label}
                      </Typography>
                    </>
                  )}
                </Box>
              </Fade>
            </Grid>

            {user.password && (
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="ยืนยันรหัสผ่านใหม่"
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setIsDirty(true);
                    if (fieldErrors.confirmPassword) {
                      setFieldErrors((prev) => {
                        const next = { ...prev };
                        delete next.confirmPassword;
                        return next;
                      });
                    }
                  }}
                  fullWidth
                  error={Boolean(fieldErrors.confirmPassword)}
                  helperText={
                    fieldErrors.confirmPassword ||
                    (confirmPassword && confirmPassword === user.password ? '✓ ตรงกัน' : ' ')
                  }
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon sx={{ fontSize: 20, color: primary }} />
                        </InputAdornment>
                      ),
                      endAdornment: confirmPassword && confirmPassword === user.password && (
                        <InputAdornment position="end">
                          <CheckCircleIcon sx={{ fontSize: 18, color: 'success.main' }} />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Grid>
            )}
          </Grid>
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2, fontFamily: 'Prompt' }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert
            severity="success"
            icon={<CheckCircleIcon fontSize="inherit" />}
            sx={{ mb: 2, borderRadius: 2, fontFamily: 'Prompt' }}
          >
            บันทึกข้อมูลสำเร็จ
          </Alert>
        )}

        {/* ── ปุ่มบันทึก sticky ด้านล่าง ── */}
        <Box
          sx={{
            position: 'sticky',
            bottom: 16,
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 1.5,
            mt: 2,
          }}
        >
          <Button
            type="submit"
            variant="contained"
            disabled={saving || !isDirty}
            startIcon={saving ? undefined : <SaveIcon />}
            sx={{
              fontFamily: 'Prompt',
              fontWeight: 600,
              borderRadius: '999px',
              px: 4,
              py: 1.2,
              textTransform: 'none',
              background: `linear-gradient(90deg, ${primary}, ${theme.palette.secondary.main})`,
              boxShadow: `0 6px 18px ${alpha(primary, 0.4)}`,
              '&:hover': {
                boxShadow: `0 8px 22px ${alpha(primary, 0.5)}`,
              },
              '&.Mui-disabled': {
                background: alpha(theme.palette.text.disabled, 0.2),
              },
            }}
          >
            {saving ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : 'บันทึกการเปลี่ยนแปลง'}
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default EditUser;