import React from "react";
import { Box, Typography } from "@mui/material";
import { Model_URL } from "@/lib/utility";
import RunAction from "./RunAction";

const RunAll: React.FC = () => {
  return (
    <Box>
      <Typography
        variant="h6"
        sx={{ fontFamily: "Prompt", fontWeight: 600, fontSize: { xs: "0.95rem", sm: "1rem" }, mb: 1 }}
      >
        รันแบบจำลอง HEC-HMS และ HEC-RAS ตามลำดับ
      </Typography>
      <RunAction
        title="รันสคริปต์การทำงานทั้งหมด (Run All Model)"
        description="ดำเนินการรันแบบจำลองทั้ง HEC-HMS และ HEC-RAS ต่อเนื่องกันอัตโนมัติ"
        color="#2e7d32"
        url={`${Model_URL}/hec_api/run_model_all.php`}
      />
    </Box>
  );
};

export default RunAll;
