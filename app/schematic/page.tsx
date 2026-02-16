'use client';

import React, { useRef, useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  useTheme,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import * as d3 from 'd3';
import { API_URL, formatThaiDay, Path_URL } from '@/lib/utility';
import PdfViewer from '@/components/PdfViewer';
import { BoxStyle } from '@/theme/style';
import DataReservoirStation from '../reservoir/components/ReservoirData';


interface ReservoirNode {
  imageUrl: string;
  id: string;
  name: string;
  res_code: string;
  province: string;
  x: number;
  y: number;
  volume: number;
  inflow: number;
  outflow: number;
  percent: number;
  date: string;
}

const WaterSchematicSimple: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const theme = useTheme();

  const [reservoirs, setReservoirs] = useState<ReservoirNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State สำหรับ Dialog
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedStation, setSelectedStation] = useState<string | undefined>(undefined);
  const [selectedName, setSelectedName] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${API_URL}/api/daily/reservoir`);
        if (!res.ok) throw new Error('Failed to fetch');
        const json = await res.json();
        const data = json.data || [];

        const mapped = data
          .map((item: any) => {
            let x: number | undefined;
            let y: number | undefined;
            let imageUrl = '';

            switch (item.res_code.toLowerCase()) {
              case 'ks': // กระเสียว
                x = 420; y = 350;
                imageUrl = `${Path_URL}images/icons/dam.png`;
                break;
              case 'hkk': // ห้วยขุนแก้ว
                x = 400; y = 140;
                imageUrl = `${Path_URL}images/icons/dam.png`;
                break;
              case 'ht': // ห้วยเทียน
                x = 440; y = 700;
                imageUrl = `${Path_URL}images/icons/dam.png`;
                break;
              case 'hnl': // ห้วยหนองโรง
                x = 460; y = 350;
                imageUrl = `${Path_URL}images/icons/dam.png`;
                break;
              case 'htd': // ห้วยท่าเดื่อ
                x = 360; y = 550;
                imageUrl = `${Path_URL}images/icons/dam.png`;
                break;
              // เพิ่ม case อื่น ๆ ตาม res_code ที่เหลือที่นี่
            }

            if (x === undefined || y === undefined) {
              console.warn(
                `ไม่มีตำแหน่งกำหนดสำหรับอ่าง: ${item.res_name} (${item.res_code}) - ข้ามการแสดง`
              );
              return null;
            }

            return {
              id: item.no.toString(),
              name: item.res_name,
              res_code: item.res_code,
              province: item.province,
              x,
              y,
              volume: parseFloat(item.volume),
              inflow: parseFloat(item.inflow),
              outflow: parseFloat(item.outflow),
              percent: parseFloat(item.p),
              date: item.date,
            };
          })
          .filter((item: ReservoirNode | null): item is ReservoirNode => item !== null);

        setReservoirs(mapped);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (!svgRef.current || reservoirs.length === 0) return;

    const width = 600;
    const height = 1200;

    const svg = d3.select(svgRef.current)
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('viewBox', `0 0 ${width} ${height}`)
      .style('background', theme.palette.background.paper)
      .style('overflow', 'visible');

    svg.selectAll('*').remove();

    svg.append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', 'white');

    const rectData = [
      { x: 181, y: 290, w: 210, h: 12, fill: '#B7F1FF' },
      { x: 210, y: 536, w: 181, h: 12, fill: '#B7F1FF' },
      { x: 206.123, y: 497.592, w: 94.2319, h: 12, rotate: -12, cx: 206.123, cy: 497.592, fill: '#B7F1FF' },
      { x: 297.495, y: 478, w: 104.095, h: 12, rotate: 12, cx: 297.495, cy: 478, fill: '#B7F1FF' },
      { x: 241, y: 378, w: 76, h: 12, rotate: -90, cx: 241, cy: 378, fill: '#B7F1FF' },
      { x: 305, y: 361, w: 59, h: 7, rotate: -90, cx: 305, cy: 361, fill: '#B7F1FF' },
      { x: 281, y: 418.466, w: 64.9963, h: 7, rotate: -68, cx: 281, cy: 418.466, fill: '#B7F1FF' },
      { x: 278.139, y: 427.912, w: 62.4978, h: 12, rotate: -126, cx: 278.139, cy: 427.912, fill: '#B7F1FF' },
      { x: 293.281, y: 485.599, w: 66.7677, h: 12, rotate: -105, cx: 293.281, cy: 485.599, fill: '#B7F1FF' },
      { x: 391, y: 164, w: 15, h: 585, fill: '#66E0FF' },
      { x: 166, y: 147, w: 15, h: 267, fill: '#66E0FF' },
      { x: 195, y: 436, w: 15, h: 178, fill: '#66E0FF' },
      { x: 70, y: 343, w: 15, h: 338, fill: '#66E0FF' },
      { x: 406, y: 180, w: 117, h: 13, fill: '#66E0FF' },
      { x: 195, y: 614, w: 196, h: 13, fill: '#66E0FF' },
      { x: 70, y: 735, w: 321, h: 8, fill: '#66E0FF' },
      { x: 70, y: 681, w: 321, h: 13, fill: '#66E0FF' },
      { x: 198.99, y: 446.597, w: 46.6552, h: 15, rotate: -135, cx: 198.99, cy: 446.597, fill: '#66E0FF' },
    ];

    rectData.forEach(d => {
      const r = svg.append('rect')
        .attr('x', d.x)
        .attr('y', d.y)
        .attr('width', d.w)
        .attr('height', d.h)
        .attr('fill', d.fill);

      if (d.rotate !== undefined) {
        r.attr('transform', `rotate(${d.rotate} ${d.cx} ${d.cy})`);
      }
    });

    const nodeGroup = svg.selectAll<SVGGElement, ReservoirNode>('.reservoir-node')
      .data(reservoirs)
      .enter()
      .append('g')
      .attr('class', 'reservoir-node')
      .attr('transform', d => `translate(${d.x}, ${d.y})`)
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        setSelectedStation(d.res_code.toLowerCase());
        setSelectedName(d.name);
        setOpenDialog(true);
      });

    nodeGroup.append('title')
      .text(d => `คลิกเพื่อดูรายละเอียด ${d.name}`);

    nodeGroup.append('image')
      .attr('xlink:href', d => d.imageUrl || `${Path_URL}images/icons/dam.png`)
      .attr('x', -25)
      .attr('y', -60)
      .attr('width', 50)
      .attr('height', 50)
      .style('pointer-events', 'none');

    nodeGroup.append('text')
      .attr('text-anchor', 'middle')
      .attr('y', 0)
      .attr('font-size', 14)
      .attr('font-weight', 'bold')
      .attr('fill', theme.palette.text.primary)
      .text(d => d.name);

    nodeGroup.append('text')
      .attr('y', -45)
      .attr('x', 35)
      .attr('font-size', 12)
      .attr('fill', theme.palette.text.primary)
      .text(d => `ปริมาณน้ำ ${d.volume.toFixed(2)} MCM (${d.percent.toFixed(2)}%)`);

    nodeGroup.append('text')
      .attr('y', -30)
      .attr('x', 35)
      .attr('font-size', 12)
      .attr('fill', theme.palette.text.primary)
      .text(d => `ไหลลงอ่างฯ ${d.inflow.toFixed(3)} MCM`);

    nodeGroup.append('text')
      .attr('y', -15)
      .attr('x', 35)
      .attr('font-size', 12)
      .attr('fill', theme.palette.text.primary)
      .text(d => `ระบาย: ${d.outflow.toFixed(3)} MCM`);

    // ลูกศร (ส่วนเดิม)
    svg.append("defs")
      .append("marker")
      .attr("id", "flow-arrow-down")
      .attr("viewBox", "0 0 24 24")
      .attr("refX", 12)
      .attr("refY", 20)
      .attr("markerWidth", 14)
      .attr("markerHeight", 14)
      .attr("orient", "90")
      .append("path")
      .attr("d", "M2,10 L14,10 L14,6 L22,12 L14,18 L14,14 L2,14 Z")
      .attr("fill", "#000000")
      .attr("stroke", "#000000")
      .attr("stroke-width", 1)
      .attr("stroke-linejoin", "round");

    const arrowGroups = [
      {
        id: "arrow-flow-1",
        startX: 398,
        startY: 180,
        pathD: "M 0 0 L 0 20",
      },
      // เพิ่มจุดอื่น ๆ ได้ตามต้องการ
    ];

    arrowGroups.forEach(group => {
      const g = svg.append("g")
        .attr("id", group.id)
        .attr("transform", `translate(${group.startX}, ${group.startY})`);

      const path = g.append("path")
        .attr("d", group.pathD)
        .attr("fill", "none")
        .attr("id", `${group.id}-path`)
        .attr("opacity", 0);

      const movingLine = g.append("path")
        .attr("d", "M 0 0 L 0.1 0")
        .attr("fill", "none")
        .attr("stroke", "none");

      movingLine.attr("marker-end", "url(#flow-arrow-down)");

      function animate() {
        movingLine
          .transition()
          .duration(2000)
          .ease(d3.easeLinear)
          .attrTween("transform", function () {
            const node = path.node() as SVGPathElement;
            const length = node.getTotalLength();
            return function (t) {
              const point = node.getPointAtLength((t % 1) * length);
              return `translate(${point.x}, ${point.y})`;
            };
          })
          .on("end", animate);
      }

      animate();
    });

  }, [reservoirs, theme.palette.mode]);

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedStation(undefined);
    setSelectedName('');
  };

  if (loading) return <CircularProgress />;
  if (error) return <Typography color="error">Error: {error}</Typography>;

  return (
    <Box sx={{ p: 3, bgcolor: 'background.default', minHeight: '100vh' }}>
      <Typography variant="h5" id="card-daily" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
        แผนผังสถานการณ์น้ำประจำวันที่ {formatThaiDay(reservoirs[0]?.date) || 'ล่าสุด'}
      </Typography>

      <Paper elevation={4} sx={{ p: 2, overflowX: 'auto', borderRadius: 2 }}>
        <svg ref={svgRef} style={{ width: '100%', height: 'auto', minHeight: '1000px' }} />
      </Paper>

      <Box mt={3} textAlign="center">
        <Typography variant="body2" color="text.secondary">
          • เขียว = ปกติ (&gt;70%) &nbsp; เหลือง = เฝ้าระวัง (40-70%) &nbsp; แดง = วิกฤต (&lt;40%)
          <br />
          ข้อมูลจาก API: https://app.rid.go.th/reservoir/api/reservoir/public
        </Typography>
      </Box>

      <Box sx={BoxStyle}>
        <PdfViewer
          src="http://irrigation.rid.go.th/rid3/water/report.pdf"
          title="รายงานสถานการณ์น้ำประจำวัน สำนักงานชลประทานที่ 3"
        />
      </Box>

      {/* Dialog แสดง DataReservoirStation */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="xl"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            height: '90vh',
            borderRadius: 2,
            overflow: 'hidden',
          },
        }}
      >
        <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5">{'รายละเอียดสถานี'}</Typography>
          <IconButton aria-label="close" onClick={handleCloseDialog}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 2 }}>
          {selectedStation ? (
            <DataReservoirStation propsSelectedStation={selectedStation} />
          ) : (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography>กำลังโหลดข้อมูล...</Typography>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default WaterSchematicSimple;