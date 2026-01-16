// // components/Data/UniversalChart.tsx
// import React, { useState } from 'react';
// import ApexCharts from 'react-apexcharts';
// import {
//   Box,
//   Button,
//   Menu,
//   MenuItem,
//   Typography,
// } from '@mui/material';
// import { ArrowDropDown as ArrowDropDownIcon } from '@mui/icons-material';
// import DownloadIcon from '@mui/icons-material/Download';
// import TableChartIcon from '@mui/icons-material/TableChart';
// import TextSnippetIcon from '@mui/icons-material/TextSnippet';
// import html2canvas from 'html2canvas';
// import jsPDF from 'jspdf';

// const BASE_YEAR = 2000;

// // === กำหนด Type ให้ชัดเจน ===
// type StationCode = 'T.1' | 'T.10' | 'T.13' | 'T.14' | 'T.15';
// type ReservoirCode = 'ks' | 'htd' | 'hkk' | 'ht' | 'hnl';

// type ChartType =
//   | 'flow_wl'
//   | 'flow_discharge'
//   | 'gate_wl_upper'
//   | 'gate_wl_lower'
//   | 'gate_discharge'
//   | 'rain'
//   | 'rain_sum'
//   | 'reservoir_main'
//   | 'reservoir_inflow'
//   | 'reservoir_outflow'
//   | 'sea_wl';

// interface UniversalChartProps {
//   data: { series: any[] };
//   type: ChartType;
//   height?: number;
//   sta_code?: StationCode;
//   res_code?: ReservoirCode;
// }

// // === Annotations ===
// const flowAnnotations: Record<StationCode, ApexAnnotations['yaxis']> = {
//   'T.1': [
//     { y: 1.50, borderColor: '#FF0000', label: { text: 'วิกฤต 1.50 ม.รทก.', style: { background: '#FF0000', color: '#fff' } } },
//     { y: 1.38, borderColor: '#FFD700', label: { text: 'เตือนภัย 1.38 ม.รทก.', style: { background: '#FFD700', color: '#000' } } },
//     { y: 1.25, borderColor: 'green', label: { text: 'เฝ้าระวัง 1.25 ม.รทก.', style: { background: 'green', color: '#fff' } } },
//   ],
//   'T.10': [
//     { y: 3.50, borderColor: '#FF0000', label: { text: 'วิกฤต 3.50 ม.รทก.' } },
//     { y: 3.20, borderColor: '#FFD700', label: { text: 'เตือนภัย 3.20 ม.รทก.' } },
//     { y: 2.90, borderColor: 'green', label: { text: 'เฝ้าระวัง 2.90 ม.รทก.' } },
//   ],
//   'T.13': [
//     { y: 2.40, borderColor: '#FF0000', label: { text: 'วิกฤต 2.40 ม.รทก.' } },
//     { y: 2.28, borderColor: '#FFD700', label: { text: 'เตือนภัย 2.28 ม.รทก.' } },
//     { y: 2.16, borderColor: 'green', label: { text: 'เฝ้าระวัง 2.16 ม.รทก.' } },
//   ],
//   'T.14': [
//     { y: 1.50, borderColor: '#FF0000', label: { text: 'วิกฤต 1.50 ม.รทก.' } },
//     { y: 1.35, borderColor: '#FFD700', label: { text: 'เตือนภัย 1.35 ม.รทก.' } },
//     { y: 1.20, borderColor: 'green', label: { text: 'เฝ้าระวัง 1.20 ม.รทก.' } },
//   ],
//   'T.15': [
//     { y: 1.80, borderColor: '#FF0000', label: { text: 'วิกฤต 1.80 ม.รทก.' } },
//     { y: 1.70, borderColor: '#FFD700', label: { text: 'เตือนภัย 1.70 ม.รทก.' } },
//     { y: 1.60, borderColor: 'green', label: { text: 'เฝ้าระวัง 1.60 ม.รทก.' } },
//   ],
// };

