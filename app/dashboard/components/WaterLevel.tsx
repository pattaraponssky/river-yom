import React, { useState, useEffect, useMemo } from "react";
import Papa from "papaparse";
import {
  Select,
  MenuItem,
  Typography,
  Box,
  Button,
} from "@mui/material";
import { ArrowBack, ArrowForward } from "@mui/icons-material";
import Chart from "react-apexcharts";
import CenteredLoading from "@/components/layout/CenteredLoading";
import { Path_URL, formatThaiDay } from "@/lib/utility";
import { titleStyle } from "@/theme/style";


interface WaterLevelData {
  time: string;
  station: string;
  elevation: number;
}

const warningLevels: Record<string, { watch: number; alert: number; crisis: number }> = {
  "T.10": { watch: 2.90, alert: 3.20, crisis: 3.50 },
  "T.13": { watch: 2.16, alert: 2.28, crisis: 2.40 },
  "T.15": { watch: 1.60, alert: 1.70, crisis: 1.80 },
  "T.1": { watch: 1.25, alert: 1.38, crisis: 1.50 },
  "T.14": { watch: 1.20, alert: 1.35, crisis: 1.50 },
};

const stationMapping: Record<string, number> = {
  "T.10": 194202,
  "T.13": 143157,
  "T.15": 125488,
  "T.1": 84876,
  "T.14": 55628,
  "ปตร.พลเทพ": 321863,
  "ปตร.ท่าโบสถ์": 293361,
  "ปตร.ชลมาร์คพิจารณ์": 241706,
  "ปตร.โพธิ์พระยา": 204540,
};

