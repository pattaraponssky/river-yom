'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import mpegts from 'mpegts.js';
import { Box, CircularProgress, Typography, IconButton } from '@mui/material';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import RefreshIcon from '@mui/icons-material/Refresh';
import { CameraConfig } from '@/lib/cameraConfig';

const FATAL_ERRORS = new Set(['NetworkError', 'MediaError']);

const WssCamera = ({ config }: { config: CameraConfig }) => {
  const videoRef  = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<mpegts.Player | null>(null);
  const timerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const errorRef  = useRef(0);
  const statusRef = useRef<'connecting' | 'playing' | 'error'>('connecting');

  const [status, setStatus]     = useState<'connecting' | 'playing' | 'error'>('connecting');
  const [errorMsg, setErrorMsg] = useState('ไม่สามารถเชื่อมต่อกล้องได้');
  const [debugInfo, setDebugInfo] = useState('');  // debug เท่านั้น ลบทีหลัง

  const setStatusBoth = useCallback((s: 'connecting' | 'playing' | 'error') => {
    statusRef.current = s;
    setStatus(s);
  }, []);

  const destroy = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    if (playerRef.current) {
      try { playerRef.current.destroy(); } catch (_) {}
      playerRef.current = null;
    }
  }, []);

  const init = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    destroy();
    errorRef.current = 0;
    setStatusBoth('connecting');
    setErrorMsg('ไม่สามารถเชื่อมต่อกล้องได้');
    setDebugInfo('');

    if (!mpegts.getFeatureList().mseLivePlayback) {
      setErrorMsg('Browser ไม่รองรับ MSE (ลอง Chrome/Edge)');
      setStatusBoth('error');
      return;
    }

    // ตรวจ mixed content: ws:// บน https:// จะถูก block
    const isMixedContent =
      typeof window !== 'undefined' &&
      window.location.protocol === 'https:' &&
      config.streamUrl.startsWith('ws://');

    if (isMixedContent) {
      setErrorMsg('Mixed Content: เว็บใช้ HTTPS แต่ stream เป็น ws:// (ไม่ใช่ wss://)\nต้องเปิดเว็บด้วย http:// หรือให้ server รองรับ wss://');
      setStatusBoth('error');
      return;
    }

    const player = mpegts.createPlayer(
      {
        type: 'm2ts',
        isLive: true,
        url: config.streamUrl,
        hasVideo: true,
        hasAudio: false,
      },
      {
        liveBufferLatencyChasing: true,
        liveSync: true,
        enableStashBuffer: true,
        stashInitialSize: 128 * 1024,
        liveBufferLatencyMaxLatency: 3.0,
        liveBufferLatencyMinRemain: 0.5,
        autoCleanupSourceBuffer: true,
        autoCleanupMaxBackwardDuration: 30,
        autoCleanupMinBackwardDuration: 10,
      }
    );

    // ── video events ──────────────────────────────────────────────
    const onPlaying = () => {
      if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
      errorRef.current = 0;
      setDebugInfo('');
      setStatusBoth('playing');
    };
    const onWaiting  = () => { if (statusRef.current !== 'error') setStatusBoth('connecting'); };
    const onCanPlay  = () => {
      setDebugInfo(d => d + ' | canplay');
      video.play().catch((e) => setDebugInfo(d => d + ` | play() rejected: ${e.message}`));
    };
    const onStalled  = () => setDebugInfo(d => d + ' | stalled');
    const onSuspend  = () => setDebugInfo(d => d + ' | suspend');

    video.addEventListener('playing',  onPlaying);
    video.addEventListener('waiting',  onWaiting);
    video.addEventListener('canplay',  onCanPlay);
    video.addEventListener('stalled',  onStalled);
    video.addEventListener('suspend',  onSuspend);

    // ── mpegts events ─────────────────────────────────────────────
    player.on(mpegts.Events.MEDIA_INFO, (info: unknown) => {
      const i = info as Record<string, unknown>;
      setDebugInfo(`codec: ${i.videoCodec ?? 'unknown'} | mimeType: ${i.mimeType ?? '-'}`);
      video.play().catch(() => {});
    });

    player.on(mpegts.Events.STATISTICS_INFO, () => {
      if (statusRef.current === 'connecting') {
        // stream มาแล้ว reset timeout
        if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
        timerRef.current = setTimeout(() => {
          if (statusRef.current !== 'playing') {
            setErrorMsg('ได้รับ stream แล้วแต่ video ไม่เล่น\n(codec ไม่รองรับ หรือ autoplay ถูก block)');
            setStatusBoth('error');
            destroy();
          }
        }, 15_000);
      }
    });

    player.on(mpegts.Events.ERROR, (errType: string) => {
      errorRef.current += 1;
      if (FATAL_ERRORS.has(errType) || errorRef.current >= 2) {
        setErrorMsg(errType === 'NetworkError'
          ? 'เชื่อมต่อ server ไม่ได้ — ตรวจสอบ URL หรือ network'
          : `Stream error: ${errType}`);
        setStatusBoth('error');
        setTimeout(() => destroy(), 0);
      }
    });

    player.attachMediaElement(video);
    player.load();
    video.play().catch((e) => {
      setDebugInfo(`initial play() rejected: ${e.message}`);
    });
    playerRef.current = player;

    timerRef.current = setTimeout(() => {
      if (statusRef.current !== 'playing') {
        setErrorMsg('หมดเวลา — ไม่ได้รับ stream เลย (timeout 10s)');
        setStatusBoth('error');
        destroy();
      }
    }, 10_000);

    return () => {
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('canplay', onCanPlay);
      video.removeEventListener('stalled', onStalled);
      video.removeEventListener('suspend', onSuspend);
    };
  }, [config.streamUrl, destroy, setStatusBoth]);

  useEffect(() => {
    const cleanup = init();
    return () => { cleanup?.(); destroy(); };
  }, [init, destroy]);

  return (
    <Box sx={{
      position: 'relative', width: '100%', aspectRatio: '16/9',
      bgcolor: '#000', borderRadius: 1, overflow: 'hidden',
    }}>

      {status === 'connecting' && (
        <Box sx={{
          position: 'absolute', inset: 0, zIndex: 10,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          bgcolor: 'rgba(0,0,0,0.85)',
        }}>
          <CircularProgress size={32} sx={{ color: 'white' }} />
          <Typography sx={{ color: 'grey.400', fontSize: '0.78rem', mt: 1.5, fontFamily: 'Prompt' }}>
            กำลังเชื่อมต่อ...
          </Typography>
          {/* debug info — ลบออกเมื่อ production */}
          {debugInfo && (
            <Typography sx={{ color: '#facc15', fontSize: '0.65rem', mt: 1, fontFamily: 'monospace', px: 2, textAlign: 'center' }}>
              {debugInfo}
            </Typography>
          )}
          <Typography sx={{ color: 'grey.700', fontSize: '0.62rem', mt: 0.5, fontFamily: 'monospace' }}>
            {config.streamUrl}
          </Typography>
        </Box>
      )}

      {status === 'error' && (
        <Box sx={{
          position: 'absolute', inset: 0, zIndex: 10,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          bgcolor: '#1a1a1a', px: 2,
        }}>
          <VideocamOffIcon sx={{ fontSize: 48, color: 'grey.600' }} />
          <Typography sx={{
            color: 'grey.400', fontSize: '0.82rem', mt: 1,
            fontFamily: 'Prompt', textAlign: 'center', whiteSpace: 'pre-line',
          }}>
            {errorMsg}
          </Typography>
          <Typography sx={{ color: 'grey.700', fontSize: '0.62rem', mt: 0.5, fontFamily: 'monospace' }}>
            {config.streamUrl}
          </Typography>
          <IconButton onClick={init} sx={{ color: 'grey.400', mt: 1 }} size="small">
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Box>
      )}

      <video
        ref={videoRef}
        muted
        autoPlay
        playsInline
        style={{
          width: '100%', height: '100%',
          background: '#000',
          display: status === 'error' ? 'none' : 'block',
        }}
      />

      {status === 'playing' && (
        <Box sx={{
          position: 'absolute', top: 8, left: 8,
          bgcolor: 'rgba(0,0,0,0.55)', px: 1, py: 0.25, borderRadius: 1,
          display: 'flex', alignItems: 'center', gap: 0.5,
        }}>
          <Box sx={{
            width: 7, height: 7, borderRadius: '50%', bgcolor: '#4ade80',
            animation: 'wssPulse 1.5s ease-in-out infinite',
            '@keyframes wssPulse': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.3 } },
          }} />
          <Typography sx={{ color: '#4ade80', fontSize: '0.68rem', fontWeight: 700, letterSpacing: 1 }}>
            LIVE
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default WssCamera;