// src/app/flow/page.tsx

import React, { useEffect, useState } from "react";
import { Box, Tabs, Tab, Typography } from "@mui/material";
import { useSearchParams, useRouter } from "next/navigation"; // ใช้แทน useLocation
import PlaceIcon from "@mui/icons-material/Place";
import MapIcon from "@mui/icons-material/Map"; // เปลี่ยนจาก Map เป็น MapIcon
import { Path_URL } from "@/lib/utility";
import { BoxStyle, fontTitle } from "@/theme/style";
import DataFlowCombined from "./FlowData";
import FlowMap from "./FlowMap";

const mapKey = process.env.NEXT_PUBLIC_LONGDO_MAP_KEY!;
const JsonPaths = [
  `${Path_URL}data/River.geojson`,
  `${Path_URL}data/ProjectArea.geojson`,
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
      <Tabs
        value={mainTab}
        onChange={handleMainTabChange}
        aria-label="main category"
        sx={{
          marginBottom: "16px",
          overflowX: "auto",
          whiteSpace: "nowrap",
          "& .MuiTab-root": {
            minWidth: { xs: "auto", md: 160 },
            px: { xs: 2, md: 4 },
          },
        }}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
      >
        <Tab
          sx={{ ...fontTitle }}
          icon={<PlaceIcon />}
          iconPosition="start"
          label="สถานีวัดน้ำท่า"
        />
        <Tab
          sx={{ ...fontTitle }}
          icon={<MapIcon />}
          iconPosition="start"
          label="แผนที่แสดงตำแหน่งสถานี"
        />
      </Tabs>

      {/* Content Display */}
      <Box>
        {mainTab === 0 && (
          <Box>
            {/* ถ้ามี component แสดงข้อมูลสถานี */}
            <DataFlowCombined />
          </Box>
        )}

        {mainTab === 1 && (
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