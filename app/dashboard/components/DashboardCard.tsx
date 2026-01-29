import React from 'react';
import { Grid } from "@mui/material";
import { Path_URL } from '../../../lib/utility';
import DashboardCard from '../../../components/dashboard/DashboardCard';

interface DashboardCardsProps {
  data: any;
}
const DashboardCards: React.FC<DashboardCardsProps> = ({ data }) => {
  
const cardData = data ? [
    {
      title: "ประตูระบายน้ำ",
      subTitle: "ปตร.โพธิ์พระยา ระบาย",
      value: "4",
      unit: "ปตร.",
      value_data: "33",
      // value_data: data.discharge_gate["T.16"] || 0,
      unit_data: "ลบ.ม./วินาที",
      image: `${Path_URL}images/icons/gate_icon.png`,
      gradient: "linear-gradient(135deg, #e57373, #d32f2f)",
      link: "/gate"
    },
    {
      title: "ระบายผ่านอาคาร",
      subTitle: "ระบายรวม",
      value: "10",
      unit: "อาคาร",
      // value_data: (
      //   ["BYH", "PBL", "PPM", "KTB", "MHC", "MSW", "KYG", "BBP", "SPN", "PTL"]
      //     .reduce((sum, code) => sum + parseFloat(data.discharge_gate[code] || 0), 0)
      //     .toFixed(2)
      // ),
      value_data: "33",
      unit_data: "ลบ.ม./วินาที",
      image: `${Path_URL}images/icons/gate_icon2.png`,
      gradient: "linear-gradient(135deg, #f06292, #c2185b)",
      link: "/gate"
    },
    {
      title: "สถานีวัดน้ำท่า",
      subTitle: "น้ำล้นตลิ่ง",
      value: "6",
      unit: "สถานี",
      value_data: data.flow_stations_over_wl,
      unit_data: "สถานี",
      image: `${Path_URL}images/icons/flow_station_icon.png`,
      gradient: "linear-gradient(135deg, #4db6ac, #00796b)",
      link: "/flow"
    },
    {
      title: "สถานีวัดน้ำฝน",
      subTitle: "ฝนเฉลี่ย",
      value: "8",
      unit: "สถานี",
      value_data: data.avg_rain_mm,
      unit_data: "มม.",
      image: `${Path_URL}images/icons/rain_station_icon.png`,
      gradient: "linear-gradient(135deg, #ffd54f, #ff8f00)",
      link: "/rain"
    },
    {
      title: "อ่างเก็บน้ำ",
      subTitle: "น้ำใช้การได้",
      value: "5",
      unit: "แห่ง",
      value_data: data.total_reservoir_volume,
      unit_data: "ล้าน ลบ.ม.",
      image: `${Path_URL}images/icons/reservoir_icon.png`,
      gradient: "linear-gradient(135deg, #64b5f6, #1976d2)",
      link: "/reservoir"
    },
  ] : [];

  return (
    <Grid
      container
      spacing={1}
      sx={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "flex-start",
      }}
    >
      {cardData.map((card, index) => (
        <DashboardCard key={index} {...card} />
      ))}
    </Grid>
  );
};

export default DashboardCards;