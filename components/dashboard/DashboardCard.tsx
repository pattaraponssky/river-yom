// src/components/dashboard/DashboardCard.tsx
import React from 'react';
import { Paper, CardContent, Typography, Stack, Box, useTheme } from '@mui/material';
import Link from "next/link";

interface DashboardCardProps {
  title: string;
  subTitle: string;
  value: string;
  unit: string;
  value_data: string | number;
  unit_data: string;
  image: string;
  gradient: string; // gradient เดิม (ใช้ใน light mode)
  link: string;
}

const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  subTitle,
  value,
  unit,
  value_data,
  unit_data,
  image,
  gradient,
  link,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // ปรับ gradient ตามธีม (dark mode ทำให้สีเข้มขึ้น + contrast ดี)
  const cardGradient = isDark
    ? `linear-gradient(135deg, ${theme.palette.background.paper}88, ${theme.palette.background.paper}cc)` // โปร่งแสงเข้ม
    : gradient; // ใช้ gradient เดิมใน light

  // สีข้อความ + hover text
  const textColor = isDark ? theme.palette.text.primary : '#fff';
  const hoverTextColor = isDark ? theme.palette.primary.main : '#fff';

  return (
    <Link
      href={link}
      style={{
        textDecoration: 'none',
        flex: '1 1 calc(20% - 16px)',
        paddingBlock: '8px',
        minWidth: '200px',
        display: 'block',
      }}
    >
      <Paper
        elevation={6}
        sx={{
          borderRadius: 4,
          padding: { md: 0.5, xs: 0.2 },
          background: cardGradient,
          color: textColor,
          transition: 'all 0.3s ease-in-out',
          transform: 'scale(1)',
          position: 'relative',
          overflow: 'hidden',
          border: isDark ? `1px solid ${theme.palette.divider}` : 'none', // เพิ่มขอบใน dark mode
          boxShadow: isDark 
            ? '0 8px 32px rgba(0,0,0,0.5)' 
            : '0 4px 12px rgba(0,0,0,0.12)',
          '&:hover': {
            boxShadow: isDark 
              ? '0 12px 40px rgba(0,0,0,0.7)' 
              : '0 8px 20px rgba(0,0,0,0.25)',
            transform: 'scale(1.03)',
            '& .hoverText': { opacity: 1, transform: 'translateY(0)' },
            '& .cardContent': { opacity: isDark ? 0.7 : 0.15 },
          },
        }}
      >
        <CardContent className="cardContent" sx={{ transition: 'opacity 0.3s ease', p: 2 }}>
          <Typography
            sx={{
              whiteSpace: 'nowrap',
              fontFamily: 'Prompt, sans-serif',
              fontWeight: 'bold',
              mb: { md: 1, xs: 1 },
              fontSize: { xs: '1.1rem', sm: '1.2rem', md: '1.2rem' },
              color: textColor,
            }}
          >
            {title}
          </Typography>

          <Stack direction="row" spacing={2} alignItems="center">
            <Box
              component="img"
              src={image}
              alt={title}
              sx={{
                width: '2.5rem',
                height: '2.5rem',
                backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'white',
                borderRadius: '50%',
                padding: { md: '0.2rem', xs: '0.1rem' },
                border: isDark ? `1px solid ${theme.palette.divider}` : 'none',
              }}
            />
            <Box>
              <Typography variant="h6" sx={{ fontFamily: 'Prompt, sans-serif', fontWeight: 600, color: textColor }}>
                {value}
                <Typography
                  component="span"
                  sx={{
                    fontSize: { md: '1rem', xs: '1rem' },
                    fontFamily: 'Prompt, sans-serif',
                    fontWeight: 600,
                    marginLeft: 1,
                    color: textColor,
                  }}
                >
                  {unit}
                </Typography>
              </Typography>
            </Box>
          </Stack>

          <Typography
            sx={{
              mt: 1,
              fontSize: { md: '1rem', xs: '0.8rem' },
              fontWeight: 600,
              fontFamily: 'Prompt, sans-serif',
              textAlign: 'end',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              color: textColor,
            }}
          >
            {subTitle}
          </Typography>

          <Typography
            sx={{
              mt: 1,
              fontSize: { md: '1rem', xs: '0.8rem' },
              fontWeight: 600,
              fontFamily: 'Prompt, sans-serif',
              textAlign: 'end',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              color: textColor,
            }}
          >
            <span style={{ fontSize: '1.2rem', color: isDark ? theme.palette.primary.main : 'white' }}>
              {value_data}
            </span>
            <span style={{ fontSize: '1rem', color: textColor }}>
              {unit_data}
            </span>
          </Typography>
        </CardContent>

        <Typography
          className="hoverText"
          sx={{
            fontSize: { md: '1.1rem', xs: '0.9rem' },
            fontFamily: 'Prompt, sans-serif',
            fontWeight: 'bold',
            position: 'absolute',
            bottom: '25px',
            right: '25px',
            opacity: 0,
            transform: 'translateY(20px)',
            transition: 'opacity 0.3s ease, transform 0.3s ease',
            color: hoverTextColor,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          📎 ดูข้อมูลเพิ่มเติม
        </Typography>
      </Paper>
    </Link>
  );
};

export default DashboardCard;