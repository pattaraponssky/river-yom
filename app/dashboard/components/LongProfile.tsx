import React, { useState, useEffect, useMemo, useRef } from "react";
import Papa from "papaparse";
import ReactApexChart from "react-apexcharts";
import { Box, Button, MenuItem, Select, Typography } from "@mui/material";
import { ArrowBack, ArrowForward } from "@mui/icons-material";
import CenteredLoading from "@/components/layout/CenteredLoading";
import { Path_URL, formatThaiDateTime, formatThaiDay } from "@/lib/utility";
import { titleStyle } from "@/theme/style";

interface waterData {
  CrossSection: number;
  Date: string | null;
  WaterLevel: number;
}

interface ProfilePoint {
  Ground: number;
  LOB: number;
  ROB: number;
  KM: number;
  WaterLevel?: number | null;
}

interface Props {
  waterData: waterData[];
  chartHeight?: number;
  isDark?: boolean;
}

const LongProfileChart: React.FC<Props> = ({ waterData, chartHeight = 500, isDark }) => {
  const [profileData, setProfileData] = useState<ProfilePoint[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [loading, setLoading] = useState(true);

  // โหลด longProfile.csv
  useEffect(() => {
    fetch(`${Path_URL}data/longProfile.csv`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load longProfile.csv");
        return res.text();
      })
      .then((csvText) => {
        Papa.parse(csvText, {
          header: false,
          skipEmptyLines: true,
          complete: (result) => {
            const raw = result.data.slice(1) as string[][];
            const parsed = raw
              .map((row) => {
                const km = parseFloat(row[3]);
                if (isNaN(km)) return null;
                return {
                  Ground: parseFloat(row[0]) || 0,
                  LOB: parseFloat(row[1]) || 0,
                  ROB: parseFloat(row[2]) || 0,
                  KM: km,
                };
              })
              .filter((d): d is ProfilePoint => d !== null);

            if (parsed.length === 0) {
              console.warn("No valid data in longProfile.csv");
              setLoading(false);
              return;
            }

            const minKM = Math.min(...parsed.map((d) => d.KM));
            const maxKM = Math.max(...parsed.map((d) => d.KM));

            const reversed = parsed.map((d) => ({
              ...d,
              KM: maxKM - (d.KM - minKM),
            }));

            setProfileData(reversed);
            setLoading(false);
          },
        });
      })
      .catch((err) => {
        console.error("Load profile CSV error:", err);
        setLoading(false);
      });
  }, []);

  // unique days & times
  const dates = useMemo(() => {
    return [...new Set(waterData.map((d) => d.Date?.split(" ")[0]).filter(Boolean))].sort();
  }, [waterData]);

  const uniqueTimes = useMemo(() => {
    if (!selectedDate) return [];
    return [...new Set(
      waterData
        .filter((d) => d.Date?.startsWith(selectedDate))
        .map((d) => d.Date?.split(" ")[1] ?? "")
    )].sort();
  }, [waterData, selectedDate]);

  // ตั้งค่าเริ่มต้น
  useEffect(() => {
    if (waterData.length > 0 && !selectedDate) {
      const first = [...new Set(waterData.map((d) => d.Date))].sort()[0];
      if (first) {
        const [datePart, timePart] = first.split(" ");
        setSelectedDate(datePart);
        setSelectedTime(timePart);
      }
    }
  }, [waterData, selectedDate]);

  useEffect(() => {
    if (selectedDate && uniqueTimes.length > 0 && (!selectedTime || !uniqueTimes.includes(selectedTime))) {
      setSelectedTime(uniqueTimes[0]);
    }
  }, [selectedDate, uniqueTimes, selectedTime]);

  // เล่นอัตโนมัติ
  const handlePlay = () => {
    if (isPlaying) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setIsPlaying(false);
      return;
    }

    setIsPlaying(true);
    intervalRef.current = setInterval(() => {
      setSelectedTime((prevTime) => {
        if (!prevTime || !selectedDate) return null;

        const times = uniqueTimes;
        const idx = times.indexOf(prevTime);

        if (idx < times.length - 1) {
          return times[idx + 1];
        }

        // เปลี่ยนวันถัดไป
        const dateIdx = dates.indexOf(selectedDate);
        if (dateIdx < dates.length - 1) {
          const nextDate = dates[dateIdx + 1] ?? null;
          setSelectedDate(nextDate);
          const nextTimes = [...new Set(
            waterData.filter((d) => d.Date?.startsWith(nextDate ?? "")).map((d) => d.Date?.split(" ")[1] ?? "")
          )].sort();
          return nextTimes[0] ?? null;
        }

        clearInterval(intervalRef.current!);
        setIsPlaying(false);
        return null;
      });
    }, 400);
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // อัปเดตระดับน้ำ (วิธีเก่า: map ด้วย normalized index)
  useEffect(() => {
    if (!selectedDate || !selectedTime || waterData.length === 0 || profileData.length === 0) return;

    const fullTime = `${selectedDate} ${selectedTime}`;
    const filtered = waterData.filter((d) => d.Date === fullTime);

    if (filtered.length === 0) return;

    const reversedFiltered = [...filtered].reverse(); // เหมือนโค้ดเก่า

    const maxKM = Math.max(...profileData.map((d) => d.KM));
    const minKM = Math.min(...profileData.map((d) => d.KM));

    setProfileData((prev) =>
      prev.map((d) => {
        const normalized = (d.KM - minKM) / (maxKM - minKM);
        const index = Math.round((1 - normalized) * (reversedFiltered.length - 1));
        const level = reversedFiltered[index]?.WaterLevel ?? null;
        return { ...d, WaterLevel: level };
      })
    );
  }, [selectedDate, selectedTime, waterData, profileData.length]);
  
    const bgColor = isDark ? "#1e2533" : "#ffffff";           // พื้นหลังกราฟ
    const textColor = isDark ? "#e2e8f0" : "#334155";         // ตัวอักษรหลัก
    const gridColor = isDark ? "#334155" : "#e2e8f0";         // เส้น grid

  const chartOptions = {
    chart: {
      type: "line" as "line",
      toolbar: { show: false },
      background: bgColor,
        fontFamily: "Prompt",
        foreColor: textColor,
      zoom: {
        enabled: true, // ปิดการซูม
      },
    },
    xaxis: {
        type: "numeric" as "numeric",
        categories: profileData.map(d => d.KM),
        title: { text: "ระยะทาง (กม.)", style: { color: textColor } },
        labels: { style: { colors: textColor } },
        axisBorder: { show: false },
        axisTicks: { color: gridColor },
        },
    yaxis: {
      labels: {
        formatter: function (val: any) {
          return (val).toFixed(2).toLocaleString(); // แสดงค่าจริง
        },
        style: {
          fontSize: '1.6vh',
        },
      },
      title: {
        text: 'ระดับ (ม.รทก.)',
        style: {
          fontSize: '1.6vh',
        },
      },
    },
    tooltip: {
      theme: isDark ? "dark" : "light",
      enabled: true,
      shared: true,
      y: {
        formatter: function (val: number) {
          return (val).toFixed(2).toLocaleString() + " ม.รทก.";
        },
      },
      x: {
        formatter: function (val: number) {
          let province = "";

          if (val >= 1 && val <= 70) {
            province = "จ.สระบุรี";
          } else if (val > 70 && val <= 215) {
            province = "จ.สุพรรณบุรี";
          } else if (val > 215 && val <= 275) {
          province = "จ.นครปฐม";
          } else if (val > 275 && val <= 320) {
          province = "จ.สมุทรสาคร";
          } else {
            province = "นอกเขตที่กำหนด";
          }
          return `ระยะทาง: ${val.toFixed(2)} กม. (${province})`;
        },
      },
    },
    legend: {
        labels: { colors: textColor },
      },
    annotations: {
      xaxis: [        
              {
                x: 0, // ตำแหน่งในแกน X ที่ต้องการเริ่มพื้นที่
                x2: 70, // ตำแหน่งในแกน X ที่ต้องการสิ้นสุดพื้นที่
                borderColor: '#FF0000', // สีของเส้นขอบ
                fillColor: '#FF0000', // สีพื้นหลังของพื้นที่
                opacity: 0.1, // ความโปร่งใส
                zIndex: -1,
                label: {
                  // text: "พื้นที่ที่ต้องการไฮไลต์",
                  style: {
                    color: '#ffffff',
                    background: '#FF0000',
                    fontSize: '12px',
                  },
                },
              },
              {
                x: 70, // ตำแหน่งในแกน X ที่ต้องการเริ่มพื้นที่
                x2: 215, // ตำแหน่งในแกน X ที่ต้องการสิ้นสุดพื้นที่
                borderColor: '#ff4343', // สีของเส้นขอบ
                fillColor: '#ff4343', 
                opacity: 0.1, // ความโปร่งใส
                zIndex: -1,
                label: {
                  // text: "พื้นที่ที่ต้องการไฮไลต์",
                  style: {
                    color: '#ffffff',
                    background: '#FF0000',
                    fontSize: '12px',
                  },
                },
              },
              {
                x: 215, // ตำแหน่งในแกน X ที่ต้องการเริ่มพื้นที่
                x2: 275, // ตำแหน่งในแกน X ที่ต้องการสิ้นสุดพื้นที่
                borderColor: '#FF0000', // สีของเส้นขอบ
                fillColor: '#FF0000', 
                opacity: 0.1, // ความโปร่งใส
                zIndex: -1,
                label: {
                  // text: "พื้นที่ที่ต้องการไฮไลต์",
                  style: {
                    color: '#ffffff',
                    background: '#FF0000',
                    fontSize: '12px',
                  },
                },
              },
              {
                x: 275, // ตำแหน่งในแกน X ที่ต้องการเริ่มพื้นที่
                x2: 318, // ตำแหน่งในแกน X ที่ต้องการสิ้นสุดพื้นที่
                borderColor: '#ff4343', // สีของเส้นขอบ
                fillColor: '#ff4343', // สีพื้นหลังของพื้นที่
                opacity: 0.1, // ความโปร่งใส
                zIndex: -1,
                label: {
                  // text: "พื้นที่ที่ต้องการไฮไลต์",
                  style: {
                    color: '#ffffff',
                    background: '#FF0000',
                    fontSize: '12px',
                  },
                },
              },
              {
                  x: 2, // ตำแหน่ง x
                  borderColor: '#000',
                  borderWidth: 0,
                  label: {            
                      offsetY: -60,      
                      offsetX: 15,                      
                      borderColor: '#66B2FF',
                      position: "center", // ✅ ทำให้ข้อความชิดด้านล่าง                      
                      style: {
                          fontSize: '17px',
                          color: '#fff',
                          background: '#66B2FF',
                      },
                      text: 'ปตร.พลเทพ',
                  }
              },
              {
                  x: 29.45,
                  borderColor: '#000',
                  borderWidth: 0,
                  label: {                     
                      position: "center", // ✅ ทำให้ข้อความชิดด้านล่าง
                      offsetY: -40,
                      offsetX: 15,                      
                      style: {
                          fontSize: '19px',
                          color: '#fff',
                          background: '#66B2FF',                          
                      },
                      text: 'ปตร.ท่าโบสถ์',
                  }
              },
              {
                x: 82,
                borderColor: '#000',
                borderWidth: 0,
                label: {                     
                    position: "center", // ✅ ทำให้ข้อความชิดด้านล่าง      
                    offsetX: 15,                       
                    style: {
                        fontSize: '16px',
                        color: '#fff',
                        background: '#66B2FF',                          
                    },
                    text: 'ปตร.ชลมาร์คพิจารณ์',
                }
            },
            {
              x: 118.7,
              borderColor: '#000',
              borderWidth: 0,
              label: {                     
                  position: "center", // ✅ ทำให้ข้อความชิดด้านล่าง
                  offsetY: 35,        
                  offsetX: 15,                       
                  style: {
                      fontSize: '18px',
                      color: '#fff',
                      background: '#66B2FF',                          
                  },
                  text: 'ปตร.โพธิ์พระยา',
              }
          },
           ///////////////////// Station Point /////////////////////////
          {
            x: 124, // วันที่สำหรับแสดงจุด annotation
            y: 8, // ค่าของ Y สำหรับแสดงจุด annotation
            borderColor: '#FF0033',
            borderWidth: 1,
            label: {
                show: true,
                offsetY: 120,
                offsetX: 0,
                style: {
                    fontSize: '1rem',
                    color: '#fff',
                    background: '#FF0033',
                },
                text: 'T.10' // ข้อความสำหรับจุด annotation
            }
          },
          {
            x: 175, // วันที่สำหรับแสดงจุด annotation
            y: 7, // ค่าของ Y สำหรับแสดงจุด annotation
               borderColor: '#FF0033',
            borderWidth: 1,
            label: {
                show: true,
                offsetY: 120,
                offsetX: 0,
                style: {
                    fontSize: '1rem',
                    color: '#fff',
                    background: '#FF0033',
                },
                text: 'T.13' // ข้อความสำหรับจุด annotation
            }
        },
        {
          x: 193, // วันที่สำหรับแสดงจุด annotation
          y: 8, // ค่าของ Y สำหรับแสดงจุด annotation
              borderColor: '#FF0033',
            borderWidth: 1,
            label: {
                show: true,
                offsetY: 120,
                offsetX: 0,
              style: {
                  fontSize: '1rem',
                  color: '#fff',
                  background: '#FF0033',
              },
              text: 'T.15' // ข้อความสำหรับจุด annotation
          }
        },
        {
          x: 234, // วันที่สำหรับแสดงจุด annotation
          y: 6, // ค่าของ Y สำหรับแสดงจุด annotation
           borderColor: '#FF0033',
            borderWidth: 1,
            label: {
                show: true,
                offsetY: 120,
                offsetX: 0,
              style: {
                  fontSize: '1rem',
                  color: '#fff',
                  background: '#FF0033',
              },
              text: 'T.1' // ข้อความสำหรับจุด annotation
          }
        },
        {
            x: 263, // วันที่สำหรับแสดงจุด annotation
            y: 4.5, // ค่าของ Y สำหรับแสดงจุด annotation
               borderColor: '#FF0033',
            borderWidth: 1,
            label: {
                show: true,
                offsetY: 120,
                offsetX: 0,
                style: {
                    fontSize: '1rem',
                    color: '#fff',
                    background: '#FF0033',
                },
                text: 'T.14' // ข้อความสำหรับจุด annotation
            }
        },
      ],
    points: [ // นำมาไว้ใน annotations
        {
          x: 35, // ตำแหน่งในแกน X
          y: 35, // ค่าของ Y
          marker: {
            size: 0, // ทำให้จุดใหญ่ขึ้นเพื่อมองเห็นง่าย
          },
          label: {
            show: true,
            style: {
              fontSize: '1rem',
              fontWeight: 'bold', // ทำให้ตัวหนา
              color: '#000',
            },
            text: 'จ.ชัยนาท', // ข้อความที่ต้องการแสดง
          },
        },
        {
          x: 135, // ตำแหน่งในแกน X
          y: 35, // ค่าของ Y
          marker: {
            size: 0, // ทำให้จุดใหญ่ขึ้นเพื่อมองเห็นง่าย
          },
          label: {
            show: true,
            style: {
              fontSize: '1rem',
              fontWeight: 'bold', // ทำให้ตัวหนา
              color: '#000',
            },
            text: 'จ.สุพรรณบุรี', // ข้อความที่ต้องการแสดง
          },
        },
        {
          x: 245, // ตำแหน่งในแกน X
          y: 35, // ค่าของ Y
          marker: {
            size: 0, // ทำให้จุดใหญ่ขึ้นเพื่อมองเห็นง่าย
          },
          label: {
            show: true,
            style: {
              fontSize: '1rem',
              fontWeight: 'bold', // ทำให้ตัวหนา
              color: '#000',
            },
            text: 'จ.นครปฐม', // ข้อความที่ต้องการแสดง
          },
        },
        {
          x: 298, // ตำแหน่งในแกน X
          y: 35, // ค่าของ Y
          marker: {
            size: 0, // ทำให้จุดใหญ่ขึ้นเพื่อมองเห็นง่าย
          },
          label: {
            show: true,
            style: {
              fontSize: '1rem',
              fontWeight: 'bold', // ทำให้ตัวหนา
              color: '#000',
            },
            text: 'จ.สมุทรสาคร', // ข้อความที่ต้องการแสดง
          },
        },
      {
        x: 30, // ตำแหน่งในแกน X
        y: -10, // ค่าของ Y
        marker: { size: 0 }, // ซ่อน marker
        label: {
          show: true,
          style: {
            color: '#skyblue',
            fontSize: '1rem',
            fontWeight: 'bold',
          },
          text: '→→→ ทิศทางน้ำไหล →→→', // ใช้ลูกศร →  
          offsetY: -20, // ขยับขึ้น
          offsetX: 10, 
        },
      },
      ],
    },
    stroke: {
      width: [2, 2, 2, 2],
      curve: "smooth" as "smooth",
      dashArray: [0, 0, 0, 0],
    },
    colors: ["#744111", "orange", "green","#007bff" ],
    fill: {
      gradient: {
        shade: "light",
        type: "vertical",
        shadeIntensity: 1,
        opacityFrom: 1,
        opacityTo: 1,
        stops: [0, 100],
        colorStops: [
          [
            { offset: 0, color: "#007bff", opacity: 1 }, // สีดำด้านบน
            { offset: 100, color: "#007bff", opacity: 1 }, // สีเทาด้านล่าง
          ],
          [
            { offset: 0, color: "#925a25", opacity: 1 }, // สีดำด้านบน
            { offset: 100, color: "#744111", opacity: 1 }, // สีเทาด้านล่าง
          ],
        ],
      },
    },
  };
  const series = useMemo(() => {
    if (profileData.length === 0) return [];

    return [
      { name: "Ground", data: profileData.map((d) => d.Ground) },
      { name: "Left Bank", data: profileData.map((d) => d.LOB) },
      { name: "Right Bank", data: profileData.map((d) => d.ROB) },
      {
        name: "ระดับน้ำ",
        data: profileData.map((d) => d.WaterLevel ?? null),
        type: "area",
      },
    ];
  }, [profileData]);

  if (loading) return <CenteredLoading />;

  return (
    <Box>
        <Typography gutterBottom sx={{ ...titleStyle, fontWeight: "bold" }}>
              รูปตัดตามยาวแม่น้ำท่าจีน (ปตร.พลเทพ - ทะเลอ่าวไทย)
        </Typography>

      <Typography
        variant="subtitle1"
        sx={{
          textAlign: "center",
          fontFamily: "Prompt",
          color: "text.secondary",
          mb: 2,
          fontSize: { xs: "0.95rem", sm: "1.1rem" },
        }}
      >
        ณ เวลา {formatThaiDateTime(selectedDate && selectedTime ? `${selectedDate} ${selectedTime}` : null)}
      </Typography>

      {/* Controls */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "center",
          alignItems: "center",
          gap: { xs: 1.5, sm: 2 },
          mb: 3,
          flexWrap: "wrap",
        }}
      >
        <Button
          variant="outlined"
          size="small"
          onClick={() => setSelectedDate(dates[dates.indexOf(selectedDate ?? "") - 1] ?? null)}
          disabled={!selectedDate || dates.indexOf(selectedDate) <= 0}
        >
          <ArrowBack fontSize="small" sx={{ mr: 0.5 }} />
          ก่อนหน้า
        </Button>

        <Select
          value={selectedDate ?? ""}
          onChange={(e) => setSelectedDate(e.target.value as string)}
          size="small"
          sx={{ minWidth: 160 }}
        >
          {dates.map((day) => (
            <MenuItem key={day} value={day}>
              {formatThaiDay(day ?? '')}
            </MenuItem>
          ))}
        </Select>

        <Select
          value={selectedTime ?? ""}
          onChange={(e) => setSelectedTime(e.target.value as string)}
          disabled={!selectedDate}
          size="small"
          sx={{ minWidth: 140 }}
        >
          {uniqueTimes.map((time) => (
            <MenuItem key={time} value={time}>
              {time}
            </MenuItem>
          ))}
        </Select>

        <Button
          variant="contained"
          color={isPlaying ? "error" : "success"}
          onClick={handlePlay}
        >
          {isPlaying ? "หยุด" : "เล่น"}
        </Button>

        <Button
          variant="outlined"
          size="small"
          onClick={() => setSelectedDate(dates[dates.indexOf(selectedDate ?? "") + 1] ?? null)}
          disabled={!selectedDate || dates.indexOf(selectedDate) >= dates.length - 1}
        >
          ถัดไป
          <ArrowForward fontSize="small" sx={{ ml: 0.5 }} />
        </Button>
      </Box>

      <Box sx={{ width: "100%", height: chartHeight }}>
        {profileData.length > 0 && selectedDate && selectedTime ? (
          <ReactApexChart options={chartOptions} series={series} type="line" height="100%" />
        ) : (
          <Box sx={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Typography>ไม่มีข้อมูลในช่วงเวลานี้</Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default LongProfileChart;