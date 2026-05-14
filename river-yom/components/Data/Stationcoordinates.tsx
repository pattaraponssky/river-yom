'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Box, Paper, Typography, Stack, IconButton,
  Tooltip, Snackbar, Alert,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import OpenInNewIcon   from '@mui/icons-material/OpenInNew';
import LocationOnIcon  from '@mui/icons-material/LocationOn';

interface Props {
  staCode:   string;
  lat:       string | number;
  long:      string | number;
  staName?:  string;
  mapHeight?: number;
}

const LONGDO_MAP_KEY = process.env.NEXT_PUBLIC_LONGDO_MAP_KEY ?? '';

export default function StationCoordinates({
  staCode,
  lat,
  long,
  staName,
  mapHeight = 280,
}: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef          = useRef<any>(null);
  const markerRef       = useRef<any>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [copied,      setCopied]      = useState(false);

  const latNum = parseFloat(String(lat));
  const lonNum = parseFloat(String(long));
  const valid  = !isNaN(latNum) && !isNaN(lonNum);
  const latStr = valid ? latNum.toFixed(6) : '-';
  const lonStr = valid ? lonNum.toFixed(6) : '-';

  const googleUrl = valid
    ? `https://www.google.com/maps?q=${latNum},${lonNum}`
    : '#';

  // ── โหลด script ────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (document.querySelector('#longdoMapScript')) {
      setScriptReady(true);
      return;
    }
    const s    = document.createElement('script');
    s.id       = 'longdoMapScript';
    s.src      = `https://api.longdo.com/map/?key=${LONGDO_MAP_KEY}`;
    s.async    = true;
    s.onload   = () => setScriptReady(true);
    document.body.appendChild(s);
  }, []);

  // ── สร้างแผนที่ครั้งแรก ─────────────────────────────────────
  useEffect(() => {
    if (!scriptReady || !mapContainerRef.current || !valid || mapRef.current) return;

    let retry = 0;

    const initMap = () => {
        const longdo = (window as any).longdo;

        if (!longdo?.Map) {
        retry++;

        if (retry < 20) {
            setTimeout(initMap, 300);
        }

        return;
        }

        const map = new longdo.Map({
        placeholder: mapContainerRef.current,
        language: 'th',
        });

        map.location({ lat: latNum, lon: lonNum }, true);
        map.zoom(15, true);

        map.Ui.Mouse.enableWheel(false);
        map.Ui.Toolbar.visible(false);
        map.Ui.LayerSelector.visible(false);
        map.Ui.Crosshair.visible(false);

        const marker = createMarker(
        longdo,
        latNum,
        lonNum,
        staCode,
        staName,
        latStr,
        lonStr
        );

        map.Overlays.add(marker);

        mapRef.current = map;
        markerRef.current = marker;
    };

    initMap();
    }, [scriptReady, valid]);

  // ── อัปเดตเมื่อ prop เปลี่ยน (เปลี่ยนสถานี) ────────────────
  useEffect(() => {
    if (!mapRef.current || !valid) return;
    const longdo = (window as any).longdo;
    if (!longdo) return;

    if (markerRef.current) mapRef.current.Overlays.remove(markerRef.current);

    mapRef.current.location({ lat: latNum, lon: lonNum }, true);

    const marker = createMarker(longdo, latNum, lonNum, staCode, staName, latStr, lonStr);
    mapRef.current.Overlays.add(marker);
    markerRef.current = marker;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latNum, lonNum, staCode, staName]);

  const handleCopy = () => {
    if (!valid) return;
    navigator.clipboard.writeText(`${latStr}, ${lonStr}`);
    setCopied(true);
  };

  return (
    <>
      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>

        {/* แผนที่ */}
        <Box ref={mapContainerRef} sx={{ width: '100%', height: mapHeight }} />

        {/* ข้อมูลพิกัด */}
        <Box sx={{ p: 1.5 }}>

          {/* หัว */}
          <Stack direction="row" alignItems="center" spacing={0.5} mb={1}>
            <LocationOnIcon sx={{ color: 'primary.main', fontSize: 18 }} />
            <Typography sx={{ fontFamily: 'Prompt', fontWeight: 700, fontSize: '0.85rem', flex: 1 }}>
              พิกัดสถานี {staName ? `— ${staName}` : staCode}
            </Typography>
            <Tooltip title="คัดลอกพิกัด">
              <IconButton size="small" onClick={handleCopy} disabled={!valid}>
                <ContentCopyIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="เปิดใน Google Maps">
              <IconButton
                size="small"
                component="a"
                href={googleUrl}
                target="_blank"
                rel="noopener noreferrer"
                disabled={!valid}
              >
                <OpenInNewIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          </Stack>

          {/* DD */}
          <Box sx={{ bgcolor: 'action.hover', borderRadius: 1.5, px: 1.5, py: 1, mb: 1, textAlign: 'center' }}>
            <Typography sx={{ fontFamily: 'monospace', fontSize: '0.92rem', fontWeight: 700 }}>
              {latStr},&nbsp;{lonStr}
            </Typography>
            <Typography sx={{ fontFamily: 'Prompt', fontSize: '0.68rem', color: 'text.disabled' }}>
              Decimal Degrees · WGS84
            </Typography>
          </Box>

          {/* Lat / Lon แยก */}
          <Stack direction="row" spacing={1}>
            <CoordBox label="ละติจูด (Lat)"   value={latStr} dms={valid ? toDMS(latNum, 'lat') : '-'} />
            <CoordBox label="ลองจิจูด (Lon)"  value={lonStr} dms={valid ? toDMS(lonNum, 'lon') : '-'} />
          </Stack>
        </Box>
      </Paper>

      <Snackbar
        open={copied}
        autoHideDuration={2200}
        onClose={() => setCopied(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setCopied(false)} sx={{ fontFamily: 'Prompt' }}>
          คัดลอกแล้ว: {latStr}, {lonStr}
        </Alert>
      </Snackbar>
    </>
  );
}

