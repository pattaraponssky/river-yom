import React from "react";
import { Box, CircularProgress, Typography } from "@mui/material";

const CenteredLoading: React.FC<{ message?: string }> = ({ message = "กำลังโหลด..." }) => {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      height="100vh"
    >
      <CircularProgress size={48} />
      <Typography variant="body1" mt={2} sx={{ fontFamily: "Prompt", fontWeight: "bold" }}>
        {message}
      </Typography>
    </Box>
  );
};

export default CenteredLoading;
