'use client';

import { Typography, Box, Dialog, IconButton, Slider, Tooltip } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { titleStyle } from "../theme/style";

interface ImageProps {
  src: string;
  alt: string;
  title: string;
  width?: string | number | { xs?: string | number, sm?: string | number, md?: string | number };
  height?: string | number | { xs?: string | number, sm?: string | number, md?: string | number };
}

const MIN_SCALE = 1;
const MAX_SCALE = 6;

const ImageComponent: React.FC<ImageProps> = ({ src, alt, title, width, height }) => {
  const [open, setOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);

  const lastPosRef = useRef({ x: 0, y: 0 });

  // Function to get the correct style value based on the screen size (simple logic for demonstration)
  const getStyleValue = (value: string | number | { xs?: string | number, sm?: string | number, md?: string | number } | undefined): string | number | undefined => {
    if (typeof value === 'object' && value !== null) {
      return value.xs ?? value.sm ?? value.md;
    }
    return value;
  };

  const dynamicWidth = getStyleValue(width);
  const dynamicHeight = getStyleValue(height);

  const resetView = useCallback(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  const openViewer = () => {
    resetView();
    setOpen(true);
  };

  const closeViewer = useCallback(() => {
    setOpen(false);
    resetView();
  }, [resetView]);

  const clampScale = (v: number) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, v));

  const zoomBy = useCallback((factor: number) => {
    setScale(prev => {
      const next = clampScale(prev * factor);
      if (next === MIN_SCALE) setOffset({ x: 0, y: 0 });
      return next;
    });
  }, []);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    zoomBy(e.deltaY < 0 ? 1.15 : 1 / 1.15);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (scale <= 1) return;
    setDragging(true);
    lastPosRef.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    const dx = e.clientX - lastPosRef.current.x;
    const dy = e.clientY - lastPosRef.current.y;
    lastPosRef.current = { x: e.clientX, y: e.clientY };
    setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
  };

  const handlePointerUp = () => {
    setDragging(false);
  };

  // ปิดด้วยปุ่ม Esc
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeViewer();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closeViewer]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: "100%",
        maxWidth: "100%",
        fontFamily: "Prompt",
      }}
    >
      <Typography sx={{ marginBottom: { md: "1rem", xs: "0.6rem" }, fontWeight: 600, ...titleStyle }}>
        {title}
      </Typography>

      <Box
        component="img"
        src={src}
        alt={alt}
        loading="eager"
        decoding="sync"
        onClick={openViewer}
        sx={{
          display: "block",
          width: dynamicWidth ?? "100%",
          maxWidth: "100%",
          height: dynamicHeight ?? "auto",
          objectFit: "contain",
          cursor: "zoom-in",
          borderRadius: 2,
          transition: "transform 0.2s ease, box-shadow 0.2s ease",
          "&:hover": { boxShadow: 6, transform: "scale(1.01)" },
        }}
      />

      {/* Dialog แสดงภาพขยาย + ซูม/เลื่อน */}
      <Dialog
        open={open}
        onClose={closeViewer}
        maxWidth={false}
        transitionDuration={150}
        PaperProps={{
          sx: {
            bgcolor: "rgba(0,0,0,0.92)",
            backgroundImage: "none",
            m: 0,
            boxShadow: "none",
            width: "100vw",
            height: "100vh",
            maxWidth: "100vw",
            maxHeight: "100vh",
            overflow: "hidden",
          },
        }}
      >
        <Box sx={{ position: "relative", width: "100vw", height: "100vh", overflow: "hidden" }}>
          <Box
            onWheel={handleWheel}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onDoubleClick={() => (scale > 1 ? resetView() : zoomBy(2))}
            sx={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: scale > 1 ? "grab" : "zoom-in",
              touchAction: "none",
              userSelect: "none",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={alt}
              draggable={false}
              style={{
                maxWidth: "100%",
                maxHeight: "100%",
                objectFit: "contain",
                borderRadius: 4,
                transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                transition: dragging ? "none" : "transform 0.15s ease",
                willChange: "transform",
              }}
            />
          </Box>

          {/* ปุ่มควบคุมมุมบนขวา */}
          <Box sx={{ position: "absolute", top: 12, right: 12, display: "flex", gap: 0.5 }}>
            <Tooltip title="รีเซ็ต">
              <IconButton onClick={resetView} sx={{ color: "#fff", bgcolor: "rgba(255,255,255,0.12)", "&:hover": { bgcolor: "rgba(255,255,255,0.24)" } }}>
                <RestartAltIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="ปิด">
              <IconButton onClick={closeViewer} sx={{ color: "#fff", bgcolor: "rgba(255,255,255,0.12)", "&:hover": { bgcolor: "rgba(255,255,255,0.24)" } }}>
                <CloseIcon />
              </IconButton>
            </Tooltip>
          </Box>

          {/* แถบซูมด้านล่าง */}
          <Box
            sx={{
              position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)",
              display: "flex", alignItems: "center", gap: 1.5,
              px: 2, py: 0.75, borderRadius: 99,
              bgcolor: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)",
            }}
          >
            <IconButton size="small" onClick={() => zoomBy(1 / 1.4)} disabled={scale <= MIN_SCALE} sx={{ color: "#fff" }}>
              <ZoomOutIcon fontSize="small" />
            </IconButton>
            <Slider
              value={scale}
              min={MIN_SCALE}
              max={MAX_SCALE}
              step={0.1}
              onChange={(_, v) => {
                const next = v as number;
                setScale(next);
                if (next === MIN_SCALE) setOffset({ x: 0, y: 0 });
              }}
              sx={{ width: { xs: 120, sm: 180 }, color: "#fff" }}
            />
            <IconButton size="small" onClick={() => zoomBy(1.4)} disabled={scale >= MAX_SCALE} sx={{ color: "#fff" }}>
              <ZoomInIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      </Dialog>
    </Box>
  );
};

export default ImageComponent;
