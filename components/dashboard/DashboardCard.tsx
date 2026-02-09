// src/components/dashboard/DashboardCard.tsx
'use client';

import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Stack,
  alpha,
  useTheme,
  Tooltip,
} from '@mui/material';
import Link from 'next/link';

interface DashboardCardProps {
  title: string;
  subTitle: string;
  value: string;
  unit: string;
  value_data: string | number;
  unit_data: string;
  image: string;
  link: string;
  // gradient ลบออกเพราะไม่ใช้แล้ว
}

const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  subTitle,
  value,
  unit,
  value_data,
  unit_data,
  image,
  link,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const cardBg = isDark
    ? alpha(theme.palette.background.paper, 0.85)
    : theme.palette.background.paper;

  const borderColor = isDark
    ? theme.palette.primary.dark
    : alpha(theme.palette.primary.main, 0.3);

  const hoverBorder = theme.palette.primary.main;

  const textColor = isDark ? theme.palette.text.primary : theme.palette.text.primary;
  const accentColor = theme.palette.primary.main;

  return (
    <Link href={link} style={{ textDecoration: 'none' }}>
      <Tooltip title={`ไปยังรายละเอียด ${title}`} arrow placement="top">
        <Paper
          elevation={3}
          sx={{
            height: '100%',
            borderRadius: 3,
            overflow: 'hidden',
            background: cardBg,
            border: `1px solid ${borderColor}`,
            transition: 'all 0.25s ease',
            position: 'relative',
            '&:hover': {
              transform: 'translateY(-6px)',
              boxShadow: `0 12px 32px ${alpha(theme.palette.primary.main, isDark ? 0.25 : 0.15)}`,
              borderColor: hoverBorder,
            },
          }}
        >
          <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* ไอคอน + หัวข้อ */}
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: '12px',
                  background: alpha(accentColor, isDark ? 0.18 : 0.12),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Box
                  component="img"
                  src={image}
                  alt={title}
                  sx={{
                    width: 36,
                    height: 36,
                    objectFit: 'contain',
                    filter: isDark ? 'brightness(1.2)' : 'none',
                  }}
                />
              </Box>

              <Box>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontFamily: 'Prompt, sans-serif',
                    fontWeight: 700,
                    color: textColor,
                    lineHeight: 1.2,
                  }}
                >
                  {title}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: theme.palette.text.secondary,
                    fontFamily: 'Prompt, sans-serif',
                  }}
                >
                  {subTitle}
                </Typography>
              </Box>
            </Stack>

            {/* ข้อมูลหลัก (ใหญ่และเด่น) */}
            <Box sx={{ mt: 'auto' }}>
              <Stack direction="row" spacing={1} alignItems="baseline">
                <Typography
                  variant="h4"
                  component="div"
                  sx={{
                    fontWeight: 800,
                    color: accentColor,
                    fontFamily: 'Prompt, sans-serif',
                    lineHeight: 1,
                  }}
                >
                  {value_data}
                </Typography>

                <Typography
                  variant="subtitle1"
                  sx={{
                    color: theme.palette.text.secondary,
                    fontWeight: 500,
                    fontFamily: 'Prompt, sans-serif',
                  }}
                >
                  {unit_data}
                </Typography>
              </Stack>

              {/* ข้อมูลรอง (value + unit) */}
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: 600,
                    color: textColor,
                    fontFamily: 'Prompt, sans-serif',
                  }}
                >
                  {value}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: theme.palette.text.secondary,
                    fontFamily: 'Prompt, sans-serif',
                  }}
                >
                  {unit}
                </Typography>
              </Stack>
            </Box>
          </Box>
        </Paper>
      </Tooltip>
    </Link>
  );
};

export default DashboardCard;