'use client'; 
import React, { useEffect, useState } from "react";
import { Box, Tabs, Tab, Typography } from "@mui/material";
import {
  Map,
} from "@mui/icons-material"; // Import ไอคอน
import PlaceIcon from "@mui/icons-material/Place";
import { BoxStyle } from "@/theme/style";
import { Path_URL } from "@/lib/utility";
import DataGateStation from "./GateData";
import GateMap from "./GateMap";
import { fontTitle } from '../../../theme/style';

const mapKey = 'e75fee377b3d393b7a32576ce2b0229d'; // กำหนด Map API Key ของ Longdo
const JsonPaths = [
  `${Path_URL}data/River.geojson`,
  `${Path_URL}data/ProjectArea.geojson`,
];

const GateStation: React.FC = () => {
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
            label="ประตูระบายน้ำ"
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
            <Box>
              <DataGateStation propsSelectedStation={selectedStationFromURL}/>
            </Box>
          )}
        <Box>
          {mainTab === 1 && (
            <Typography variant="h5" sx={{ marginBottom: "1rem", fontWeight: 600, fontFamily: "Prompt", color: "#28378B" }}>
              <GateMap
                id="longdo-map"
                stationType="gate"
                mapKey={mapKey}
                JsonPaths={JsonPaths} // ส่งข้อมูล GeoJSON เข้าไป
                height="75vh"
              />
            </Typography>
          )}

        </Box>
      </Box>
    </div>
  );
};

export default GateStation;
