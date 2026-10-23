import React from "react";
import { Box, Typography } from "@mui/material";
import { Model_URL } from "@/lib/utility";
import RunAction from "./RunAction";

const RunHecHms: React.FC = () => {
  return (
    <Box>
      <Typography
        variant="h6"
        sx={{ fontFamily: "Prompt", fontWeight: 600, fontSize: { xs: "0.95rem", sm: "1rem" }, mb: 1 }}
      >
        ขั้นตอนที่ 1 แปลงข้อมูลน้ำฝนเป็นน้ำท่า (HEC-HMS)
      </Typography>
      <RunAction
        title="รันแบบจำลอง HEC-HMS"
        description="แปลงข้อมูลน้ำฝนเป็นปริมาณน้ำท่าในลำน้ำ"
        color="#1976d2"
        url={`${Model_URL}/hec_api/hms_all.php`}
      />
    </Box>
  );
};

export default RunHecHms;
