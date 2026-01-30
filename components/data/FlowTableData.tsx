// src/components/FlowExportTable.tsx
'use client';

import React, { useState, useMemo, useEffect } from "react";
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  Menu,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  useTheme,
} from "@mui/material";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import DownloadIcon from "@mui/icons-material/Download";
import TableChartIcon from "@mui/icons-material/TableChart";
import TextSnippetIcon from "@mui/icons-material/TextSnippet";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { HeaderCellStyle, getCellStyle } from '../../theme/style';

interface GroupedData {
  [year: string]: [number, number | null][];
}

interface Props {
  dischargeGroupedData?: GroupedData;
  wlGroupedData?: GroupedData;
  availableYears?: string[];
  mode: "daily" | "hourly";
}

const FlowExportTable: React.FC<Props> = ({
  dischargeGroupedData = {},
  wlGroupedData = {},
  mode,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedYear, setSelectedYear] = useState("ทั้งหมด");

  // ดึงปีจากข้อมูลทั้ง 2 ชุด
  const yearsFromData = useMemo(() => {
    const years = new Set<string>();
    Object.keys(dischargeGroupedData).forEach(y => years.add(y));
    Object.keys(wlGroupedData).forEach(y => years.add(y));
    return ['ทั้งหมด', ...Array.from(years).sort((a, b) => +a - +b)];
  }, [dischargeGroupedData, wlGroupedData]);

  // รีเซ็ตปีเมื่อข้อมูลเปลี่ยน
  useEffect(() => {
    if (!yearsFromData.includes(selectedYear)) {
      setSelectedYear("ทั้งหมด");
    }
  }, [yearsFromData, selectedYear]);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => setAnchorEl(null);

  // Format วันที่/เวลาเป็นภาษาไทย
  const formatThaiDateTime = (timestamp: number) => {
    const date = new Date(timestamp);
    if (mode === "hourly") {
      return date.toLocaleString('th-TH', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    return date.toLocaleDateString('th-TH', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  // รวมข้อมูลทั้งหมด + เติม null + เรียงตามเวลา
  const rows = useMemo(() => {
    const map = new Map<number, {
      timestamp: number;
      datetime: string;
      discharge: number | null;
      wl: number | null;
    }>();

    const processYear = (year: string, data: GroupedData | undefined, key: 'discharge' | 'wl') => {
      if (!data || !data[year]) return;
      data[year].forEach(([ts, value]) => {
        if (!map.has(ts)) {
          map.set(ts, {
            timestamp: ts,
            datetime: formatThaiDateTime(ts),
            discharge: null,
            wl: null,
          });
        }
        const row = map.get(ts)!;
        row[key] = value !== null && value !== undefined ? Number(value.toFixed(3)) : null;
      });
    };

    const yearsToProcess = selectedYear === 'ทั้งหมด'
      ? Object.keys({ ...dischargeGroupedData, ...wlGroupedData })
      : [selectedYear];

    yearsToProcess.forEach(year => {
      processYear(year, dischargeGroupedData, 'discharge');
      processYear(year, wlGroupedData, 'wl');
    });

    return Array.from(map.values()).sort((a, b) => a.timestamp - b.timestamp);
  }, [dischargeGroupedData, wlGroupedData, selectedYear, mode]);

  // Export Functions
  const exportToXLSX = () => {
    const data = rows.map(r => ({
      [mode === "hourly" ? "วันที่/เวลา" : "วันที่"]: r.datetime,
      "อัตราการไหล (ลบ.ม./วินาที)": r.discharge !== null ? r.discharge : '',
      "ระดับน้ำ (ม.รทก.)": r.wl !== null ? r.wl : '',
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Flow Data");
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([buf]), `flow_data_${mode}.xlsx`);
  };

  const exportToCSV = () => {
    const headers = mode === "hourly"
      ? ['วันที่/เวลา', 'อัตราการไหล (ลบ.ม./วินาที)', 'ระดับน้ำ (ม.รทก.)']
      : ['วันที่', 'อัตราการไหล (ลบ.ม./วินาที)', 'ระดับน้ำ (ม.รทก.)'];

    const csvRows = rows.map(r => [
      `"${r.datetime}"`,
      r.discharge !== null ? r.discharge : '',
      r.wl !== null ? r.wl : '',
    ]);

    const content = '\uFEFF' + headers.join(',') + '\n' + csvRows.map(r => r.join(',')).join('\n');
    saveAs(new Blob([content], { type: 'text/csv;charset=utf-8' }), `flow_data_${mode}.csv`);
  };

  const exportToTXT = () => {
    const headers = mode === "hourly"
      ? ['วันที่/เวลา', 'อัตราการไหล (ลบ.ม./วินาที)', 'ระดับน้ำ (ม.รทก.)']
      : ['วันที่', 'อัตราการไหล (ลบ.ม./วินาที)', 'ระดับน้ำ (ม.รทก.)'];

    const txtRows = rows.map(r => [
      r.datetime,
      r.discharge !== null ? r.discharge.toFixed(3) : '-',
      r.wl !== null ? r.wl.toFixed(3) : '-',
    ]);

    const content = '\uFEFF' + headers.join('\t') + '\n' + txtRows.map(r => r.join('\t')).join('\n');
    saveAs(new Blob([content], { type: 'text/plain;charset=utf-8' }), `flow_data_${mode}.txt`);
  };

  // ตรวจสอบว่ามีข้อมูลประเภทไหนบ้าง
  const hasDischarge = Object.keys(dischargeGroupedData).length > 0;
  const hasWL = Object.keys(wlGroupedData).length > 0;

  return (
    <Box>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 2, 
        flexWrap: 'wrap', 
        gap: 2,
      }}>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel sx={{ fontFamily: "Prompt" }}>เลือกปี</InputLabel>
          <Select
            value={selectedYear}
            label="เลือกปี"
            onChange={(e) => setSelectedYear(e.target.value as string)}
            sx={{ 
              fontFamily: "Prompt",
              backgroundColor: theme.palette.background.default,
              color: theme.palette.text.primary,
            }}
          >
            {yearsFromData.map(year => (
              <MenuItem 
                key={year} 
                value={year} 
                sx={{ fontFamily: "Prompt" }}
              >
                {year === "ทั้งหมด" ? "ทั้งหมด" : `พ.ศ. ${Number(year) + 543}`}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button
          variant="contained"
          color="success"
          endIcon={<ArrowDropDownIcon />}
          onClick={handleClick}
          sx={{ 
            borderRadius: '8px', 
            textTransform: 'none', 
            px: 3,
            background: theme.palette.mode === 'dark' 
              ? 'linear-gradient(90deg, #388e3c, #4caf50)'
              : 'linear-gradient(90deg, #43a047, #66bb6a)',
            '&:hover': {
              background: theme.palette.mode === 'dark' 
                ? 'linear-gradient(90deg, #2e7d32, #388e3c)'
                : 'linear-gradient(90deg, #388e3c, #4caf50)',
            },
          }}
        >
          Export File
        </Button>

        <Menu 
          anchorEl={anchorEl} 
          open={Boolean(anchorEl)} 
          onClose={handleClose}
          PaperProps={{
            sx: {
              backgroundColor: theme.palette.background.paper,
              color: theme.palette.text.primary,
            }
          }}
        >
          <MenuItem onClick={() => { exportToXLSX(); handleClose(); }}>
            <TableChartIcon sx={{ mr: 1, color: theme.palette.success.main }} /> 
            Export XLSX
          </MenuItem>
          <MenuItem onClick={() => { exportToCSV(); handleClose(); }}>
            <DownloadIcon sx={{ mr: 1, color: theme.palette.info.main }} /> 
            Export CSV
          </MenuItem>
          <MenuItem onClick={() => { exportToTXT(); handleClose(); }}>
            <TextSnippetIcon sx={{ mr: 1, color: theme.palette.warning.main }} /> 
            Export TXT
          </MenuItem>
        </Menu>
      </Box>

      {/* ตารางข้อมูล */}
      <Box sx={{ 
        maxHeight: '70vh', 
        overflowY: 'auto', 
        border: `1px solid ${theme.palette.divider}`, 
        borderRadius: 2,
        backgroundColor: theme.palette.background.paper,
        boxShadow: theme.palette.mode === 'dark' ? 6 : 2,
      }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={HeaderCellStyle}>
                {mode === "hourly" ? "วันที่/เวลา" : "วันที่"}
              </TableCell>
              {hasDischarge && (
                <TableCell sx={HeaderCellStyle}>
                  อัตราการไหล (ลบ.ม./วินาที)
                </TableCell>
              )}
              {hasWL && (
                <TableCell sx={HeaderCellStyle}>
                  ระดับน้ำ (ม.รทก.)
                </TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell 
                  colSpan={hasDischarge && hasWL ? 3 : 2} 
                  sx={{ 
                    py: 6, 
                    textAlign: 'center', 
                    color: theme.palette.text.secondary,
                    fontFamily: "Prompt",
                  }}
                >
                  ไม่มีข้อมูลสำหรับปีที่เลือก
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, idx) => (
                <TableRow 
                  key={row.timestamp}
                  sx={{
                    backgroundColor: idx % 2 === 0 
                      ? (isDark ? '#1e293b' : '#FAFAFA') 
                      : (isDark ? '#111827' : '#FFF'),
                    '&:hover': {
                      backgroundColor: isDark ? '#263238' : '#f5f5f5',
                    },
                  }}
                >
                  <TableCell sx={getCellStyle(idx)}>
                    {row.datetime}
                  </TableCell>
                  {hasDischarge && (
                    <TableCell sx={getCellStyle(idx)}>
                      {row.discharge !== null ? row.discharge.toFixed(3) : '-'}
                    </TableCell>
                  )}
                  {hasWL && (
                    <TableCell sx={getCellStyle(idx)}>
                      {row.wl !== null ? row.wl.toFixed(3) : '-'}
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Box>
    </Box>
  );
};

export default FlowExportTable;