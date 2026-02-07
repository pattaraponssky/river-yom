import { Box, Typography } from "@mui/material";
import { titleStyle } from "@/theme/style";

type PdfViewerProps = {
  src: string;
  title?: string;
  height?: string;      // fallback เช่น "80vh"
};

const PdfViewer = ({
  src,
  title,
  height = "80vh",
}: PdfViewerProps) => {
  return (
    <Box>
      {title && (
        <Typography
          sx={{
            ...titleStyle,
            fontWeight: "bold",
            mb: 2,
          }}
        >
          {title}
        </Typography>
      )}

      <Box
        sx={{
          width: "100%",
          height: height,
          borderRadius: 2,
          overflow: "hidden",
          boxShadow: 1,
        }}
      >
        <iframe
          src={src}
          title={title}
          style={{
            width: "100%",
            height: "100%",
            border: "none",
          }}
        />
      </Box>
    </Box>
  );
};

export default PdfViewer;
