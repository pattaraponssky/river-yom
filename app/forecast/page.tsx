import { titleStyle } from "@/theme/style";
import { Typography } from "@mui/material";

export default function ForecastPage() {
  return <Typography sx={{...titleStyle, textAlign: "center", fontWeight: "bold"}}>Forecast Page</Typography>;
}