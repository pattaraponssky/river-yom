// app/stations/StationsListClient.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Container, Typography, Box, CircularProgress, Alert, TextField,
  InputAdornment, Grid, Card, CardMedia, CardContent, CardActionArea,
  Chip, Skeleton,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PlaceIcon from '@mui/icons-material/Place';
import SensorsIcon from '@mui/icons-material/Sensors';
import WaterIcon from '@mui/icons-material/Water';
import { useRouter } from 'next/navigation';
import { API_URL, Path_URL } from '@/lib/utility';
import { useAuth } from '@/contexts/AuthContext';
import AddIcon from '@mui/icons-material/Add';
import { Button } from '@mui/material';
import { href } from 'react-router-dom';

interface TeleStation {
  no: number;
  sta_code: string;
  sta_name: string;
  river: string | null;
  tambon: string | null;
  district: string | null;
  province: string | null;
  capacity: number | null;
  lat: number | null;
  long: number | null;
  equipment_count?: number;
}

export default function StationsListClient() {
  const router = useRouter();
  const { currentUser, loading: authLoading, hasPermission } = useAuth();

  const [stations, setStations] = useState<TeleStation[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (authLoading || !currentUser) return;
    const fetchStations = async () => {
      try {
        setLoadingData(true);
        setError(null);
        const res = await fetch(`${API_URL}/api/stations`, { credentials: 'include' });
        if (!res.ok) throw new Error('ดึงข้อมูลสถานีล้มเหลว');
        const json = await res.json();
        setStations(json.data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoadingData(false);
      }
    };
    fetchStations();
  }, [authLoading, currentUser]);

  const filtered = useMemo(() => {
    if (!searchTerm) return stations;
    const q = searchTerm.toLowerCase();
    return stations.filter(s =>
      [s.sta_code, s.sta_name, s.river, s.tambon, s.district, s.province]
        .some(v => (v ?? '').toLowerCase().includes(q))
    );
  }, [stations, searchTerm]);

  if (authLoading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>;
  }
  if (!currentUser || !hasPermission(1)) {
    return <Box sx={{ p: 4, textAlign: 'center' }}><Typography variant="h6" color="error">ไม่มีสิทธิ์เข้าถึงหน้านี้</Typography></Box>;
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header — ไม่มีปุ่มเพิ่ม/แก้ไขสถานี เพราะจัดการที่หน้าอื่นแล้ว */}
      <Box sx={{ mb: 3 }}>
            <Box sx={{display:"flex", flexDirection:"row",justifyContent:"space-between"}}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', fontFamily: 'Prompt' }}>
                    สถานีติดตั้งอุปกรณ์
                </Typography>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => router.push('/equipment')}
                        >
                        รายการอุปกรณ์ทั้งหมด
                    </Button>
            </Box>
        <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'Prompt' }}>
          ฝั่งขวาแม่น้ำยม อำเภอบางระกำ จังหวัดพิษณุโลก — {filtered.length} สถานี
        </Typography>
      </Box>
       
      <TextField
        placeholder="ค้นหาสถานี เช่น YR.01, บางระกำ, แม่น้ำยม..."
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        size="small"
        fullWidth
        sx={{ mb: 3, maxWidth: 420 }}
        InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
      />

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Grid container spacing={3}>
        {loadingData ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}>
              <Skeleton variant="rounded" height={260} />
            </Grid>
          ))
        ) : filtered.length === 0 ? (
          <Grid size={{ xs: 12 }}>
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography color="text.secondary">ไม่พบสถานีที่ตรงกับการค้นหา</Typography>
            </Box>
          </Grid>
        ) : (
          filtered.map(station => {
            const photo = `${Path_URL}/images/tele/${station.sta_code}.jpg`;
            return (
              <Grid key={station.sta_code} size={{ xs: 12, sm: 6, md: 4 }}>
                <Card sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: 3, height: '100%' }}>
                  <CardActionArea
                    onClick={() => router.push(`/stations/${encodeURIComponent(station.sta_code)}`)}
                    sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
                  >
                    {photo ? (
                      <CardMedia component="img" height="160" image={photo} alt={station.sta_name} sx={{ objectFit: 'cover' }} />
                    ) : (
                      <Box sx={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.100', color: 'grey.400' }}>
                        <WaterIcon sx={{ fontSize: 40 }} />
                      </Box>
                    )}

                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', fontFamily: 'Prompt', mb: 0.5 }}>
                        {station.sta_code}
                      </Typography>
                      <Typography variant="body2" sx={{ fontFamily: 'Prompt', mb: 1 }}>
                        {station.sta_name}
                      </Typography>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary', mb: 0.5 }}>
                        <PlaceIcon fontSize="small" />
                        <Typography variant="caption" sx={{ fontFamily: 'Prompt' }}>
                          {[station.river, station.tambon, station.district].filter(Boolean).join(' • ')}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                          <SensorsIcon fontSize="small" />
                          <Typography variant="caption" sx={{ fontFamily: 'Prompt' }}>
                            {station.equipment_count ?? 0} อุปกรณ์
                          </Typography>
                        </Box>
                        {station.capacity != null && (
                          <Chip size="small" label={`${station.capacity} ลบ.ม./วิ`} sx={{ fontFamily: 'Prompt' }} />
                        )}
                      </Box>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            );
          })
        )}
      </Grid>
    </Container>
  );
}