// const gateAnnotations: Record<StationCode, ApexAnnotations['yaxis']> = {
//   'T.1': [
//     { y: 1.70, borderColor: '#FF0000', label: { text: 'วิกฤต 1.70 ม.รทก.' } },
//     { y: 0.56, borderColor: '#FFD700', label: { text: 'เตือนภัย 0.56 ม.รทก.' } },
//     { y: -0.57, borderColor: 'green', label: { text: 'เฝ้าระวัง -0.57 ม.รทก.' } },
//   ],
//   'T.10': [
//     { y: 6.32, borderColor: '#FF0000', label: { text: 'วิกฤต 6.32 ม.รทก.' } },
//     { y: 5.47, borderColor: '#FFD700', label: { text: 'เตือนภัย 5.47 ม.รทก.' } },
//     { y: 4.61, borderColor: 'green', label: { text: 'เฝ้าระวัง 4.61 ม.รทก.' } },
//   ],
//   'T.13': [
//     { y: 2.69, borderColor: '#FF0000', label: { text: 'วิกฤต 2.69 ม.รทก.' } },
//     { y: 2.02, borderColor: '#FFD700', label: { text: 'เตือนภัย 2.02 ม.รทก.' } },
//     { y: 1.36, borderColor: 'green', label: { text: 'เฝ้าระวัง 1.36 ม.รทก.' } },
//   ],
//   'T.14': [
//     { y: 1.81, borderColor: '#FF0000', label: { text: 'วิกฤต 1.81 ม.รทก.' } },
//     { y: 0.75, borderColor: '#FFD700', label: { text: 'เตือนภัย 0.75 ม.รทก.' } },
//     { y: -0.31, borderColor: 'green', label: { text: 'เฝ้าระวัง -0.31 ม.รทก.' } },
//   ],
//   'T.15': [
//     { y: 2.71, borderColor: '#FF0000', label: { text: 'วิกฤต 2.71 ม.รทก.' } },
//     { y: 1.84, borderColor: '#FFD700', label: { text: 'เตือนภัย 1.84 ม.รทก.' } },
//     { y: 0.98, borderColor: 'green', label: { text: 'เฝ้าระวัง 0.98 ม.รทก.' } },
//   ],
// };

// const reservoirAnnotations: Record<ReservoirCode, ApexAnnotations['yaxis']> = {
//   ks: [
//     { y: 40, borderColor: '#CC3333', label: { text: 'ต่ำสุด 40 ล้าน ลบ.ม.' } },
//     { y: 299, borderColor: '#333399', label: { text: 'ปกติ 299 ล้าน ลบ.ม.' } },
//     { y: 390, borderColor: '#009966', label: { text: 'สูงสุด 390 ล้าน ลบ.ม.' } },
//   ],
//   htd: [
//     { y: 0.2, borderColor: '#CC3333', label: { text: 'ต่ำสุด 0.2 ล้าน ลบ.ม.' } },
//     { y: 2.8, borderColor: '#333399', label: { text: 'ปกติ 2.8 ล้าน ลบ.ม.' } },
//   ],
//   hkk: [
//     { y: 2.17, borderColor: '#CC3333', label: { text: 'ต่ำสุด 2.17 ล้าน ลบ.ม.' } },
//     { y: 52, borderColor: '#333399', label: { text: 'ปกติ 52 ล้าน ลบ.ม.' } },
//   ],
//   ht: [
//     { y: 3.7, borderColor: '#CC3333', label: { text: 'ต่ำสุด 3.7 ล้าน ลบ.ม.' } },
//     { y: 6.9, borderColor: '#333399', label: { text: 'ปกติ 6.9 ล้าน ลบ.ม.' } },
//     { y: 10.2, borderColor: '#009966', label: { text: 'สูงสุด 10.2 ล้าน ลบ.ม.' } },
//   ],
//   hnl: [
//     { y: 11.39, borderColor: '#CC3333', label: { text: 'ต่ำสุด 11.39 ล้าน ลบ.ม.' } },
//     { y: 11, borderColor: '#333399', label: { text: 'ปกติ 11 ล้าน ลบ.ม.' } },
//     { y: 15, borderColor: '#009966', label: { text: 'สูงสุด 15 ล้าน ลบ.ม.' } },
//   ],
// };

