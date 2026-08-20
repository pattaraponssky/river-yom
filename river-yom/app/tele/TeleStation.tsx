// src/app/tele/page.tsx
'use client';

import React, { useEffect, useState } from "react";
import { Box } from "@mui/material";
import { useSearchParams, useRouter } from "next/navigation"; // ใช้แทน useLocation

import MapIcon from "@mui/icons-material/Map";
import BarChartIcon from '@mui/icons-material/BarChart';
import { Path_URL } from "@/lib/utility";
import { BoxStyle } from "@/theme/style";
import SegmentedTabs, { SegmentedTabItem } from "@/components/Data/SegmentedTabs";
import TeleDashboard from "./components/TeleDashboard";
import TeleMap from "./components/TeleMap";
import DataTeleCombined from '@/app/tele/components/TeleData';
import WaterDamageIcon from '@mui/icons-material/WaterDamage';


const mapKey = process.env.NEXT_PUBLIC_LONGDO_MAP_KEY!;
const JsonPaths = [
  `${Path_URL}/data/River.geojson`,
  `${Path_URL}/data/ProjectArea.geojson`,
];

const TELE_TAB_ITEMS: SegmentedTabItem[] = [
  { label: 'ข้อมูลสถานีติดตั้งโครงการ', shortLabel: 'สถานีโครงการ', icon: <WaterDamageIcon /> },
  { label: 'ข้อมูลย้อนหลัง', shortLabel: 'ย้อนหลัง', icon: <BarChartIcon /> },
  { label: 'แผนที่แสดงตำแหน่งสถานี', shortLabel: 'แผนที่', icon: <MapIcon /> },
];

export default function TelePage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // ดึง tab และ station จาก URL query
  const tabFromURL = parseInt(searchParams.get("tab") || "0", 10);
  const selectedStationFromURL = searchParams.get("station") || undefined;

  const [mainTab, setMainTab] = useState(tabFromURL);

  // อัปเดต tab เมื่อ URL เปลี่ยน
  useEffect(() => {
    setMainTab(tabFromURL);
  }, [tabFromURL]);

  // เมื่อเปลี่ยน tab → อัปเดต URL
  const handleMainTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setMainTab(newValue);
    // อัปเดต URL โดยคง station ไว้ถ้ามี
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", newValue.toString());
    router.push(`/tele?${params.toString()}`);
  };

  return (
    <Box sx={{ ...BoxStyle }}>
      {/* Main Tabs */}
      <SegmentedTabs items={TELE_TAB_ITEMS} value={mainTab} onChange={handleMainTabChange} />

      {/* Content Display */}
      <Box>
        {mainTab === 0 && (
          <Box>
            <TeleDashboard />
          </Box>
        )}
        {mainTab === 1 && (
          <Box>
            <DataTeleCombined />
          </Box>
        )}

        {mainTab === 2 && (
          <Box>
            <TeleMap
              id="longdo-map"
              stationType="tele"
              mapKey={mapKey}
              JsonPaths={JsonPaths}
              height="75vh"
            />
          </Box>
        )}
      </Box>
    </Box>
  );
}