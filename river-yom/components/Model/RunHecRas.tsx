import React from "react";
import { Box, Typography } from "@mui/material";
import { Model_URL } from "@/lib/utility";
import RunAction from "./RunAction";

const RunHecRas: React.FC = () => {
  return (
    <Box>
      <Typography
        variant="h6"
        sx={{ fontFamily: "Prompt", fontWeight: 600, fontSize: { xs: "0.95rem", sm: "1rem" }, mb: 1 }}
      >
        ขั้นตอนที่ 2 จำลองสถานการณ์น้ำ (HEC-RAS)
      </Typography>
      <RunAction
        title="รันแบบจำลอง HEC-RAS"
        description="จำลองระดับน้ำและสถานการณ์น้ำตลอดลำน้ำยม"
        color="#1976d2"
        url={`${Model_URL}/hec_api/ras_all.php`}
      />
    </Box>
  );
};

export default RunHecRas;
