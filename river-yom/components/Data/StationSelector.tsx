// components/Data/StationSelector.tsx
'use client';

import React from 'react';
import {
  Autocomplete,
  TextField,
  Box,
  Typography,
  Avatar,
  Chip,
  InputAdornment,
  autocompleteClasses,
  alpha,
  useTheme,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import RoomPreferencesOutlinedIcon from '@mui/icons-material/RoomPreferencesOutlined';


export interface StationOption {
  code: string;         // รหัสสถานี เช่น sta_code, rain_code, tele_code ฯลฯ
  name: string;         // ชื่อสถานี
  subLabel?: string;    // บรรทัดรอง เช่น "อำเภอ, จังหวัด" หรือชื่อลุ่มน้ำ/เขื่อน
  icon?: string;        // path รูปไอคอนเฉพาะของสถานีนี้ (ถ้าไม่ส่งจะ fallback ไปที่ iconSrc ของ Selector)
}

interface StationSelectorProps {
  stations: StationOption[];
  value: string;
  onChange: (code: string) => void;
  label?: string;
  placeholder?: string;
  iconSrc?: string;
  fallbackIcon?: React.ReactNode;
  codeLabelPrefix?: string;
}

const StationSelector: React.FC<StationSelectorProps> = ({
  stations,
  value,
  onChange,
  label = 'เลือกสถานี',
  placeholder = 'ค้นหาชื่อสถานี, รหัส หรือที่ตั้ง',
  iconSrc,
  fallbackIcon,
  codeLabelPrefix,
}) => {
  const theme = useTheme();
  const primary = theme.palette.primary.main;
  const selected = stations.find(s => s.code === value) ?? undefined;

  return (
    <Autocomplete
      fullWidth
      disableClearable
      value={selected}
      options={stations}
      getOptionLabel={(s) => `${s.name} (${s.code})`}
      isOptionEqualToValue={(a, b) => a.code === b.code}
      onChange={(_e, newValue) => {
        if (newValue) onChange(newValue.code);
      }}
      // ค้นหาได้ทั้งชื่อสถานี, รหัส, และบรรทัดรอง (ที่ตั้ง/ลุ่มน้ำ)
      filterOptions={(options, { inputValue }) => {
        const q = inputValue.trim().toLowerCase();
        if (!q) return options;
        return options.filter((s) =>
          [s.name, s.code, s.subLabel]
            .filter(Boolean)
            .some((field) => (field as string).toLowerCase().includes(q))
        );
      }}
      renderOption={(props, option) => {
        const { key, ...rest } = props as any;
        return (
          <Box
            component="li"
            key={key}
            {...rest}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.25,
              py: '10px !important',
              px: '14px !important',
            }}
          >
            <Avatar
              src={option.icon || iconSrc || undefined}
              sx={{
                width: 32,
                height: 32,
                bgcolor: alpha(primary, 0.08),
                color: primary,
              }}
            >
              {!(option.icon || iconSrc) && (fallbackIcon ?? <RoomPreferencesOutlinedIcon sx={{ fontSize: '1.1rem' }} />)}
            </Avatar>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography
                noWrap
                sx={{ fontFamily: 'Prompt', fontWeight: 600, fontSize: '0.88rem', color: 'text.primary' }}
              >
                {option.name}
              </Typography>
              {option.subLabel && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.15 }}>
                  <PlaceOutlinedIcon sx={{ fontSize: '0.85rem', color: 'text.disabled' }} />
                  <Typography noWrap sx={{ fontFamily: 'Prompt', fontSize: '0.72rem', color: 'text.secondary' }}>
                    {option.subLabel}
                  </Typography>
                </Box>
              )}
            </Box>
            <Chip
              label={codeLabelPrefix ? `${codeLabelPrefix} ${option.code}` : option.code}
              size="small"
              sx={{
                fontFamily: 'Prompt',
                fontSize: '0.68rem',
                height: 20,
                bgcolor: alpha(primary, 0.08),
                color: primary,
                fontWeight: 600,
              }}
            />
          </Box>
        );
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder={placeholder}
          label={label}
          InputLabelProps={{ sx: { fontFamily: 'Prompt' } }}
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <InputAdornment position="start" sx={{ ml: 0.5 }}>
                <SearchIcon sx={{ fontSize: '1.15rem', color: 'text.disabled' }} />
              </InputAdornment>
            ),
            sx: { fontFamily: 'Prompt' },
          }}
        />
      )}
      sx={{
        [`& .${autocompleteClasses.inputRoot}`]: {
          borderRadius: 2.5,
          bgcolor: 'background.paper',
        },
        '& .MuiOutlinedInput-notchedOutline': {
          borderColor: 'divider',
        },
        '&:hover .MuiOutlinedInput-notchedOutline': {
          borderColor: alpha(primary, 0.5),
        },
      }}
      slotProps={{
        paper: {
          sx: {
            mt: 0.5,
            borderRadius: 2,
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            overflow: 'hidden',
          },
        },
        listbox: {
          sx: {
            maxHeight: 360,
            '& .MuiAutocomplete-option[aria-selected="true"]': {
              bgcolor: alpha(primary, 0.08),
            },
          },
        },
      }}
      noOptionsText={
        <Typography sx={{ fontFamily: 'Prompt', fontSize: '0.85rem', color: 'text.secondary' }}>
          ไม่พบสถานีที่ค้นหา
        </Typography>
      }
    />
  );
};

export default StationSelector;