// ── helpers ─────────────────────────────────────────────────────

function createMarker(
  longdo:  any,
  lat:     number,
  lon:     number,
  staCode: string,
  staName: string | undefined,
  latStr:  string,
  lonStr:  string,
) {
  return new longdo.Marker(
    { lat, lon },
    {
      title: `<b style="font-family:Prompt;font-size:1rem">${staName ?? staCode}</b>`,
      detail: `
        <div style="font-family:Prompt;font-size:0.85rem;line-height:1.7">
          <div>รหัสสถานี: <b>${staCode}</b></div>
          <div>ละติจูด:&nbsp;&nbsp;&nbsp;<b>${latStr}</b></div>
          <div>ลองจิจูด:&nbsp;&nbsp;<b>${lonStr}</b></div>
        </div>
      `,
      icon: {
        html: `
          <div style="text-align:center;position:relative;width:32px;height:40px">
            <div style="
              width:26px;height:26px;
              background:#1976d2;
              border-radius:50% 50% 50% 0;
              transform:rotate(-45deg);
              margin:0 auto;
              border:3px solid #fff;
              box-shadow:0 2px 8px rgba(0,0,0,0.45)
            "></div>
          </div>
        `,
      },
    }
  );
}

function CoordBox({ label, value, dms }: { label: string; value: string; dms: string }) {
  return (
    <Box sx={{ flex: 1, bgcolor: 'action.hover', borderRadius: 1.5, px: 1, py: 0.75 }}>
      <Typography sx={{ fontFamily: 'Prompt', fontSize: '0.68rem', color: 'text.disabled' }}>
        {label}
      </Typography>
      <Typography sx={{ fontFamily: 'Prompt', fontSize: '0.82rem', fontWeight: 700 }}>
        {value}°
      </Typography>
      <Typography sx={{ fontFamily: 'monospace', fontSize: '0.65rem', color: 'text.secondary' }}>
        {dms}
      </Typography>
    </Box>
  );
}

function toDMS(deg: number, axis: 'lat' | 'lon'): string {
  const abs = Math.abs(deg);
  const d   = Math.floor(abs);
  const m   = Math.floor((abs - d) * 60);
  const s   = ((abs - d) * 60 - m) * 60;
  const dir = axis === 'lat' ? (deg >= 0 ? 'N' : 'S') : (deg >= 0 ? 'E' : 'W');
  return `${d}° ${m}' ${s.toFixed(1)}" ${dir}`;
}