// // === Y-axis Range ===
// const flowYRange: Record<StationCode, { min: number; max: number }> = {
//   'T.1': { min: -10, max: 2 },
//   'T.10': { min: -2.5, max: 7 },
//   'T.13': { min: -4, max: 3 },
//   'T.14': { min: -9, max: 2 },
//   'T.15': { min: -6, max: 3 },
// };

// const reservoirYRange: Record<ReservoirCode, { min: number; max: number }> = {
//   ks: { min: 0, max: 400 },
//   htd: { min: 0, max: 4 },
//   hkk: { min: 0, max: 60 },
//   ht: { min: 0, max: 11 },
//   hnl: { min: 0, max: 16 },
// };

// // === Chart Title & Y-axis Title ===
// const chartTitles: Record<ChartType, { title: string; yTitle: string }> = {
//   flow_wl: { title: 'ระดับน้ำ', yTitle: 'ระดับน้ำ (ม.รทก.)' },
//   flow_discharge: { title: 'อัตราการไหล', yTitle: 'อัตราการไหล (ลบ.ม./วินาที)' },
//   gate_wl_upper: { title: 'ระดับน้ำเหนือ', yTitle: 'ระดับน้ำเหนือ (ม.รทก.)' },
//   gate_wl_lower: { title: 'ระดับน้ำท้าย', yTitle: 'ระดับน้ำท้าย (ม.รทก.)' },
//   gate_discharge: { title: 'อัตราการไหล', yTitle: 'อัตราการไหล (ลบ.ม./วินาที)' },
//   rain: { title: 'ปริมาณฝนรายวัน', yTitle: 'ปริมาณน้ำฝน (มม.)' },
//   rain_sum: { title: 'ปริมาณฝนสะสม', yTitle: 'ปริมาณน้ำฝนสะสม (มม.)' },
//   reservoir_main: { title: 'ปริมาณน้ำในอ่างเก็บน้ำ', yTitle: 'ปริมาณน้ำ (ล้าน ลบ.ม.)' },
//   reservoir_inflow: { title: 'น้ำไหลเข้าอ่าง', yTitle: 'ปริมาณน้ำไหลเข้า (ล้าน ลบ.ม.)' },
//   reservoir_outflow: { title: 'น้ำระบายออก', yTitle: 'ปริมาณน้ำระบาย (ล้าน ลบ.ม.)' },
//   sea_wl: { title: 'ระดับน้ำทะเล', yTitle: 'ระดับน้ำทะเล (ม.รทก.)' },
// };

// const UniversalChart: React.FC<UniversalChartProps> = ({
//   data,
//   type,
//   height = 380,
//   sta_code,
//   res_code,
// }) => {
//   const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

//   if (!data?.series || data.series.length === 0) {
//     return <Typography>ไม่มีข้อมูล</Typography>;
//   }

//   // ดึงชื่อและหน่วย
//   const { title, yTitle } = chartTitles[type];

//     // แก้ไขแล้ว — ปลอดภัย 100%   
//     let annotations: ApexAnnotations | undefined;

//     // Flow WL
//     if (type === 'flow_wl' && sta_code && sta_code in flowAnnotations) {
//     annotations = {
//         yaxis: flowAnnotations[sta_code].map((a) => ({
//         ...a,
//         borderWidth: 4,
//         strokeDashArray: 8,
//         label: {
//             ...a.label,
//             style: { fontSize: '12px', color: '#fff', background: a.borderColor },
//         },
//         })),
//     };
//     }

//     // Gate WL (upper / lower)
//     if ((type === 'gate_wl_upper' || type === 'gate_wl_lower') && sta_code && sta_code in gateAnnotations) {
//     annotations = {
//         yaxis: gateAnnotations[sta_code].map((a) => ({
//         ...a,
//         borderWidth: 4,
//         strokeDashArray: 8,
//         label: {
//             ...a.label,
//             style: { fontSize: '12px', color: '#fff', background: a.borderColor },
//         },
//         })),
//     };
//     }

//     // Reservoir
//     if (type === 'reservoir_main' && res_code && res_code in reservoirAnnotations) {
//     annotations = {
//         yaxis: reservoirAnnotations[res_code].map((a) => ({
//         ...a,
//         borderWidth: 4,
//         strokeDashArray: 8,
//         label: {
//             ...a.label,
//             style: { fontSize: '12px', color: '#fff', background: a.borderColor },
//         },
//         })),
//     };
//     }

