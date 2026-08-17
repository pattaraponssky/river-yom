'use client';

import React, { useState, useEffect } from "react";
import { Box } from "@mui/material";
import { Map, WaterDamage } from "@mui/icons-material";
import { Path_URL } from "@/lib/utility";
import { BoxStyle } from "@/theme/style";
import SegmentedTabs, { SegmentedTabItem } from "@/components/Data/SegmentedTabs";
import DataReservoirStation from "./components/ReservoirData";
import ReservoirMap from "./components/ReservoirMap";


const mapKey = process.env.NEXT_PUBLIC_LONGDO_MAP_KEY!;
const JsonPaths = [
  `${Path_URL}data/River.geojson`,
  `${Path_URL}data/ProjectArea.geojson`,
];

const RESERVOIR_TAB_ITEMS: SegmentedTabItem[] = [
  { label: 'อ่างเก็บน้ำ', shortLabel: 'อ่างเก็บน้ำ', icon: <WaterDamage /> },
  { label: 'แผนที่แสดงตำแหน่งอ่างเก็บน้ำ', shortLabel: 'แผนที่', icon: <Map /> },
];

const ReservoirStation: React.FC = () => {
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
        {/* Main Tabs */}
        <SegmentedTabs items={RESERVOIR_TAB_ITEMS} value={mainTab} onChange={handleMainTabChange} />

        {/* Content Display */}
        <Box>
          {mainTab === 0 && (
            <Box>
              <DataReservoirStation propsSelectedStation={selectedStationFromURL} />
            </Box>
          )}

          {mainTab === 1 && (
            <ReservoirMap
              id="longdo-map"
              stationType="reservoir"
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

export default ReservoirStation;