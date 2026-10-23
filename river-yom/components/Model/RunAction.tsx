'use client';

import React, { useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import axios from "axios";

interface RunActionProps {
  title: string;
  description?: string;
  color?: string;
  url: string;
}

const RunAction: React.FC<RunActionProps> = ({
  title,
  description,
  color = "#1976d2",
  url,
}) => {
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRun = async () => {
    setLoading(true);
    setStatus("idle");
    setMessage("");
    try {
      const response = await axios.post(url);
      if (response.data?.error) {
        setStatus("error");
        setMessage("รันไม่สำเร็จ");
      } else {
        setStatus("success");
        setMessage("รันสำเร็จ");
      }
    } catch (error: unknown) {
      setStatus("error");
      setMessage(
        error instanceof Error
          ? `เกิดข้อผิดพลาด: ${error.message}`
          : "เกิดข้อผิดพลาดในการรัน"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper
      variant="outlined"
      sx={{
        p: { xs: 1.5, sm: 2 },
        borderRadius: 2,
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        alignItems: { xs: "stretch", sm: "center" },
        gap: 1.5,
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontFamily: "Prompt", fontWeight: 600, fontSize: { xs: "0.9rem", sm: "0.95rem" } }}>
          {title}
        </Typography>
        {description && (
          <Typography sx={{ fontFamily: "Prompt", fontSize: "0.78rem", color: "text.secondary", mt: 0.25 }}>
            {description}
          </Typography>
        )}
        {message && (
          <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 0.75 }}>
            {status === "success" ? (
              <CheckCircleIcon sx={{ fontSize: 16, color: "success.main" }} />
            ) : (
              <ErrorOutlineIcon sx={{ fontSize: 16, color: "error.main" }} />
            )}
            <Typography
              sx={{
                fontFamily: "Prompt",
                fontSize: "0.78rem",
                color: status === "success" ? "success.main" : "error.main",
              }}
            >
              {message}
            </Typography>
          </Stack>
        )}
      </Box>

      <Button
        variant="contained"
        onClick={handleRun}
        disabled={loading}
        startIcon={loading ? undefined : <PlayArrowIcon />}
        sx={{
          fontFamily: "Prompt",
          minWidth: { xs: "100%", sm: 132 },
          bgcolor: color,
          "&:hover": { bgcolor: color, filter: "brightness(0.92)" },
        }}
      >
        {loading ? <CircularProgress size={20} color="inherit" /> : "รันคำสั่ง"}
      </Button>
    </Paper>
  );
};

export default RunAction;
