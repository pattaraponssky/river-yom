// components/Data/CameraViewer.tsx
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box, Typography, IconButton, Tooltip, Chip,
  CircularProgress, Alert, Grid, Card, CardContent,
  CardHeader, Dialog, DialogContent, DialogTitle,
  ToggleButton, ToggleButtonGroup,
} from '@mui/material';
import RefreshIcon       from '@mui/icons-material/Refresh';
import FullscreenIcon    from '@mui/icons-material/Fullscreen';
import VideocamIcon      from '@mui/icons-material/Videocam';
import VideocamOffIcon   from '@mui/icons-material/VideocamOff';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import CloseIcon         from '@mui/icons-material/Close';
import { CameraConfig }  from '@/lib/cameraConfig';
import HlsCamera from './HlsCamera';

// ─── Snapshot Camera (refresh ทุก N วินาที) ─────────────────────
const SnapshotCamera: React.FC<{
  config: CameraConfig;
  refreshInterval?: number; // วินาที
}> = ({ config, refreshInterval = 30 }) => {
  const [src, setSrc]         = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const refresh = useCallback(() => {
    setLoading(true);
    setError(false);
    // เพิ่ม timestamp เพื่อบังคับ reload
    setSrc(`${config.snapshotUrl}?t=${Date.now()}`);
  }, [config.snapshotUrl]);

  useEffect(() => {
    refresh();
    intervalRef.current = setInterval(refresh, refreshInterval * 1000);
    return () => clearInterval(intervalRef.current);
  }, [refresh, refreshInterval]);

  return (
    <Box sx={{ position: 'relative', width: '100%', bgcolor: '#000', borderRadius: 1, overflow: 'hidden' }}>
      {loading && (
        <Box sx={{
          position: 'absolute', inset: 0, display: 'flex',
          alignItems: 'center', justifyContent: 'center', bgcolor: '#111', zIndex: 1,
        }}>
          <CircularProgress size={28} sx={{ color: 'white' }} />
        </Box>
      )}

      {error ? (
        <Box sx={{
          height: 200, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', bgcolor: '#1a1a1a',
        }}>
          <VideocamOffIcon sx={{ fontSize: 48, color: 'grey.600', mb: 1 }} />
          <Typography sx={{ color: 'grey.500', fontFamily: 'Prompt', fontSize: '0.85rem' }}>
            ไม่สามารถเชื่อมต่อกล้องได้
          </Typography>
          <IconButton onClick={refresh} sx={{ color: 'grey.400', mt: 1 }} size="small">
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Box>
      ) : (
        <img
          src={src}
          alt={config.label}
          style={{ width: '100%', height: 'auto', display: loading ? 'none' : 'block' }}
          onLoad={() => { setLoading(false); setLastUpdate(new Date()); }}
          onError={() => { setLoading(false); setError(true); }}
        />
      )}

      {/* Timestamp overlay */}
      {lastUpdate && !error && (
        <Box sx={{
          position: 'absolute', bottom: 6, right: 8,
          bgcolor: 'rgba(0,0,0,0.6)', px: 1, py: 0.25, borderRadius: 1,
        }}>
          <Typography sx={{ color: 'white', fontSize: '0.7rem', fontFamily: 'Prompt' }}>
            {lastUpdate.toLocaleTimeString('th-TH')}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

// ─── MJPEG Stream ────────────────────────────────────────────────
const MjpegCamera: React.FC<{ config: CameraConfig }> = ({ config }) => {
  const [error, setError]     = useState(false);
  const [loading, setLoading] = useState(true);

  return (
    <Box sx={{ position: 'relative', width: '100%', bgcolor: '#000', borderRadius: 1, overflow: 'hidden' }}>
      {loading && (
        <Box sx={{
          position: 'absolute', inset: 0, display: 'flex',
          alignItems: 'center', justifyContent: 'center', bgcolor: '#111', zIndex: 1,
        }}>
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress size={28} sx={{ color: 'white' }} />
            <Typography sx={{ color: 'grey.400', fontSize: '0.75rem', mt: 1, fontFamily: 'Prompt' }}>
              กำลังเชื่อมต่อ...
            </Typography>
          </Box>
        </Box>
      )}

      {error ? (
        <Box sx={{
          height: 200, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', bgcolor: '#1a1a1a',
        }}>
          <VideocamOffIcon sx={{ fontSize: 48, color: 'grey.600', mb: 1 }} />
          <Typography sx={{ color: 'grey.500', fontFamily: 'Prompt', fontSize: '0.85rem' }}>
            ไม่สามารถโหลด stream ได้
          </Typography>
        </Box>
      ) : (
        <img
          src={`${config.streamUrl}?t=${Date.now()}`}
          alt={config.label}
          style={{ width: '100%', height: 'auto', display: loading ? 'none' : 'block' }}
          onLoad={() => setLoading(false)}
          onError={() => { setLoading(false); setError(true); }}
        />
      )}
    </Box>
  );
};

// ─── Embed Camera (iframe) ───────────────────────────────────────
const EmbedCamera: React.FC<{ config: CameraConfig }> = ({ config }) => (
  <Box sx={{ width: '100%', aspectRatio: '16/9', bgcolor: '#000', borderRadius: 1, overflow: 'hidden' }}>
    <iframe
      src={config.streamUrl}
      style={{ width: '100%', height: '100%', border: 'none' }}
      allow="camera; microphone; fullscreen"
      title={config.label}
    />
  </Box>
);

// ─── Main CameraViewer ───────────────────────────────────────────
interface CameraViewerProps {
  cameras: CameraConfig[];
  staCode: string;
}

const CameraViewer: React.FC<CameraViewerProps> = ({ cameras, staCode }) => {
  const [activeCam, setActiveCam]     = useState(cameras[0]?.id ?? '');
  const [fullscreen, setFullscreen]   = useState(false);
  const [refreshKey, setRefreshKey]   = useState(0);

  const currentCam = cameras.find(c => c.id === activeCam) ?? cameras[0];

  const renderCamera = (cam: CameraConfig) => {
    switch (cam.type) {
      case 'snapshot': return <SnapshotCamera key={refreshKey} config={cam} refreshInterval={30} />;
      case 'mjpeg':    return <MjpegCamera    key={refreshKey} config={cam} />;
      case 'embed':    return <EmbedCamera    key={refreshKey} config={cam} />;
      case 'hls':      return <HlsCamera      key={refreshKey} config={cam} />;
      default:         return null;
    }
  };

  return (
    <Card sx={{ mt: 0, borderRadius: 2, overflow: 'hidden' }}>
      <CardHeader
        sx={{ bgcolor: '#1a237e', py: 1.5, px: 2 }}
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <VideocamIcon sx={{ color: 'white', fontSize: '1.2rem' }} />
            <Typography sx={{ color: 'white', fontFamily: 'Prompt', fontWeight: 600, fontSize: '1rem' }}>
              กล้องวงจรปิด
            </Typography>
            {/* Live indicator */}
            <Chip
              icon={<FiberManualRecordIcon sx={{ fontSize: '0.7rem !important', color: '#ff1744 !important' }} />}
              label="LIVE"
              size="small"
              sx={{
                bgcolor: 'rgba(255,23,68,0.2)', color: '#ff6090',
                border: '1px solid #ff1744', fontWeight: 'bold',
                fontSize: '0.7rem', height: 22,
              }}
            />
          </Box>
        }
        action={
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title="รีเฟรช">
              <IconButton size="small" onClick={() => setRefreshKey(k => k + 1)} sx={{ color: 'white' }}>
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="เต็มจอ">
              <IconButton size="small" onClick={() => setFullscreen(true)} sx={{ color: 'white' }}>
                <FullscreenIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        }
      />

      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        {/* Camera selector (ถ้ามีหลายกล้อง) */}
        {cameras.length > 1 && (
          <ToggleButtonGroup
            value={activeCam}
            exclusive
            onChange={(_, v) => v && setActiveCam(v)}
            size="small"
            sx={{ mb: 1.5, flexWrap: 'wrap', gap: 0.5 }}
          >
            {cameras.map(cam => (
              <ToggleButton
                key={cam.id}
                value={cam.id}
                sx={{ fontFamily: 'Prompt', fontSize: '0.78rem', px: 1.5, py: 0.5 }}
              >
                {cam.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        )}

        {/* Camera feed */}
        {currentCam && renderCamera(currentCam)}

        {/* Camera label */}
        <Typography sx={{
          mt: 0.75, fontFamily: 'Prompt', fontSize: '0.8rem',
          color: 'text.secondary', textAlign: 'center',
        }}>
          {currentCam?.label}
          {currentCam?.type === 'snapshot' && ' • รีเฟรชทุก 30 วินาที'}
        </Typography>
      </CardContent>

      {/* Fullscreen Dialog */}
      <Dialog
        open={fullscreen}
        onClose={() => setFullscreen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: { bgcolor: '#000' } }}
      >
        <DialogTitle sx={{ bgcolor: '#111', color: 'white', display: 'flex', justifyContent: 'space-between', py: 1 }}>
          <Typography sx={{ fontFamily: 'Prompt', color: 'white' }}>
            {currentCam?.label}
          </Typography>
          <IconButton onClick={() => setFullscreen(false)} sx={{ color: 'white' }} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0, bgcolor: '#000' }}>
          {currentCam && renderCamera(currentCam)}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default CameraViewer;