interface Props {
  data: WaterLevelData[];
  chartHeight?: number;
}
const WaterLevelChart: React.FC<Props> = ({ data, chartHeight = 450 }) => {
  const [secondData, setSecondData] = useState<WaterLevelData[]>([]);
  const [selectedStation, setSelectedStation] = useState<string>("T.1");
  const [shiftValue, setShiftValue] = useState<number>(0);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [isPlaying, setIsPlaying] = useState(false);

  const Levels = useMemo(() => warningLevels[selectedStation], [selectedStation]);

  const clean = (val: string | undefined): number => {
    if (!val) return NaN;
    const cleaned = val.replace(/[^\d.-]/g, "");
    const num = parseFloat(cleaned);
    return isNaN(num) ? NaN : num;
  };

  useEffect(() => {
    fetch(`${Path_URL}data/ground_station.csv`)
      .then((response) => response.text())
      .then((csvText) => {
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (result) => {
            const rawData: any[] = result.data;
            if (!rawData.length) return;

            const parsedData: WaterLevelData[] = rawData
              .flatMap((row, index) => {
                const time = (index + 1).toString();
                return Object.keys(stationMapping).map((station) => ({
                  station,
                  elevation: clean(row[station]),
                  time,
                }));
              })
              .filter((item) => !isNaN(item.elevation));

            const minElevation = Math.min(...parsedData.map((item) => item.elevation));
            const calculatedShiftValue = minElevation < 0 ? Math.abs(minElevation) + 1 : 0;

            const shiftedData = parsedData.map((item) => ({
              ...item,
              elevation: item.elevation + calculatedShiftValue,
            }));

            setSecondData(shiftedData);
            setShiftValue(calculatedShiftValue);
            setLoading(false);
          },
        });
      });
  }, []);

  const stationData = useMemo(() => data.filter((item) => item.station === selectedStation), [data, selectedStation]);

  const groupedByDate = useMemo(() => {
    return stationData.reduce((acc, item) => {
      const date = item.time.split("T")[0];
      if (!acc[date]) acc[date] = [];
      acc[date].push(item);
      return acc;
    }, {} as Record<string, WaterLevelData[]>);
  }, [stationData]);

  const availableDates = useMemo(() => {
  const today = new Date().toISOString().split("T")[0]; // รูปแบบ YYYY-MM-DD
  return Object.keys(groupedByDate)
    .filter(date => date >= today) // กรองเอาเฉพาะวันที่ >= วันนี้
    .sort();
}, [groupedByDate]);

  const currentSelectedData = useMemo(() => {
    const targetTime = `${selectedDate}T${selectedTime}`;
    return stationData.find((item) => item.time === targetTime);
  }, [stationData, selectedDate, selectedTime]);

  useEffect(() => {
  if (availableDates.length > 0 && !selectedDate) {
    setSelectedDate(availableDates[0]);
  }
}, [availableDates, selectedDate]);

  const handlePlay = () => {
    setIsPlaying(prev => !prev);
  };

  useEffect(() => {
  if (!isPlaying) return;

    const interval = setInterval(() => {
      const times = (groupedByDate[selectedDate] || []).map((item) => item.time.split("T")[1]);

      const currentIndex = times.indexOf(selectedTime);
      const nextIndex = currentIndex + 1;

      if (nextIndex < times.length) {
        setSelectedTime(times[nextIndex]);
      } else {
        const currentDateIndex = availableDates.indexOf(selectedDate);
        const nextDate = availableDates[currentDateIndex + 1];
        if (nextDate) {
          setSelectedDate(nextDate);
          const newTimes = (groupedByDate[nextDate] || []).map((item) => item.time.split("T")[1]);
          setSelectedTime(newTimes[0]);
        } else {
          // ถ้าสุดท้ายแล้ว ให้หยุดเล่น
          setIsPlaying(false);
        }
      }
    }, 400); 

    return () => clearInterval(interval); // ล้าง interval เมื่อหยุด
  }, [isPlaying, selectedTime, selectedDate, groupedByDate, availableDates]);

  useEffect(() => {
    if (availableDates.length > 0 && !selectedDate) {
      setSelectedDate(availableDates[0]);
    }
  }, [availableDates]);

  useEffect(() => {
    const times = (groupedByDate[selectedDate] || []).map((item) => item.time.split("T")[1]);
    if (times.length > 0 && !times.includes(selectedTime)) {
      setSelectedTime(times[0]);
    }
  }, [selectedDate, groupedByDate, selectedTime]);

  const filteredSecondData = useMemo(
    () => secondData.filter((item) => item.station === selectedStation),
    [secondData, selectedStation]
  );

  const categories = useMemo(() => filteredSecondData.map((item) => item.time || ""), [filteredSecondData]);

  const elevationValue = currentSelectedData?.elevation ?? 0;
  
  // Filter out the annotations if Levels is not found for the selected station
  const chartAnnotations = useMemo(() => {
    if (!Levels) return [];
    
    return [
      {
        y: Levels.watch + shiftValue,
        borderWidth: 2,
        strokeDashArray: 0,
        borderColor: "green",
        label: {
          position: "center",
          offsetY: 22,
          offsetX: -2,
          text: `เฝ้าระวัง: ${Levels.watch.toFixed(2)} ม.รทก.`,
          style: {
            color: "#fff",
            background: "green",
            fontWeight: "bold",
            fontSize: "0.8rem",
          },
        },
      },
      {
        y: Levels.alert + shiftValue,
        borderWidth: 2,
        strokeDashArray: 0,
        borderColor: "#FFD700",
        label: {
          position: "center",
          offsetY: -5,
          offsetX: -2,
          text: `เตือนภัย: ${Levels.alert.toFixed(2)} ม.รทก.`,
          style: {
            color: "#000",
            background: "#FFD700",
            fontWeight: "bold",
            fontSize: "0.8rem",
          },
        },
      },
      {
        y: Levels.crisis + shiftValue,
        borderWidth: 2,
        strokeDashArray: 0,
        borderColor: "#FF0000",
        label: {
          position: "center",
          offsetY: -7,
          offsetX: 120,
          text: `วิกฤต: ${Levels.crisis.toFixed(2)} ม.รทก.`,
          style: {
            color: "#fff",
            background: "#FF0000",
            fontWeight: "bold",
            fontSize: "0.8rem",
          },
        },
      },
    ];
  }, [Levels, shiftValue]);


  const chartOptions = {
    chart: {
      type: "line" as const,
      height: 450,
      fontFamily: "Prompt",
      zoom: { enabled: true },
    },
    annotations: {
      yaxis: [
        ...chartAnnotations,
        {
          y: elevationValue + shiftValue,
          borderColor: "#007bff",
          borderWidth: 0,
          label: {
            position: "center",
            offsetY: -65,
            offsetX: 10,
            text: `ระดับน้ำ: ${elevationValue.toFixed(2)} (ม.รทก.)`,
            style: { fontSize: "1rem", fontWeight: "bold" },
          },
        },
        {
        y: elevationValue + shiftValue,
        borderWidth: 0,
        label: {
          position: "right",
          offsetX: -10,
          offsetY: -10,
          text: `ตลิ่งขวา`,
          style: { fontSize: "0.8rem", fontWeight: "bold" },
        },
      },
      {
        y: elevationValue + shiftValue,
        borderWidth: 0,
        label: {
          position: "left",
          offsetX: 55,
          offsetY: -10,
          text: `ตลิ่งซ้าย`,
          style: { fontSize: "0.8rem", fontWeight: "bold" },
        },
      },
      ],
    },
    xaxis: {
      categories: categories,
      labels: { show: false },
    },
    tooltip: {
      x: {
        formatter: function (val: number) {
          return Number(val * 5).toFixed(2).toLocaleString() + " เมตร";
        },
      },
      y: {
        formatter: (value: any) => (value - shiftValue).toFixed(2) + " ม.รทก.",
      },
    },
    yaxis: {
      labels: {
        formatter: (val: any) => Number(val - shiftValue).toFixed(0),
        style: { fontSize: "1rem" },
      },
      title: {
        text: "ระดับ (ม.รทก.)",
        style: { fontSize: "1rem" },
      },
    },
    stroke: {
      width: [1, 3],
      curve: "straight" as const,
      dashArray: [0, 0, 8, 8],
    },
    colors: ["#007bff", "#744111"],
    fill: {
      gradient: {
        shade: "light",
        type: "vertical",
        shadeIntensity: 0.5,
        opacityFrom: 1,
        opacityTo: 1,
        stops: [10, 90],
        inverseColors: false,
        blendMode: "multiply",
      },
    },
  };

  const chartSeries = [
    {
      name: "ระดับน้ำ (ม.รทก.)",
      data: Array(filteredSecondData.length).fill(elevationValue + shiftValue),
      type: "area",
    },
    {
      name: "Ground (พื้นดิน)",
      data: filteredSecondData.map((item) => item.elevation),
      type: "area",
    },
  ];

  if (loading) return <CenteredLoading />;
  

  return (
    <Box >
      <Typography gutterBottom sx={{ ...titleStyle, fontWeight: "bold" }}>
        ระดับน้ำรายชั่วโมง สถานี <Box component="span" sx={{ color: "red" }}>{selectedStation}</Box>
      </Typography>

      <Box sx={{ display: "flex", justifyContent: "center", gap: 1, mb: {xs:1,sm:2}, flexWrap: "wrap", alignItems: "center" }}>
        <Button
              sx={{
              display:{xs:"none",sm:"block"},
              fontFamily: "Prompt",
              fontSize: { xs: "0.8rem", sm: "1rem" },
              bgcolor: "#1976d2",
              "&:hover": { bgcolor: "#115293" },
              borderRadius: "20px",
              paddingX: { xs: "8px", sm: "16px" },
              width: { xs: "30%", sm: "auto" }, // ให้ปุ่มเต็มหน้าจอในขนาดเล็ก
              mb: { xs: 2, sm: 0 }, // เพิ่ม margin-bottom ในขนาดหน้าจอเล็ก
            }}
          variant="contained"
          onClick={() => setSelectedDate(availableDates[Math.max(0, availableDates.indexOf(selectedDate) - 1)])}
          disabled={availableDates.indexOf(selectedDate) === 0}
        >
          <ArrowBack /> ย้อนกลับ
        </Button>

        <Select sx={{ fontFamily: "Prompt", width: { xs: "97%", sm: "auto" }, mb: { xs: 0, sm: 0 } }} value={selectedStation} onChange={(e) => setSelectedStation(e.target.value)}>
          {Object.keys(stationMapping).map((station) => (
            <MenuItem sx={{fontFamily: "Prompt"}} key={station} value={station}>{station}</MenuItem>
          ))}
        </Select>

        <Select sx={{ fontFamily: "Prompt", width: { xs: "55%", sm: "auto" },fontSize:{xs:"0.9rem"} }} value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}>
          {availableDates.map((date) => (
            <MenuItem sx={{fontFamily: "Prompt"}}  key={date} value={date}>{formatThaiDay(date)}</MenuItem>
          ))}
        </Select>

        {selectedDate && (
          <Select sx={{ fontFamily: "Prompt", width: { xs: "40%", sm: "auto" },fontSize:{xs:"0.9rem"} }} value={selectedTime} onChange={(e) => setSelectedTime(e.target.value)}>
            {(groupedByDate[selectedDate] || []).map((item) => {
              const timeOnly = item.time.split("T")[1];
              return <MenuItem sx={{fontFamily: "Prompt"}}  key={item.time} value={timeOnly}>{timeOnly}</MenuItem>;
            })}
          </Select>
        )}

           <Button
              sx={{
              display:{xs:"block",sm:"none"},
              fontFamily: "Prompt",
              fontSize: { xs: "0.8rem", sm: "1rem" },
              bgcolor: "#1976d2",
              "&:hover": { bgcolor: "#115293" },
              borderRadius: "20px",
              paddingX: { xs: "8px", sm: "16px" },
              width: { xs: "30%", sm: "auto" }, // ให้ปุ่มเต็มหน้าจอในขนาดเล็ก
              mb: { xs: 2, sm: 0 }, // เพิ่ม margin-bottom ในขนาดหน้าจอเล็ก
            }}
          variant="contained"
          onClick={() => setSelectedDate(availableDates[Math.max(0, availableDates.indexOf(selectedDate) - 1)])}
          disabled={availableDates.indexOf(selectedDate) === 0}
        >
          <ArrowBack /> ย้อนกลับ
        </Button>

        <Button
          variant="outlined"
          onClick={handlePlay}
          sx={{
            fontFamily: "Prompt",
            fontSize: { xs: "0.8rem", sm: "1rem" },
            bgcolor: isPlaying ? "#e53935" : "#43a047",
            "&:hover": { bgcolor: isPlaying ? "#b71c1c" : "#2e7d32" },
            borderRadius: "20px",
            paddingX: "16px",
            width: { xs: "30%", sm: "auto" },
            mb: { xs: 2, sm: 0 },
            color: "white",
          }}
        >
          {isPlaying ? "หยุด" : "เล่น"}
        </Button>

        <Button
          sx={{ fontFamily: "Prompt", fontSize: { xs: "0.8rem", sm: "1rem" }, bgcolor: "#1976d2", "&:hover": { bgcolor: "#115293" }, borderRadius: "20px", paddingX: "16px", width: { xs: "30%", sm: "auto" }, mb: { xs: 2, sm: 0 } }}
          variant="contained"
          onClick={() => setSelectedDate(availableDates[Math.min(availableDates.length - 1, availableDates.indexOf(selectedDate) + 1)])}
          disabled={availableDates.indexOf(selectedDate) >= availableDates.length - 1}
        >
          ถัดไป <ArrowForward />
        </Button>
      </Box>

      <Box sx={{ width: "100%", height: chartHeight }}>
        <Chart options={chartOptions} series={chartSeries} type="line" height={chartHeight} />
      </Box>

      <Typography sx={{ mt: 2,...titleStyle,textAlign:"center", color: "blue", fontWeight: "bold" }}>
        ระดับน้ำปัจจุบัน: {elevationValue.toFixed(2)} ม.รทก.
      </Typography>
    </Box>
  );
};

export default WaterLevelChart;
