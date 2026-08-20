'use client';
import React, { useEffect, useState } from "react";
import { Box } from "@mui/material";
import { Map } from "@mui/icons-material";

import BarChartIcon from '@mui/icons-material/BarChart';
import { Path_URL } from "@/lib/utility";
import { BoxStyle } from "@/theme/style";
import { useSearchParams, useRouter } from "next/navigation";
import SegmentedTabs, { SegmentedTabItem } from "@/components/Data/SegmentedTabs";
import GateDashboard from "./components/GateDashboard";
import GateMap from "./components/GateMap";
import DataGateStation from '@/app/gate/components/GateData';
import OpacityIcon from '@mui/icons-material/Opacity';


const mapKey = process.env.NEXT_PUBLIC_LONGDO_MAP_KEY!;
const JsonPaths = [
  `${Path_URL}/data/River.geojson`,
  `${Path_URL}/data/ProjectArea.geojson`,
];

const GATE_TAB_ITEMS: SegmentedTabItem[] = [
  { label: 'ข้อมูลประตูระบายน้ำ', shortLabel: 'ประตูน้ำ', icon: <OpacityIcon /> },
  { label: 'ข้อมูลย้อนหลัง', shortLabel: 'ย้อนหลัง', icon: <BarChartIcon /> },
  { label: 'แผนที่แสดงตำแหน่งประตูระบายน้ำ', shortLabel: 'แผนที่', icon: <Map /> },
];

const GateStation: React.FC = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  // ดึง tab และ station จาก URL query
  const tabFromURL = parseInt(searchParams.get("tab") || "0", 10);
  const [mainTab, setMainTab] = useState(tabFromURL);
  const selectedStationFromURL = searchParams.get("station") || undefined;

  useEffect(() => {
    const tabFromURL = parseInt(searchParams.get("tab") || "0");
    setMainTab(tabFromURL);
  }, [searchParams]);

  const handleMainTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setMainTab(newValue);
    // อัปเดต URL โดยคง station ไว้ถ้ามี
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", newValue.toString());
    router.push(`/gate?${params.toString()}`);
  };

  return (
    <div>
      <Box sx={{ ...BoxStyle }}>
        {/* Main Tabs */}
        <SegmentedTabs items={GATE_TAB_ITEMS} value={mainTab} onChange={handleMainTabChange} />

        {/* Content Display */}
        {mainTab === 0 && (
          <GateDashboard />
        )}
        {mainTab === 1 && (
          <Box>
            <DataGateStation propsSelectedStation={selectedStationFromURL} />
          </Box>
        )}
        <Box>
          {mainTab === 2 && (
            <GateMap
              id="longdo-map"
              stationType="gate"
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

export default GateStation;