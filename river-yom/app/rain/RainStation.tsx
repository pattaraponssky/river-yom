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
import SegmentedTabs, { SegmentedTabItem } from "@/components/Data/SegmentedTabs";

const mapKey = process.env.NEXT_PUBLIC_LONGDO_MAP_KEY!;
const JsonPaths = [
  `${Path_URL}/data/River.geojson`,
  `${Path_URL}/data/ProjectArea.geojson`,
];


const RAIN_TAB_ITEMS: SegmentedTabItem[] = [
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
        <SegmentedTabs items={RAIN_TAB_ITEMS} value={mainTab} onChange={handleMainTabChange} />

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