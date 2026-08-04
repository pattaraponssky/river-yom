'use client'; 
import React, { useEffect, useState } from "react";
import { Box, Tabs, Tab, Typography } from "@mui/material";
import {
  Map,
} from "@mui/icons-material"; // Import ไอคอน
import PlaceIcon from "@mui/icons-material/Place";
import BarChartIcon from '@mui/icons-material/BarChart';
import { BoxStyle } from "@/theme/style";
import { Path_URL } from "@/lib/utility";
import DataGateStation from "./GateData";
import GateMap from "./GateMap";
import { fontTitle } from '../../../theme/style';
import GateDashboard from "./GateDashboard";
import { useSearchParams, useRouter } from "next/navigation"; 

const mapKey = process.env.NEXT_PUBLIC_LONGDO_MAP_KEY!;
const JsonPaths = [
  `${Path_URL}data/River.geojson`,
  `${Path_URL}data/ProjectArea.geojson`,
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
        <Tabs
          value={mainTab}
          onChange={handleMainTabChange}
          aria-label="main category"
          sx={{
            marginBottom: "10px",
            overgateX: "auto", // เพิ่มการเลื่อนในแกน X
            whiteSpace: "nowrap", // ไม่ให้ text ตัด
          }}
          variant="scrollable" // ใช้ scrollable tab
          scrollButtons="auto" // เพิ่มปุ่มเลื่อนอัตโนมัติ
        >
          <Tab
            sx={{ ...fontTitle}}
            icon={<PlaceIcon />} // ไอคอนข้อมูลสถานี
            iconPosition="start"
            label="ข้อมูลประตูระบายน้ำ"
          />
           <Tab
            sx={{ ...fontTitle}}
            icon={<BarChartIcon />} // ไอคอนข้อมูลสถานี
            iconPosition="start"
            label="ข้อมูลย้อนหลัง"
          />
          <Tab
            sx={{ ...fontTitle}}
            icon={<Map />} // ไอคอนการตั้งค่าระบบ
            iconPosition="start"
            label="แผนที่แสดงตำแหน่งประตูระบายน้ำ"
          />
         
        </Tabs>

        {/* Content Display */}
          {mainTab === 0 && (
              <GateDashboard />
          )}
          {mainTab === 1 && (
            <Box>
              <DataGateStation propsSelectedStation={selectedStationFromURL}/>
            </Box>
          )}
        <Box>
          {mainTab === 2 && (
              <GateMap
                id="longdo-map"
                stationType="gate"
                mapKey={mapKey}
                JsonPaths={JsonPaths} // ส่งข้อมูล GeoJSON เข้าไป
                height="75vh"
              />
          )}

        </Box>
      </Box>
    </div>
  );
};

export default GateStation;
