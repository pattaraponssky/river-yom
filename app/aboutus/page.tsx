import { titleStyle } from "@/theme/style";
import { Typography } from "@mui/material";

export default function AboutUsPage() {
  return <Typography sx={{...titleStyle, textAlign:"center", fontWeight:"bold"}}>About Us</Typography >;
}