'use client';
import React, { useEffect, useState } from "react";
import { Box, Tabs, Tab, useTheme, useMediaQuery, alpha } from "@mui/material";
import { Map, WaterDrop } from "@mui/icons-material";
import BarChartIcon from '@mui/icons-material/BarChart';
import { Path_URL } from "@/lib/utility";
import { BoxStyle } from "@/theme/style";
import DataRainStation from "./components/RainData";
import RainMap from "./components/RainMap";
import RainDashboard from "./components/RainDashboard";

const mapKey = process.env.NEXT_PUBLIC_LONGDO_MAP_KEY!;
const JsonPaths = [
  `${Path_URL}data/River.geojson`,
  `${Path_URL}data/ProjectArea.geojson`,
];

const TAB_ITEMS = [
  { label: 'สถานีวัดน้ำฝน', shortLabel: 'สถานีฝน', icon: <WaterDrop /> },
  { label: 'ข้อมูลย้อนหลัง', shortLabel: 'ย้อนหลัง', icon: <BarChartIcon /> },
  { label: 'แผนที่แสดงตำแหน่งสถานี', shortLabel: 'แผนที่', icon: <Map /> },
];

const RainStation: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const primary = theme.palette.primary.main;

  const queryParams = new URLSearchParams(typeof window !== 'undefined' ? location.search : '');
  const [mainTab, setMainTab] = useState(0);
  const selectedStationFromURL = queryParams.get("station") || undefined;

  useEffect(() => {
    const tabFromURL = parseInt(queryParams.get("tab") || "0");
    setMainTab(tabFromURL);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeof window !== 'undefined' ? location.search : '']);

  const handleMainTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setMainTab(newValue);
  };

  return (
    <div>
      <Box sx={{ ...BoxStyle }}>
        {/* ─── Tab Menu: segmented-control style, responsive ─────────── */}
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
            value={mainTab}
            onChange={handleMainTabChange}
            aria-label="main category"
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
            {TAB_ITEMS.map((item, idx) => (
              <Tab
                key={item.label}
                icon={item.icon}
                iconPosition={isMobile ? 'top' : 'start'}
                label={isMobile ? item.shortLabel : item.label}
                disableRipple={false}
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
                    color: mainTab === idx ? '#fff' : primary,
                  },
                }}
              />
            ))}
          </Tabs>
        </Box>

        {/* ─── Content Display ────────────────────────────────────────── */}
        <Box>
          {mainTab === 0 && (
            <Box>
              <RainDashboard />
            </Box>
          )}
          {mainTab === 1 && (
            <Box>
              <DataRainStation propsSelectedStation={selectedStationFromURL} />
            </Box>
          )}
          {mainTab === 2 && (
            <RainMap
              id="longdo-map"
              stationType="rain"
              mapKey={mapKey}
              JsonPaths={JsonPaths}
              height="75vh"
            />
          )}
        </Box>
      </Box>
    </div>
  );
};

export default RainStation;