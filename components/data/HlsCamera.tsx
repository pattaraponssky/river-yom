'use client';

import Hls from 'hls.js';
import React, { useEffect, useRef, useState } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import { CameraConfig } from '../../lib/cameraConfig';

const HlsCamera: React.FC<{ config: CameraConfig }> = ({ config }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setLoading(true);
    setError(false);

    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(config.streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play();
        setLoading(false);
      });

      hls.on(Hls.Events.ERROR, () => {
        setError(true);
        setLoading(false);
      });

      return () => {
        hls.destroy();
      };
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari รองรับ native
      video.src = config.streamUrl;
      video.onloadedmetadata = () => {
        video.play();
        setLoading(false);
      };
    } else {
      setError(true);
      setLoading(false);
    }
  }, [config.streamUrl]);

  return (
    <Box sx={{ position: 'relative', width: '100%', bgcolor: '#000', borderRadius: 1 }}>
      {loading && (
        <Box sx={{
          position: 'absolute', inset: 0, display: 'flex',
          alignItems: 'center', justifyContent: 'center', bgcolor: '#111'
        }}>
          <CircularProgress sx={{ color: 'white' }} />
        </Box>
      )}

      {error ? (
        <Box sx={{
          height: 200, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', bgcolor: '#1a1a1a',
        }}>
          <VideocamOffIcon sx={{ fontSize: 48, color: 'grey.600' }} />
          <Typography sx={{ color: 'grey.500' }}>
            ไม่สามารถเล่น m3u8 ได้
          </Typography>
        </Box>
      ) : (
        <video
          ref={videoRef}
          controls
          muted
          autoPlay
          playsInline
          style={{ width: '100%' }}
        />
      )}
    </Box>
  );
};

export default HlsCamera;