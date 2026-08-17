// src/app/flow/page.tsx
'use client';

import React, { useEffect, useState } from "react";
import { Box } from "@mui/material";
import { useSearchParams, useRouter } from "next/navigation"; // ใช้แทน useLocation
import PlaceIcon from "@mui/icons-material/Place";
import MapIcon from "@mui/icons-material/Map";
import BarChartIcon from '@mui/icons-material/BarChart';
import { Path_URL } from "@/lib/utility";
import { BoxStyle } from "@/theme/style";
import SegmentedTabs, { SegmentedTabItem } from "@/components/Data/SegmentedTabs";
import FlowDashboard from "./components/FlowDashboard";
import FlowMap from "./components/FlowMap";
import DataFlowCombined from '@/app/flow/components/FlowData';


const mapKey = process.env.NEXT_PUBLIC_LONGDO_MAP_KEY!;
const JsonPaths = [
  `${Path_URL}data/River.geojson`,
  `${Path_URL}data/ProjectArea.geojson`,
];

const FLOW_TAB_ITEMS: SegmentedTabItem[] = [
  { label: 'สถานีวัดน้ำท่า', shortLabel: 'สถานีน้ำท่า', icon: <PlaceIcon /> },
  { label: 'ข้อมูลย้อนหลัง', shortLabel: 'ย้อนหลัง', icon: <BarChartIcon /> },
  { label: 'แผนที่แสดงตำแหน่งสถานี', shortLabel: 'แผนที่', icon: <MapIcon /> },
];

export default function FlowPage() {
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
    router.push(`/flow?${params.toString()}`);
  };

  return (
    <Box sx={{ ...BoxStyle }}>
      {/* Main Tabs */}
      <SegmentedTabs items={FLOW_TAB_ITEMS} value={mainTab} onChange={handleMainTabChange} />

      {/* Content Display */}
      <Box>
        {mainTab === 0 && (
          <Box>
            <FlowDashboard />
          </Box>
        )}

        {mainTab === 1 && (
          <Box>
            {/* ถ้ามี component แสดงข้อมูลสถานี */}
            <DataFlowCombined propsSelectedStation={selectedStationFromURL} />
          </Box>
        )}
        {mainTab === 2 && (
          <Box>
            <FlowMap
              id="longdo-map"
              stationType="flow"
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