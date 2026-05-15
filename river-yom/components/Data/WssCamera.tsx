'use client';

import React, { useEffect, useRef, useState } from 'react';
import mpegts from 'mpegts.js';
import { Box, CircularProgress, Typography } from '@mui/material';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import { CameraConfig } from '@/lib/cameraConfig';

const WssCamera = ({ config }: { config: CameraConfig }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const player = mpegts.createPlayer({
      type: 'm2ts',
      isLive: true,
      url: config.streamUrl,
      hasVideo: true,
      hasAudio: false,
    }, {
      liveBufferLatencyChasing: true,
      liveBufferLatencyChasingOnPaused: true,
      liveSync: true,
      enableStashBuffer: true,
      stashInitialSize: 128 * 1024,
      liveBufferLatencyMaxLatency: 1.2,
      autoCleanupSourceBuffer: true,
      autoCleanupMaxBackwardDuration: 10,
    });

    player.on(mpegts.Events.MEDIA_INFO, (info) => {
      console.log('🎥 MEDIA_INFO →', info);
      console.table(info);
    });

    player.on(mpegts.Events.ERROR, (e) => {
      console.error('MPEGTS Error:', e);
      setError('Stream Error');
    });

    player.attachMediaElement(video);
    player.load();

    video.play().catch(() => {});

    // Force hide loading หลัง 6 วินาที
    const timer = setTimeout(() => setLoading(false), 6000);

    return () => {
      clearTimeout(timer);
      player.destroy();
    };
  }, [config.streamUrl]);

  return (
    <Box sx={{ position: 'relative', width: '100%', aspectRatio: '16/9', bgcolor: '#000', borderRadius: 1, overflow: 'hidden' }}>
      {loading && (
        <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(0,0,0,0.9)', zIndex: 10 }}>
          <CircularProgress size={40} sx={{ color: 'white' }} />
        </Box>
      )}

      {error ? (
        <Box sx={{ height: 240, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', bgcolor: '#1a1a1a' }}>
          <VideocamOffIcon sx={{ fontSize: 60, color: 'grey.600' }} />
          <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>
        </Box>
      ) : (
        <video
          ref={videoRef}
          muted
          autoPlay
          playsInline
          style={{ width: '100%', height: '100%', background: '#000' }}
        />
      )}
    </Box>
  );
};

export default WssCamera;