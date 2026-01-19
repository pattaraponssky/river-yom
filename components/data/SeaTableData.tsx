import React, { useState } from 'react';
import { Box, Button, FormControl, InputLabel, Menu, MenuItem, Select, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import DownloadIcon from '@mui/icons-material/Download';
import TextSnippetIcon from '@mui/icons-material/TextSnippet';
import TableChartIcon from '@mui/icons-material/TableChart';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { textStyle } from '../../theme/style';


// ฟังก์ชันช่วย format วันที่ไทย
const formatThaiDate = (isoDateStr: string) => {
  const date = new Date(isoDateStr);
  return date.toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' });
};

const HeaderCellStyle = {
    border: "1px solid #ddd",
    fontFamily: "Prompt",
    fontWeight: "bold",
    textAlign: "center",
    backgroundColor: "rgb(1, 87, 155)",
    color: "white",
    fontSize: { xs: "0.8rem", sm: "1rem" , md: "1.1rem"},
  };
  
  const getCellStyle = (index: number) => ({
    border: "1px solid #ddd",
    padding: "5px",
    backgroundColor: index % 2 === 0 ? "#FAFAFA" : "#FFF",
    textAlign: "center",
    fontFamily: "Prompt",
    fontSize: { xs: "0.8rem", sm: "0.9rem" , md: "1rem"},
  });
  
  const menuStyle = {
    fontFamily: "Prompt",
    fontSize: "1rem",
    backgroundColor: '#fff',

  };

interface GroupedData {
  [year: string]: [number, number][];
}
interface Props {
  wlGroupedData?: GroupedData;
  availableYears: string[]; 
}

const SeaExportTable: React.FC<Props> = ({
  wlGroupedData,
  availableYears,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const [selectedYear, setSelectedYear] = useState("ทั้งหมด");
  // เปิดเมนู export
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  // ปิดเมนู export
  const handleClose = () => {
    setAnchorEl(null);
  };

  // รวมข้อมูลจาก series ทั้งสาม เป็น array สำหรับ export
  const getAllDataRows = () => {
    // เราจะเอาข้อมูลจาก dischargeGroupedData เป็นหลัก (ถ้าไม่มีข้อมูลจะ return [])
    if (!wlGroupedData) return [];

    if (selectedYear === 'ทั้งหมด') {
      const years = Object.keys(wlGroupedData).sort();
      return years.flatMap((year) => {
        const wlData = wlGroupedData[year] ?? [];
        return wlData.map(([date, discharge], i) => {
          const wl = wlData[i]?.[1] ?? null;
          return { date, discharge, wl };
        });
      });
    } else {
      const year = selectedYear;
      
      const wlData = wlGroupedData[year] ?? [];
      return wlData.map(([date,wl]) => {
        return { date, wl };
      });
    }
  };

  // Export เป็น TXT
  const exportToTXT = () => {
    const headers = ['วันที่', 'ปริมาณน้ำ (มม.)','ระดับน้ำ (ม.รทก.)'];
    const rows = getAllDataRows().map(({ date, wl }) => {
      const dateStr = new Date(date).toLocaleDateString('th-TH');
      return [
        dateStr,
        wl !== null ? wl.toFixed(2) : '',
      ];
    });

    const content = '\uFEFF' + headers.join('\t') + '\n' + rows.map((r) => r.join('\t')).join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'sealevel_data.txt');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export เป็น XLSX
  const exportToXLSX = () => {
    const data = getAllDataRows().map(({ date, wl }) => ({
      วันที่: new Date(date).toLocaleDateString('th-TH'),
      'ระดับน้ำ (ม.รทก.)': wl !== null ? wl.toFixed(2) : '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sea Data');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, 'sealevel_data.xlsx');
  };

  // Export เป็น CSV
  const exportToCSV = () => {
    const headers = ['วันที่','ระดับน้ำ (ม.รทก.)'];
    const rows = getAllDataRows().map(({ date, wl }) => {
      const dateStr = new Date(date).toLocaleDateString('th-TH');
      return [
        dateStr,
        wl !== null ? wl.toFixed(2) : '',
      ];
    });

    let csvContent = '\uFEFF' + headers.join(',') + '\n' + rows.map((r) => r.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'sealevel_data.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Render ตารางแสดงข้อมูล
  const renderRows = () => {
    if (!wlGroupedData) return null;

    const renderSeriesData = (
      year: string,
      wlData: [number, number][],
    ) => {
      return wlData.map(([date, wlValue], index) => {
        return (
          <TableRow key={`${year}-${index}`}>
            <TableCell sx={getCellStyle(index)}>{formatThaiDate(new Date(date).toISOString()) || '-'}</TableCell>
            <TableCell  sx={getCellStyle(index)}>{typeof wlValue === 'number' ? wlValue.toFixed(2) : '-'}</TableCell>
          </TableRow>
        );
      });
    };

    if (selectedYear === 'ทั้งหมด') {
      const years = Object.keys(wlGroupedData).sort();
      return years.flatMap((year) => {
        const wlData = wlGroupedData[year] ?? [];
        return renderSeriesData(year, wlData);
      });
    } else {
      const year = selectedYear;
      const wlData = wlGroupedData[year] ?? [];
      return renderSeriesData(year, wlData);
    }
  };

  return (
    <Box>
        {/* Row เดียวกันสำหรับ Export และ Select ปี */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <FormControl size="small" sx={{ minWidth: {md:150,xs:100} }}>
            <InputLabel>เลือกปี</InputLabel>
            <Select
                sx={{fontFamily:"Prompt"}}
                value={selectedYear}
                label="เลือกปี"
                onChange={(e) => setSelectedYear(e.target.value)}
            >
                {availableYears.map((year) => (
                <MenuItem key={year} value={year}  sx={{fontFamily:"Prompt"}}>
                    
                    {year === "ทั้งหมด" ? "ทั้งหมด" : Number(year) + 543}
                </MenuItem>
                ))}
            </Select>
            </FormControl>
            <Box>
            <Button
                variant="contained"
                color="success"
                onClick={handleClick}
                endIcon={<ArrowDropDownIcon />}
                sx={{ borderRadius: '8px', textTransform: 'none', px: 3 , ...textStyle }}
            >
                Export File
            </Button>
            <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
            <MenuItem
                sx={menuStyle}
                onClick={() => {
                    exportToXLSX();
                    handleClose();
                }}
                >
                <TableChartIcon sx={{ mr: 1 }} />
                Export XLSX
                </MenuItem>
                <MenuItem
                sx={menuStyle}
                onClick={() => {
                    exportToCSV();
                    handleClose();
                }}
                >
                <DownloadIcon sx={{ mr: 1 }} />
                Export CSV
                </MenuItem>
                <MenuItem
                sx={menuStyle}
                onClick={() => {
                    exportToTXT();
                    handleClose();
                }}
                >
                <TextSnippetIcon sx={{ mr: 1 }} />
                Export TXT
                </MenuItem>
              
            </Menu>
            </Box>
        </Box>

        {/* ตารางพร้อม scroll */}
        <Box sx={{ maxHeight: '70vh', overflowY: 'auto' }}>
            <Table size="small" stickyHeader>
            <TableHead>
                <TableRow>
                <TableCell sx={HeaderCellStyle}>วันที่</TableCell>
                <TableCell sx={HeaderCellStyle}>ระดับน้ำทะเล (ม.รทก.)</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>{renderRows()}</TableBody>
            </Table>
        </Box>
        </Box>

  );
};

export default SeaExportTable;
