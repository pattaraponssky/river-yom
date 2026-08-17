// components/Common/SegmentedTabs.tsx
'use client';

import React from 'react';
import { Box, Tabs, Tab, useTheme, useMediaQuery, alpha } from '@mui/material';

export interface SegmentedTabItem {
  label: string;
  shortLabel: string; // ใช้บนมือถือ ให้สั้นพอไม่ตัดคำ
  icon: React.ReactElement;
}

interface SegmentedTabsProps {
  items: SegmentedTabItem[];
  value: number;
  onChange: (event: React.SyntheticEvent, newValue: number) => void;
  ariaLabel?: string;
}

// ─── Tab menu แบบ segmented-control: responsive, ไม่ต้องเลื่อนจอมือถือ ──
// ใช้ร่วมกันได้ทุกหน้า (rain / flow / gate / tele / reservoir ฯลฯ)
// แค่ส่ง items เข้ามา ไม่ต้องผูกกับ label/icon เฉพาะของระบบใดระบบหนึ่ง
const SegmentedTabs: React.FC<SegmentedTabsProps> = ({ items, value, onChange, ariaLabel = 'main category' }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const primary = theme.palette.primary.main;

  return (
    <Box
      sx={{
        mb: { xs: 2, sm: 2.5 },
        p: 0.6,
        borderRadius: 3,
        bgcolor: 'grey.100',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Tabs
        value={value}
        onChange={onChange}
        aria-label={ariaLabel}
        variant="fullWidth"
        TabIndicatorProps={{
          sx: {
            height: '100%',
            borderRadius: 2.5,
            bgcolor: primary,
            zIndex: 0,
            boxShadow: `0 2px 8px ${alpha(primary, 0.35)}`,
          },
        }}
        sx={{
          minHeight: { xs: 64, sm: 48 },
          '& .MuiTabs-flexContainer': {
            gap: 0.5,
          },
        }}
      >
        {items.map((item, idx) => (
          <Tab
            key={item.label}
            icon={item.icon}
            iconPosition={isMobile ? 'top' : 'start'}
            label={isMobile ? item.shortLabel : item.label}
            sx={{
              zIndex: 1,
              minHeight: { xs: 64, sm: 48 },
              borderRadius: 2.5,
              fontFamily: 'Prompt',
              fontWeight: 600,
              fontSize: { xs: '0.72rem', sm: '0.88rem' },
              letterSpacing: 0.2,
              color: 'text.secondary',
              textTransform: 'none',
              gap: { xs: 0.4, sm: 0.75 },
              minWidth: 0,
              px: { xs: 0.5, sm: 2 },
              transition: 'color 0.25s ease',
              '&.Mui-selected': {
                color: '#fff',
              },
              '& .MuiTab-iconWrapper': {
                fontSize: { xs: '1.15rem', sm: '1.2rem' },
                marginBottom: 0,
                marginRight: 0,
              },
              '&:hover': {
                color: value === idx ? '#fff' : primary,
              },
            }}
          />
        ))}
      </Tabs>
    </Box>
  );
};

export default SegmentedTabs;