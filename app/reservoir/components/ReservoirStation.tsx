'use client'; 

import React, { useState, useEffect, use } from "react";
import { Box, Tabs, Tab, Typography } from "@mui/material";
import { Map, WaterDamage } from "@mui/icons-material";
import { Path_URL } from "@/lib/utility";
import { BoxStyle } from "@/theme/style";
import DataReservoirStation from "./ReservoirData";
import ReservoirMap from './ReservoirMap';
import { fontTitle } from '../../../theme/style';


const mapKey = process.env.NEXT_PUBLIC_LONGDO_MAP_KEY!;
const JsonPaths = [
  `${Path_URL}data/River.geojson`,
  `${Path_URL}data/ProjectArea.geojson`,
];

const ReservoirStation: React.FC = () => {
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
        <Tabs
          value={mainTab}
          onChange={handleMainTabChange}
          aria-label="main category"
          sx={{
            marginBottom: "10px",
            overflowX: "auto",  // แก้ตรงนี้
            whiteSpace: "nowrap",
          }}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab
            sx={{ ...fontTitle }}
            icon={<WaterDamage />}
            iconPosition="start"
            label="อ่างเก็บน้ำ"
          />
          <Tab
            sx={{ ...fontTitle }}
            icon={<Map />}
            iconPosition="start"
            label="แผนที่แสดงตำแหน่งอ่างเก็บน้ำ"
          />
     
        </Tabs>

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
