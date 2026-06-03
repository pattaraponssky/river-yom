// components/Dashboard/ExportMapButton.tsx
'use client';

import React, { useState } from 'react';
import {
  Box, Button, Menu, MenuItem, ListItemIcon,
  ListItemText, CircularProgress, Tooltip,
} from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import ImageIcon        from '@mui/icons-material/Image';
import CodeIcon         from '@mui/icons-material/Code';
import { exportAsSvg, exportAsPng } from './Exportsvg';

interface ExportMapButtonProps {
  svgRef:   React.RefObject<SVGSVGElement | null>;
  filename?: string;   // ชื่อไฟล์ที่จะ export (default: 'water-schematic')
}

const ExportMapButton: React.FC<ExportMapButtonProps> = ({
  svgRef,
  filename = 'water-schematic',
}) => {
  const [anchorEl,  setAnchorEl]  = useState<null | HTMLElement>(null);
  const [exporting, setExporting] = useState<'svg' | 'png' | null>(null);

  const open = Boolean(anchorEl);

  const handleSvg = async () => {
    setAnchorEl(null);
    if (!svgRef.current) return;
    setExporting('svg');
    try {
      exportAsSvg(svgRef.current as SVGSVGElement, filename);
    } finally {
      setExporting(null);
    }
  };

  const handlePng = async () => {
    setAnchorEl(null);
    if (!svgRef.current) return;
    setExporting('png');
    try {
      await exportAsPng(svgRef.current as SVGSVGElement, filename, 2);
    } catch (e) {
      console.error('Export PNG failed:', e);
    } finally {
      setExporting(null);
    }
  };

  return (
    <>
      <Tooltip title="ส่งออกแผนผัง">
        <Button
          size="medium"
          variant="outlined"
          startIcon={
            exporting
              ? <CircularProgress size={15} color="inherit" />
              : <FileDownloadIcon sx={{ fontSize: 20 }} />
          }
          onClick={e => setAnchorEl(e.currentTarget)}
          disabled={Boolean(exporting)}
          sx={{
            fontFamily:    'Prompt',
            fontSize:      '0.95rem',
            textTransform: 'none',
            borderRadius:  1.5,
            borderColor:   'divider',
            color:         'text.primary',
            backgroundColor: 'secondary.light',
            '&:hover': {
              borderColor: 'text.disabled',
              bgcolor:     'action.hover',
            },
          }}
        >
          {exporting === 'svg' ? 'กำลัง export SVG...'
           : exporting === 'png' ? 'กำลัง export PNG...'
           : 'Export SVG/PNG'}
        </Button>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        slotProps={{
          paper: {
            elevation: 2,
            sx: { borderRadius: 2, border: '0.5px solid', borderColor: 'divider', minWidth: 180 },
          },
        }}
      >
        <MenuItem onClick={handleSvg} sx={{ fontFamily: 'Prompt', fontSize: '1rem', py: 1.25 }}>
          <ListItemIcon><CodeIcon sx={{ fontSize: 18, color: '#185FA5' }} /></ListItemIcon>
          <ListItemText
            primary="Export SVG"
            secondary="แก้ไขได้ / ขนาดเล็ก"
            slotProps={{
              primary:   { sx: { fontFamily: 'Prompt', fontSize: '1rem' } },
              secondary: { sx: { fontFamily: 'Prompt', fontSize: '0.75rem'  } },
            }}
          />
        </MenuItem>

        <MenuItem onClick={handlePng} sx={{ fontFamily: 'Prompt', fontSize: '1rem', py: 1.25 }}>
          <ListItemIcon><ImageIcon sx={{ fontSize: 18, color: '#0F6E56' }} /></ListItemIcon>
          <ListItemText
            primary="Export PNG"
            secondary="ความละเอียด 2x"
            slotProps={{
              primary:   { sx: { fontFamily: 'Prompt', fontSize: '1rem' } },
              secondary: { sx: { fontFamily: 'Prompt', fontSize: '0.75rem'  } },
            }}
          />
        </MenuItem>
      </Menu>
    </>
  );
};

export default ExportMapButton;