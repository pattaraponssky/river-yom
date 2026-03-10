'use client'; 
import React, { useEffect, useState } from "react";
import { Box, Tabs, Tab, Typography } from "@mui/material";
import {
  Map,
  WaterDrop,
} from "@mui/icons-material"; // Import ไอคอน
import { Path_URL } from "@/lib/utility";
import { BoxStyle } from "@/theme/style";
import DataRainStation from "./RainData";
import RainMap from "./RainMap";
import { fontTitle } from '../../../theme/style';

const mapKey = process.env.NEXT_PUBLIC_LONGDO_MAP_KEY!;
  const JsonPaths = [
    `${Path_URL}data/River.geojson`,
    `${Path_URL}data/ProjectArea.geojson`,
  ];


const RainStation: React.FC = () => {
  const queryParams = new URLSearchParams(location.search);

  const [mainTab, setMainTab] = useState(0);
  const selectedStationFromURL = queryParams.get("station") || undefined;

  useEffect(() => {
    const tabFromURL = parseInt(queryParams.get("tab") || "0");
    setMainTab(tabFromURL);
  }, [location.search]);

  const handleMainTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setMainTab(newValue);
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
            overflowX: "auto", // เพิ่มการเลื่อนในแกน X
            whiteSpace: "nowrap", // ไม่ให้ text ตัด
          }}
          variant="scrollable" // ใช้ scrollable tab
          scrollButtons="auto" // เพิ่มปุ่มเลื่อนอัตโนมัติ
        >
              <Tab
            sx={{ ...fontTitle }}
            icon={<WaterDrop />} // ไอคอนข้อมูลสถานี
            iconPosition="start"
            label="สถานีวัดน้ำฝน"
          />
          <Tab
            sx={{ ...fontTitle }}
            icon={<Map />} // ไอคอนการตั้งค่าระบบ
            iconPosition="start"
            label="แผนที่แสดงตำแหน่งสถานี"
          />
        </Tabs>

        {/* Content Display */}
        <Box>
          {mainTab === 1 && (
            <Typography variant="h5" sx={{ marginBottom: "1rem", fontWeight: 600, fontFamily: "Prompt", color: "#28378B" }}>
              <RainMap
                id="longdo-map"
                stationType="rain"
                mapKey={mapKey}
                JsonPaths={JsonPaths} // ส่งข้อมูล GeoJSON เข้าไป
                height="75vh"
              />
            </Typography>
          )}

          {mainTab === 0 && (
            <Box>
              <DataRainStation propsSelectedStation={selectedStationFromURL}/>
            </Box>
          )}

          {/* {mainTab === 2 && (
            <Box>
              <Typography variant="h5" sx={{ marginBottom: "1rem", fontWeight: 600, fontFamily: "Prompt", color: "#28378B" }}>
                📊 หน้าเลือกข้อมูลสำหรับการ Download , เลือกการดาวน์โหลด
              </Typography>
            </Box>
          )} */}
        </Box>
      </Box>
    </div>
  );
};

export default RainStation;
