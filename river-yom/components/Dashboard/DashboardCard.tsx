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
    
  const primary = theme.palette.primary.main;
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
            borderRadius: { xs: 2, sm: 3 },
            overflow: 'hidden',
            background: cardBg,
            border: `1px solid ${borderColor}`,
            transition: 'all 0.25s ease',
            position: 'relative',
            '&:hover': {
              transform: { xs: 'translateY(-2px)', sm: 'translateY(-6px)' },
              boxShadow: `0 12px 32px ${alpha(theme.palette.primary.main, isDark ? 0.25 : 0.15)}`,
              borderColor: hoverBorder,
            },
          }}
        >
          <Box
            sx={{
              p: { xs: 1.5, sm: 3 },
              display: 'flex',
              flexDirection: { xs: 'row', sm: 'column' },
              alignItems: { xs: 'center', sm: 'stretch' },
              gap: { xs: 1.25, sm: 0 },
              height: '100%',
            }}
          >
            {/* ไอคอน + หัวข้อ */}
            <Stack
              direction="row"
              spacing={{ xs: 1.25, sm: 2 }}
              alignItems="center"
              sx={{ mb: { xs: 0, sm: 2 }, flex: { xs: 1, sm: 'none' }, minWidth: 0 }}
            >
              <Box
                sx={{
                  width: { xs: 40, sm: 60 },
                  height: { xs: 40, sm: 60 },
                  borderRadius: { xs: 2, sm: '16px' },
                  flexShrink: 0,
                  background: `linear-gradient(135deg, ${alpha(primary, 0.25)}, ${alpha(primary, 0.05)})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 8px 20px ${alpha(primary, 0.3)}`,
                }}
              >
                <Box
                  component="img"
                  src={image}
                  alt={title}
                  sx={{
                    width: { xs: 24, sm: 36 },
                    height: { xs: 24, sm: 36 },
                    objectFit: 'contain',
                    filter: isDark ? 'brightness(1.2)' : 'none',
                  }}
                />
              </Box>

              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontFamily: 'Prompt, sans-serif',
                    fontWeight: 700,
                    color: textColor,
                    lineHeight: 1.2,
                    fontSize: { xs: '0.82rem', sm: '1.2rem' }
                  }}
                >
                  {title}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: theme.palette.text.secondary,
                    fontFamily: 'Prompt, sans-serif',
                    fontWeight: 500,
                    fontSize: { xs: '0.68rem', sm: '0.95rem' }
                  }}
                >
                  {subTitle}
                </Typography>
              </Box>
            </Stack>

            {/* ข้อมูลหลัก (ใหญ่และเด่น) */}
            <Box
              sx={{
                mt: { xs: 0, sm: 'auto' },
                flexShrink: 0,
                textAlign: { xs: 'right', sm: 'left' },
              }}
            >
              <Stack
                direction="row"
                spacing={{ xs: 0.5, sm: 1 }}
                alignItems="baseline"
                justifyContent={{ xs: 'flex-end', sm: 'flex-start' }}
              >
                <Typography
                  variant="h4"
                  component="div"
                  sx={{
                    fontWeight: 800,
                    color: accentColor,
                    fontFamily: 'Prompt, sans-serif',
                    lineHeight: 1,
                    fontSize: { xs: '1.35rem', sm: '2.125rem' },
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
                    fontSize: { xs: '0.65rem', sm: '1rem' },
                    lineHeight: { xs: 1.1, sm: 1.5 },
                    maxWidth: { xs: 72, sm: 'none' },
                  }}
                >
                  {unit_data}
                </Typography>
              </Stack>

              {/* ข้อมูลรอง (value + unit) */}
              <Stack
                direction="row"
                spacing={{ xs: 0.5, sm: 1 }}
                alignItems="center"
                justifyContent={{ xs: 'flex-end', sm: 'flex-start' }}
                sx={{ mt: 0.25 }}
              >
                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: 600,
                    color: textColor,
                    fontFamily: 'Prompt, sans-serif',
                    fontSize: { xs: '0.7rem', sm: '1rem' },
                  }}
                >
                  {value}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: theme.palette.text.secondary,
                    fontFamily: 'Prompt, sans-serif',
                    fontSize: { xs: '0.65rem', sm: '0.875rem' },
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