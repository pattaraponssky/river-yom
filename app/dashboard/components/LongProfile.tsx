"use client";

import React, { useState, useEffect, useMemo, useRef, use } from "react";
import Papa from "papaparse";
import { Box, Button, MenuItem, Select, Typography } from "@mui/material";
import { ArrowBack, ArrowForward } from "@mui/icons-material";
import CenteredLoading from "@/components/Layout/CenteredLoading";
import { Path_URL, formatThaiDateTime, formatThaiDay } from "@/lib/utility";
import { titleStyle } from "@/theme/style";
import dynamic from "next/dynamic";

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

const ApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
  loading: () => <CenteredLoading />,
});

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

            setProfileData(parsed);

            setLoading(false);
          },
        });
      })
      .catch((err) => {
        console.error("Load profile CSV error:", err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!selectedDate || !selectedTime || waterData.length === 0 || profileData.length === 0)
      return;

    const fullTime = `${selectedDate} ${selectedTime}`;
    const filtered = waterData.filter((d) => d.Date === fullTime);

    if (filtered.length === 0) return;

    const reversedFiltered = [...filtered].reverse();

    const maxKM = Math.max(...profileData.map((d) => d.KM));
    const minKM = Math.min(...profileData.map((d) => d.KM));

    setProfileData((prev) =>
      prev.map((d) => {
        const normalized = (d.KM - minKM) / (maxKM - minKM);
        const index = Math.round((1 - normalized) * (reversedFiltered.length - 1));

        // ดึงระดับน้ำเดิม
        const originalLevel = reversedFiltered[index]?.WaterLevel ?? null;

        // เพิ่ม +50 ให้ทุกค่า (ถ้าเป็น null ก็ยังคง null)
        const adjustedLevel = originalLevel !== null ? originalLevel + 50 : null;

        return { ...d, WaterLevel: adjustedLevel };
      })
    );
  }, [selectedDate, selectedTime, waterData, profileData.length]);

  // unique days & times
  const dates = useMemo(() => {
    return [...new Set(waterData.map((d) => d.Date?.split(" ")[0]).filter(Boolean))].sort();
  }, [waterData]);

  const uniqueTimes = useMemo(() => {
    if (!selectedDate) return [];
    return [
      ...new Set(
        waterData
          .filter((d) => d.Date?.startsWith(selectedDate))
          .map((d) => d.Date?.split(" ")[1] ?? "")
      ),
    ].sort();
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
    if (
      selectedDate &&
      uniqueTimes.length > 0 &&
      (!selectedTime || !uniqueTimes.includes(selectedTime))
    ) {
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
          const nextTimes = [
            ...new Set(
              waterData
                .filter((d) => d.Date?.startsWith(nextDate ?? ""))
                .map((d) => d.Date?.split(" ")[1] ?? "")
            ),
          ].sort();
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

  // useEffect(() => {
  //   if (!selectedDate || !selectedTime || waterData.length === 0 || profileData.length === 0)
  //     return;

  //   const fullTime = `${selectedDate} ${selectedTime}`;
  //   const filtered = waterData.filter((d) => d.Date === fullTime);

  //   if (filtered.length === 0) return;

  //   const reversedFiltered = [...filtered].reverse();

  //   const maxKM = Math.max(...profileData.map((d) => d.KM));
  //   const minKM = Math.min(...profileData.map((d) => d.KM));

  //   setProfileData((prev) =>
  //     prev.map((d) => {
  //       const normalized = (d.KM - minKM) / (maxKM - minKM);
  //       const index = Math.round((1 - normalized) * (reversedFiltered.length - 1));

  //       // ดึงระดับน้ำเดิม
  //       const originalLevel = reversedFiltered[index]?.WaterLevel ?? null;

  //       // เพิ่ม +50 ให้ทุกค่า (ถ้า null ก็ยังคง null)
  //       const adjustedLevel = originalLevel !== null ? originalLevel + 35 : null;

  //       return { ...d, WaterLevel: adjustedLevel };
  //     })
  //   );
  // }, [selectedDate, selectedTime, waterData, profileData.length]);

  const bgColor = isDark ? "#1e2533" : "#ffffff"; // พื้นหลังกราฟ
  const textColor = isDark ? "#e2e8f0" : "#334155"; // ตัวอักษรหลัก
  const gridColor = isDark ? "#334155" : "#e2e8f0"; // เส้น grid

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
      categories: profileData.map((d) => d.KM),
      title: { text: "ระยะทาง (กม.)", style: { color: textColor } },
      labels: { style: { colors: textColor } },
      axisBorder: { show: false },
      axisTicks: { color: gridColor },
    },
    yaxis: {
      labels: {
        formatter: function (val: any) {
          return val.toFixed(2).toLocaleString(); // แสดงค่าจริง
        },
        style: {
          fontSize: "1.6vh",
        },
      },
      title: {
        text: "ระดับ (ม.รทก.)",
        style: {
          fontSize: "1.6vh",
        },
      },
    },
    tooltip: {
      theme: isDark ? "dark" : "light",
      enabled: true,
      shared: true,
      y: {
        formatter: function (val: number) {
          return val.toFixed(2).toLocaleString() + " ม.รทก.";
        },
      },
      x: {
        formatter: function (val: number) {
          let province = "";

          if (val >= 1 && val <= 60) {
            province = "จ.สุโขทัย";
          } else if (val > 60 && val <= 95) {
            province = "จ.พิษณุโลก";
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
          x2: 60, // ตำแหน่งในแกน X ที่ต้องการสิ้นสุดพื้นที่
          borderColor: "#FF0000", // สีของเส้นขอบ
          fillColor: "#FF0000", // สีพื้นหลังของพื้นที่
          opacity: 0.1, // ความโปร่งใส
          zIndex: -1,
          label: {
            // text: "พื้นที่ที่ต้องการไฮไลต์",
            style: {
              color: "#ffffff",
              background: "#FF0000",
              fontSize: "12px",
            },
          },
        },
        {
          x: 60, // ตำแหน่งในแกน X ที่ต้องการเริ่มพื้นที่
          x2: 120, // ตำแหน่งในแกน X ที่ต้องการสิ้นสุดพื้นที่
          borderColor: "#ff4343", // สีของเส้นขอบ
          fillColor: "#ff4343",
          opacity: 0.1, // ความโปร่งใส
          zIndex: -1,
          label: {
            // text: "พื้นที่ที่ต้องการไฮไลต์",
            style: {
              color: "#ffffff",
              background: "#FF0000",
              fontSize: "12px",
            },
          },
        },
        {
          x: 120, // ตำแหน่งในแกน X ที่ต้องการเริ่มพื้นที่
          x2: 150, // ตำแหน่งในแกน X ที่ต้องการสิ้นสุดพื้นที่
          borderColor: "#FF0000", // สีของเส้นขอบ
          fillColor: "#FF0000",
          opacity: 0.1, // ความโปร่งใส
          zIndex: -1,
          label: {
            // text: "พื้นที่ที่ต้องการไฮไลต์",
            style: {
              color: "#ffffff",
              background: "#FF0000",
              fontSize: "12px",
            },
          },
        },
        {
          x: 62, // ตำแหน่ง x
          borderColor: "#000",
          borderWidth: 0,
          label: {
            offsetY: 36,
            offsetX: 15,
            borderColor: "#66B2FF",
            position: "center", // ✅ ทำให้ข้อความชิดด้านล่าง
            style: {
              fontSize: "17px",
              color: "#fff",
              background: "#66B2FF",
            },
            text: "ปตร.คลองปลากด",
          },
        },
        {
          x: 66,
          borderColor: "#000",
          borderWidth: 0,
          label: {
            position: "center", // ✅ ทำให้ข้อความชิดด้านล่าง
            offsetY: 50,
            offsetX: 15,
            style: {
              fontSize: "18px",
              color: "#fff",
              background: "#66B2FF",
            },
            text: "ปตร.วังสะตือ",
          },
        },
        {
          x: 92,
          borderColor: "#000",
          borderWidth: 0,
          label: {
            position: "center", // ✅ ทำให้ข้อความชิดด้านล่าง
            offsetY: 70,
            style: {
              fontSize: "16px",
              color: "#fff",
              background: "#66B2FF",
            },
            text: "ปตร.ท่านางงาม",
          },
        },
        ///////////////////// Station Point /////////////////////////
        {
          x: 1, // วันที่สำหรับแสดงจุด annotation
          y: 8, // ค่าของ Y สำหรับแสดงจุด annotation
          borderColor: "#FF0033",
          borderWidth: 1,
          label: {
            show: true,
            offsetY: 120,
            offsetX: 0,
            style: {
              fontSize: "1rem",
              color: "#fff",
              background: "#FF0033",
            },
            text: "Y.4", // ข้อความสำหรับจุด annotation
          },
        },
        {
          x: 47, // วันที่สำหรับแสดงจุด annotation
          y: 7, // ค่าของ Y สำหรับแสดงจุด annotation
          borderColor: "#FF0033",
          borderWidth: 1,
          label: {
            show: true,
            offsetY: 120,
            offsetX: 0,
            style: {
              fontSize: "1rem",
              color: "#fff",
              background: "#FF0033",
            },
            text: "Y.15", // ข้อความสำหรับจุด annotation
          },
        },
        {
          x: 87, // วันที่สำหรับแสดงจุด annotation
          y: 8, // ค่าของ Y สำหรับแสดงจุด annotation
          borderColor: "#FF0033",
          borderWidth: 1,
          label: {
            show: true,
            offsetY: 120,
            offsetX: 0,
            style: {
              fontSize: "1rem",
              color: "#fff",
              background: "#FF0033",
            },
            text: "Y.50", // ข้อความสำหรับจุด annotation
          },
        },
        {
          x: 93, // วันที่สำหรับแสดงจุด annotation
          y: -15, // ค่าของ Y สำหรับแสดงจุด annotation
          borderColor: "#FF0033",
          borderWidth: 1,
          label: {
            show: true,
            offsetY: 75,
            offsetX: 10,
            style: {
              fontSize: "1rem",
              color: "#fff",
              background: "#FF0033",
            },
            text: "Y.16", // ข้อความสำหรับจุด annotation
          },
        },
        {
          x: 95, // วันที่สำหรับแสดงจุด annotation
          y: 15, // ค่าของ Y สำหรับแสดงจุด annotation
          borderColor: "#FF0033",
          borderWidth: 1,
          label: {
            show: true,
            offsetY: 55,
            offsetX: 30,
            style: {
              fontSize: "1rem",
              color: "#fff",
              background: "#FF0033",
            },
            text: "Y.64", // ข้อความสำหรับจุด annotation
          },
        },
        {
          x: 120, // วันที่สำหรับแสดงจุด annotation
          y: 15, // ค่าของ Y สำหรับแสดงจุด annotation
          borderColor: "#FF0033",
          borderWidth: 1,
          label: {
            show: true,
            offsetY: 55,
            offsetX: 0,
            style: {
              fontSize: "1rem",
              color: "#fff",
              background: "#FF0033",
            },
            text: "Y.51", // ข้อความสำหรับจุด annotation
          },
        },
        {
          x: 141, // วันที่สำหรับแสดงจุด annotation
          y: 15, // ค่าของ Y สำหรับแสดงจุด annotation
          borderColor: "#FF0033",
          borderWidth: 1,
          label: {
            show: true,
            offsetY: 55,
            offsetX: 0,
            style: {
              fontSize: "1rem",
              color: "#fff",
              background: "#FF0033",
            },
            text: "Y.17", // ข้อความสำหรับจุด annotation
          },
        },
      ],
      points: [
        // นำมาไว้ใน annotations
        {
          x: 30, // ตำแหน่งในแกน X
          y: 50, // ค่าของ Y
          marker: {
            size: 0, // ทำให้จุดใหญ่ขึ้นเพื่อมองเห็นง่าย
          },
          label: {
            show: true,
            style: {
              fontSize: "1rem",
              fontWeight: "bold", // ทำให้ตัวหนา
              color: "#000",
            },
            text: "จ.สุโขทัย", // ข้อความที่ต้องการแสดง
          },
        },
        {
          x: 90, // ตำแหน่งในแกน X
          y: 50, // ค่าของ Y
          marker: {
            size: 0, // ทำให้จุดใหญ่ขึ้นเพื่อมองเห็นง่าย
          },
          label: {
            show: true,
            style: {
              fontSize: "1rem",
              fontWeight: "bold", // ทำให้ตัวหนา
              color: "#000",
            },
            text: "จ.พิษณุโลก", // ข้อความที่ต้องการแสดง
          },
        },
        {
          x: 130, // ตำแหน่งในแกน X
          y: 50, // ค่าของ Y
          marker: {
            size: 0, // ทำให้จุดใหญ่ขึ้นเพื่อมองเห็นง่าย
          },
          label: {
            show: true,
            style: {
              fontSize: "1rem",
              fontWeight: "bold", // ทำให้ตัวหนา
              color: "#000",
            },
            text: "จ.พิจิตร", // ข้อความที่ต้องการแสดง
          },
        },
        {
          x: 15, // ตำแหน่งในแกน X
          y: 25, // ค่าของ Y
          marker: { size: 0 }, // ซ่อน marker
          label: {
            show: true,
            style: {
              color: "#007bff",
              fontSize: "1rem",
              fontWeight: "bold",
            },
            text: "→→→ ทิศทางน้ำไหล →→→", // ใช้ลูกศร →
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
    colors: ["#007bff", "#744111", "orange", "green"],
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
      {
        name: "ระดับน้ำ",
        data: profileData.map((d) => d.WaterLevel ?? null),
        type: "area",
      },
      { name: "Ground", data: profileData.map((d) => d.Ground), type: "area" },
      { name: "Left Bank", data: profileData.map((d) => d.LOB) },
      { name: "Right Bank", data: profileData.map((d) => d.ROB) },
    ];
  }, [profileData]);

  if (loading) return <CenteredLoading />;

  return (
    <Box>
      <Typography gutterBottom sx={{ ...titleStyle, fontWeight: "bold" }}>
        รูปตัดตามยาวแม่น้ำยมฝั่งขวา (Y.4 - Y.17)
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
        ณ เวลา{" "}
        {formatThaiDateTime(
          selectedDate && selectedTime ? `${selectedDate} ${selectedTime}` : null
        )}
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
          variant="contained"
          size="small"
          onClick={() => setSelectedDate(dates[dates.indexOf(selectedDate ?? "") - 1] ?? null)}
          disabled={!selectedDate || dates.indexOf(selectedDate) <= 0}
          sx={{
            display: { xs: "none", sm: "block" },
            fontFamily: "Prompt",
            fontSize: { xs: "0.8rem", sm: "1rem" },
            bgcolor: "#1976d2",
            "&:hover": { bgcolor: "#115293" },
            borderRadius: "20px",
            paddingX: { xs: "8px", sm: "16px" },
            width: { xs: "30%", sm: "auto" },
            mb: { xs: 2, sm: 0 },
          }}
        >
          <ArrowBack fontSize="small" sx={{ mr: 0.5 }} />
          ก่อนหน้า
        </Button>

        <Select
          value={selectedDate ?? ""}
          onChange={(e) => setSelectedDate(e.target.value as string)}
          size="medium"
          sx={{
            fontFamily: "Prompt",
            width: { xs: "48%", sm: "auto" }, // ปรับให้ Dropdown อยู่คู่กัน
            fontSize: { xs: "0.9rem", sm: "1rem" }, // ขยาย Select ให้เต็มหน้าจอในขนาดเล็ก
          }}
        >
          {dates.map((day) => (
            <MenuItem key={day} value={day}>
              {formatThaiDay(day ?? "")}
            </MenuItem>
          ))}
        </Select>

        <Select
          value={selectedTime ?? ""}
          onChange={(e) => setSelectedTime(e.target.value as string)}
          disabled={!selectedDate}
          size="medium"
          sx={{
            fontFamily: "Prompt",
            width: { xs: "48%", sm: "auto" }, // ปรับให้ Dropdown อยู่คู่กัน
            fontSize: { xs: "0.9rem", sm: "1rem" }, // ขยาย Select ให้เต็มหน้าจอในขนาดเล็ก
          }}
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
          sx={{
            fontFamily: "Prompt",
            fontSize: { xs: "0.8rem", sm: "1rem" },
            bgcolor: isPlaying ? "#e53935" : "#43a047",
            "&:hover": { bgcolor: isPlaying ? "#b71c1c" : "#2e7d32" },
            borderRadius: "20px",
            paddingX: { xs: "8px", sm: "16px" },
            width: { xs: "25%", sm: "auto" }, // ให้ปุ่มเต็มหน้าจอในขนาดเล็ก
            mb: { xs: 2, sm: 0 }, // เพิ่ม margin-bottom ในขนาดเล็ก
            color: "white",
          }}
        >
          {isPlaying ? "หยุด" : "เล่น"}
        </Button>

        <Button
          variant="contained"
          size="small"
          onClick={() => setSelectedDate(dates[dates.indexOf(selectedDate ?? "") + 1] ?? null)}
          disabled={!selectedDate || dates.indexOf(selectedDate) >= dates.length - 1}
          sx={{
            fontFamily: "Prompt",
            fontSize: { xs: "0.8rem", sm: "1rem" },
            bgcolor: "#1976d2",
            "&:hover": { bgcolor: "#115293" },
            borderRadius: "20px",
            paddingX: { xs: "8px", sm: "16px" },
            width: { xs: "30%", sm: "auto" }, // ให้ปุ่มเต็มหน้าจอในขนาดเล็ก
            mb: { xs: 2, sm: 0 }, // เพิ่ม margin-bottom ในขนาดเล็ก
          }}
        >
          ถัดไป
          <ArrowForward fontSize="small" sx={{ ml: 0.5 }} />
        </Button>
      </Box>

      <Box sx={{ width: "100%", height: chartHeight }}>
        {profileData.length > 0 && selectedDate && selectedTime ? (
          <ApexChart options={chartOptions} series={series} type="line" height="100%" />
        ) : (
          <Box
            sx={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <Typography>ไม่มีข้อมูลในช่วงเวลานี้</Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default LongProfileChart;