//   // Y-axis range
//   let yMin: number | undefined;
//   let yMax: number | undefined;
//   if (type === 'flow_wl' && sta_code) {
//     yMin = flowYRange[sta_code].min;
//     yMax = flowYRange[sta_code].max;
//   }
//   if (type === 'reservoir_main' && res_code) {
//     yMin = reservoirYRange[res_code].min;
//     yMax = reservoirYRange[res_code].max;
//   }

//   const options: ApexCharts.ApexOptions = {
//     chart: {
//       zoom: { enabled: true },
//       fontFamily: 'Noto Sans Thai',
//       toolbar: { show: true },
//     },
//     title: {
//       text: title,
//       align: 'center',
//       style: { fontSize: '18px', fontWeight: 600 },
//     },
//     stroke: { width: 4, curve: 'smooth' },
//     xaxis: {
//       type: 'datetime',
//       min: new Date(`${BASE_YEAR}-01-01`).getTime(),
//       max: new Date(`${BASE_YEAR}-12-31`).getTime(),
//       labels: { format: type === 'sea_wl' ? 'dd MMM HH:mm' : 'dd MMM', datetimeUTC: false },
//     },
//     yaxis: {
//       min: yMin,
//       max: yMax,
//       decimalsInFloat: 2,
//       title: { text: yTitle, style: { fontSize: '14px' } },
//       labels: { formatter: (val) => val.toFixed(2) },
//     },
//     tooltip: {
//       shared: true,
//       intersect: false,
//       x: { format: type === 'sea_wl' ? 'dd MMM HH:mm' : 'dd MMM' },
//     },
//     colors: ['#3366FF', '#FF0033', '#00FF33', '#CD853F', '#FF9900', '#66CCFF', '#9933FF', '#009966', '#000000', '#333399'],
//     annotations,
//   };

//   const handleExport = async (format: 'png' | 'jpg' | 'pdf') => {
//     setAnchorEl(null);
//     const el = document.getElementById('chart-export-container');
//     if (!el) return;

//     const canvas = await html2canvas(el);
//     const imgData = format === 'jpg' ? canvas.toDataURL('image/jpeg', 0.95) : canvas.toDataURL('image/png');

//     if (format === 'pdf') {
//       const pdf = new jsPDF('landscape');
//       const width = pdf.internal.pageSize.getWidth();
//       const height = (canvas.height * width) / canvas.width;
//       pdf.addImage(imgData, 'PNG', 0, 0, width, height);
//       pdf.save(`${title.replace(/ /g, '_')}.pdf`);
//     } else {
//       const a = document.createElement('a');
//       a.href = imgData;
//       a.download = `${title.replace(/ /g, '_')}.${format}`;
//       a.click();
//     }
//   };

//   return (
//     <Box position="relative">
//       {/* ปุ่ม Export */}
//       <Box position="absolute" top={8} right={16} zIndex={10}>
//         <Button
//           sx={{ borderRadius: '8px', textTransform: 'none', px: 3 }}
//           variant="contained"
//           color="success"
//           endIcon={<ArrowDropDownIcon />}
//           onClick={(e) => setAnchorEl(e.currentTarget)}
//         >
//           Export
//         </Button>
//         <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
//           <MenuItem onClick={() => handleExport('png')}><TableChartIcon sx={{ mr: 1 }}/> PNG</MenuItem>
//           <MenuItem onClick={() => handleExport('jpg')}><DownloadIcon sx={{ mr: 1 }} /> JPG</MenuItem>
//           <MenuItem onClick={() => handleExport('pdf')}><TextSnippetIcon sx={{ mr: 1 }} /> PDF</MenuItem>
//         </Menu>
//       </Box>

//       {/* กราฟ */}
//       <Box id="chart-export-container" sx={{ pt: 6 }}>
//         <ApexCharts options={options} series={data.series} type="line" height={height} />
//       </Box>
//     </Box>
//   );
// };

// export default UniversalChart;