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
import { API_URL, formatThaiDay, nowThaiDate, Path_URL } from '@/lib/utility';
import DataReservoirStation from '../reservoir/components/ReservoirData';
import DataFlowCombined from '../flow/components/FlowData';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import RefreshIcon from '@mui/icons-material/Refresh';
import AspectRatioIcon from '@mui/icons-material/AspectRatio';

interface ReservoirNode {
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

interface FlowStationNode {
  id: string;
  name: string;
  sta_code: string;
  province: string;
  x: number;
  y: number;
  wl: number;
  discharge: number;
  date: string;
  cardOffsetX?: number;
  cardOffsetY?: number;
}

const WaterSchematicSimple: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const theme = useTheme();
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const containerRef = useRef<SVGGElement>(null);

  const [reservoirs, setReservoirs] = useState<ReservoirNode[]>([]);
  const [flows, setFlows] = useState<FlowStationNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [openDialog, setOpenDialog] = useState(false);
  const [selectedStation, setSelectedStation] = useState<string | undefined>(undefined);
  const [selectedName, setSelectedName] = useState<string>('');
  const [selectedType, setSelectedType] = useState<'reservoir' | 'flow' | undefined>(undefined);

  const width = 650;
  const height = 900;

  // ฟังก์ชันควบคุมซูม (อยู่นอก useEffect เพื่อให้เรียกจาก JSX ได้)
  const zoomIn = () => {
    if (!zoomRef.current || !svgRef.current) return;
    d3.select(svgRef.current)
      .transition()
      .duration(450)
      .call(zoomRef.current.scaleBy, 1.4);
  };

  const zoomOut = () => {
    if (!zoomRef.current || !svgRef.current) return;
    d3.select(svgRef.current)
      .transition()
      .duration(450)
      .call(zoomRef.current.scaleBy, 1 / 1.4);
  };

  const fitToView = () => {
    if (!svgRef.current || !containerRef.current || !zoomRef.current) return;

    const svgEl = d3.select(svgRef.current);
    const bounds = containerRef.current.getBBox();

    // ถ้ายังไม่มีเนื้อหา ให้ข้าม
    if (bounds.width === 0 || bounds.height === 0) return;

    const dx = bounds.width;
    const dy = bounds.height;
    const x = bounds.x + dx / 2;
    const y = bounds.y + dy / 2;

    const scale = 0.92 * Math.min(width / dx, height / dy);

    const translate = [width / 2 - scale * x, height / 2 - scale * y];

    svgEl.transition()
      .duration(450)
      .call(
        zoomRef.current.transform,
        d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
      );
  };

  useEffect(() => {
    const fetchReservoirData = async () => {
      try {
        const res = await fetch(`${API_URL}/api/daily/reservoir`);
        if (!res.ok) throw new Error('Failed to fetch reservoir');
        const json = await res.json();
        const data = json.data || [];

        const mapped = data
          .map((item: any) => {
            let x: number | undefined;
            let y: number | undefined;

            switch (item.res_code) {
              case 'srk': x = 435; y = 140; break;
              case 'pmp': x = 40; y = 295; break;
            }

            if (x === undefined || y === undefined) return null;

            return {
              id: item,
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
      }
    };

    const fetchFlowData = async () => {
      try {
        const res = await fetch(`${API_URL}/api/daily/flow`);
        if (!res.ok) throw new Error('Failed to fetch flow');
        const json = await res.json();
        const data = json.data || [];

        const mapped = data
          .map((item: any) => {
            let x: number | undefined;
            let y: number | undefined;
            let cardOffsetX = 20;
            let cardOffsetY = -30;

            switch (item.sta_code) {
              case 'Y.15': x = 174; y = 410; cardOffsetX = -85; cardOffsetY = -20; break;
              case 'Y.16': x = 202.5; y = 490; cardOffsetX = -85; cardOffsetY = -8; break;
              case 'Y.4': x = 174; y = 370; cardOffsetX = -85; cardOffsetY = -30; break;
              case 'Y.50': x = 202.5; y = 470; cardOffsetX = -85; cardOffsetY = -28; break;
              case 'Y.64': x = 202.5; y = 520; cardOffsetX = 13; cardOffsetY = -20; break;
            }

            if (x === undefined || y === undefined) return null;

            return {
              id: item.no.toString(),
              name: item.sta_name,
              sta_code: item.sta_code,
              province: item.province,
              x,
              y,
              wl: parseFloat(item.wl),
              discharge: parseFloat(item.discharge),
              date: item.date,
              cardOffsetX,
              cardOffsetY,
            };
          })
          .filter((item: FlowStationNode | null): item is FlowStationNode => item !== null);

        setFlows(mapped);
      } catch (err) {
        setError((err as Error).message);
      }
    };

    Promise.all([fetchReservoirData(), fetchFlowData()])
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!svgRef.current || reservoirs.length === 0) return;

    const svg = d3.select(svgRef.current)
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('viewBox', `0 0 ${width} ${height}`)
      .style('background', theme.palette.background.paper)
      .style('overflow', 'visible');

    svg.selectAll('*').remove();

    // พื้นหลัง
    svg.append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', 'white');

    // Container สำหรับซูม
    const container = svg.append('g')
      .attr('class', 'zoom-container');

    containerRef.current = container.node() as unknown as SVGGElement;

    // Zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 12])
      .translateExtent([
        [-width * 4, -height * 4],
        [width * 5, height * 5]
      ])
      .on('zoom', (event) => {
        container.attr('transform', event.transform);
      });

    zoomRef.current = zoom;

    svg.call(zoom);

   // ────────────────────────────────────────────────
// กำหนดพื้นที่โครงการ (เพิ่มได้หลายพื้นที่)
const projectAreas = [
  {
    x: 160,
    y: 205,
    width: 210,
    height: 330,
    color: '#FFCDD2',          // แดงอ่อน (light red) สบายตา
    opacity: 0.35,             // โปร่งใสพอให้เห็นแผนที่ด้านล่าง
    label: 'ขอบเขตพื้นที่โครงการ',  // คำอธิบายที่ต้องการแสดง
    labelXOffset: 10,          // ปรับตำแหน่งข้อความ (ขยับจากมุมซ้ายบน)
    labelYOffset: -15,         // ขยับขึ้นด้านบนเล็กน้อย
  },
];

projectAreas.forEach((zone, index) => {
  const rect = container.append('rect')
    .attr('x', zone.x)
    .attr('y', zone.y)
    .attr('width', zone.width)
    .attr('height', zone.height)
    .attr('fill', zone.color)
    .attr('opacity', zone.opacity)
    .attr('stroke', '#D32F2F')          // ขอบสีแดงเข้ม (optional)
    .attr('stroke-width', 1.5)          // ความหนาขอบ (optional)
    .attr('stroke-dasharray', '5,5')    // เส้นประ (optional)
    .attr('pointer-events', 'none')     // ไม่ให้รับการคลิกทับ
    .lower();                           // ส่งไปด้านหลังสุดใน container

    // 2. เพิ่มคำอธิบาย (label) ด้านบนซ้ายของสี่เหลี่ยม
    container.append('text')
        .attr('x', zone.x + zone.labelXOffset + 30)
        .attr('y', zone.y + zone.labelYOffset + 30)
        .attr('font-size', 12)
        .attr('font-weight', 'bold')
        .attr('fill', '#B71C1C')            // สีแดงเข้มเพื่อให้เด่น
        .attr('pointer-events', 'none')     // ไม่ให้คลิกทับ
        .text(zone.label)
        .lower();                           // ให้ข้อความอยู่ด้านหลัง (แต่ยังเห็นชัด)
    });

    // rectData → ใช้ container
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
      const r = container.append('rect')
        .attr('x', d.x)
        .attr('y', d.y)
        .attr('width', d.w)
        .attr('height', d.h)
        .attr('fill', d.fill);

      if (d.rotate !== undefined) {
        r.attr('transform', `rotate(${d.rotate} ${d.cx} ${d.cy})`);
      }
    });

    // Reservoir nodes → ใช้ container
    const nodeGroup = container.selectAll<SVGGElement, ReservoirNode>('.reservoir-node')
      .data(reservoirs)
      .enter()
      .append('g')
      .attr('class', 'reservoir-node')
      .attr('transform', d => `translate(${d.x}, ${d.y})`)
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        setSelectedStation(d.res_code);
        setSelectedName(d.name);
        setSelectedType('reservoir');
        setOpenDialog(true);
      });

    nodeGroup.append('title')
      .text(d => `คลิกเพื่อดูรายละเอียด อ่างเก็บน้ำ${d.name}`);

    nodeGroup.append('text')
      .attr('y', -32)
      .attr('x', 25)
      .attr('font-size', 8)
      .attr('font-weight', 'bold')
      .attr('fill', theme.palette.text.primary)
      .text(d => d.name);

    nodeGroup.append('text')
      .attr('y', -20)
      .attr('font-size', 7)
      .attr('fill', theme.palette.text.primary)
      .text('ปริมาณน้ำ ');

    nodeGroup.append('text')
      .attr('x', 40)
      .attr('y', -20)
      .attr('font-size', 7)
      .attr('font-weight', 'bold')
      .attr('fill', '#0066cc')
      .text(d => `${d.volume} MCM (${d.percent.toFixed(2)}%)`);

    nodeGroup.append('text')
      .attr('y', -10)
      .attr('font-size', 7)
      .attr('fill', theme.palette.text.primary)
      .text('ไหลลงอ่างฯ ');

    nodeGroup.append('text')
      .attr('x', 40)
      .attr('y', -10)
      .attr('font-size', 7)
      .attr('font-weight', 'bold')
      .attr('fill', '#0066cc')
      .text(d => `${d.inflow.toFixed(3)} MCM`);

    nodeGroup.append('text')
      .attr('y', 0)
      .attr('font-size', 7)
      .attr('fill', theme.palette.text.primary)
      .text('ระบาย ');

    nodeGroup.append('text')
      .attr('x', 40)
      .attr('y', 0)
      .attr('font-size', 7)
      .attr('font-weight', 'bold')
      .attr('fill', '#0066cc')
      .text(d => `${d.outflow.toFixed(3)} MCM`);

    // Flow nodes → ใช้ container
    const thresholds: Record<string, { red: number; yellow: number }> = {
      'Y.15': { red: 46.05, yellow: 44.97 },
      'Y.16': { red: 39.33, yellow: 38.56 },
      'Y.4': { red: 51.48, yellow: 50.68 },
      'Y.50': { red: 40.78, yellow: 40.17 },
      'Y.64': { red: 40.35, yellow: 39.57 },
    };

    const getColor = (sta_code: string, wl: number) => {
      const th = thresholds[sta_code] || { red: 40, yellow: 38 };
      if (wl > th.red) return 'red';
      if (wl > th.yellow) return 'yellow';
      return '#69fc00ff';
    };

    const flowGroup = container.selectAll<SVGGElement, FlowStationNode>('.flow-node')
      .data(flows)
      .enter()
      .append('g')
      .attr('class', 'flow-node')
      .attr('transform', d => `translate(${d.x}, ${d.y})`)
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        setSelectedStation(d.sta_code);
        setSelectedName(d.name);
        setSelectedType('flow');
        setOpenDialog(true);
      });

    flowGroup.append('title')
      .text(d => `คลิกเพื่อดูรายละเอียดสถานี ${d.name}`);

    flowGroup.append('circle')
      .attr('r', 7)
      .attr('fill', d => getColor(d.sta_code, d.wl))
      .attr('stroke', theme.palette.text.primary)
      .attr('stroke-width', 1);

    const cardWidth = 75;
    const cardHeight = 35;

    const cardX = (d: FlowStationNode) => d.cardOffsetX ?? 20;
    const cardY = (d: FlowStationNode) => d.cardOffsetY ?? -30;

    flowGroup.append('rect')
      .attr('x', cardX)
      .attr('y', cardY)
      .attr('width', cardWidth)
      .attr('height', cardHeight)
      .attr('rx', 8)
      .attr('ry', 8)
      .attr('fill', theme.palette.background.paper)
      .attr('stroke', theme.palette.divider)
      .attr('stroke-width', 1);

    flowGroup.append('text')
      .attr('x', d => cardX(d) + cardWidth / 2)
      .attr('y', d => cardY(d) + 10)
      .attr('text-anchor', 'middle')
      .attr('font-size', 6)
      .attr('font-weight', 'bold')
      .attr('fill', theme.palette.text.primary)
      .text(d => d.sta_code + (d.name ? ` (${d.name})` : ''));

    flowGroup.append('text')
      .attr('x', d => cardX(d) + 10)
      .attr('y', d => cardY(d) + 20)
      .attr('font-size', 5)
      .attr('fill', theme.palette.text.primary)
      .text('ระดับน้ำ: ');

    flowGroup.append('text')
      .attr('x', d => cardX(d) + 32)
      .attr('y', d => cardY(d) + 20)
      .attr('font-size', 5)
      .attr('font-weight', 'bold')
      .attr('fill', '#0066cc')
      .text(d => `${d.wl.toFixed(2)} ม.รทก.`);

    flowGroup.append('text')
      .attr('x', d => cardX(d) + 10)
      .attr('y', d => cardY(d) + 30)
      .attr('font-size', 5)
      .attr('fill', theme.palette.text.primary)
      .text('อัตราไหล: ');

    flowGroup.append('text')
      .attr('x', d => cardX(d) + 32)
      .attr('y', d => cardY(d) + 30)
      .attr('font-size', 5)
      .attr('font-weight', 'bold')
      .attr('fill', '#0066cc')
      .text(d => `${d.discharge.toFixed(2)} ลบ.ม./วินาที`);

    // defs (marker) ยังอยู่ที่ svg
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
      .attr("fill", "#fff")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1)
      .attr("stroke-linejoin", "round");

    const arrowGroups = [
      { startX: 394, startY: 180 },
      { startX: 394, startY: 250 },
      { startX: 394, startY: 330 },
      { startX: 394, startY: 410 },
      { startX: 394, startY: 490 },
      { startX: 394, startY: 570 },
      { startX: 394, startY: 650 },
      { startX: 394, startY: 730 },

      { startX: 169, startY: 180 },
      { startX: 169, startY: 250 },
      { startX: 169, startY: 330 },
      { startX: 198, startY: 450 },
      { startX: 198, startY: 570 },

      { startX: 73, startY: 410 },
      { startX: 73, startY: 490 },
      { startX: 73, startY: 570 },
      { startX: 73, startY: 650 },
    ];

    arrowGroups.forEach((group, i) => {
      const g = container.append("g")
        .attr("id", `arrow-flow-1-${i}`)
        .attr("transform", `translate(${group.startX}, ${group.startY})`);

      const path = g.append("path")
        .attr("d", "M 0 0 L 0 20")
        .attr("fill", "none")
        .attr("id", `arrow-path-${i}`)
        .attr("opacity", 0);

      const movingLine = g.append("path")
        .attr("d", "M 0 0 L 0.1 0")
        .attr("fill", "none")
        .attr("stroke", "none");

      movingLine.attr("marker-end", "url(#flow-arrow-down)");

      function animate() {
        movingLine
          .transition()
          .duration(1500)
          .ease(d3.easeLinear)
          .attrTween("transform", function () {
            const node = path.node() as SVGPathElement;
            const length = node.getTotalLength();
            return function (t) {
              const point = node.getPointAtLength(t * length);
              const opacity = t < 0.8 ? 1 : 1 - (t - 0.8) / 0.2;
              movingLine.attr("opacity", opacity);
              return `translate(${point.x}, ${point.y}) scale(1)`;
            };
          })
          .on("end", () => {
            movingLine.transition()
              .duration(500)
              .attr("opacity", 1)
              .on("end", animate);
          });
      }

      movingLine.attr("opacity", 0);
      animate();
    });

    // ลูกศรขวา
    svg.append("defs")
      .append("marker")
      .attr("id", "flow-arrow-right")
      .attr("viewBox", "0 0 24 24")
      .attr("refX", 20)
      .attr("refY", 12)
      .attr("markerWidth", 14)
      .attr("markerHeight", 14)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M2,10 L14,10 L14,6 L22,12 L14,18 L14,14 L2,14 Z")
      .attr("fill", "#fff")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1)
      .attr("stroke-linejoin", "round");

    const arrowRightGroups = [
      { startX: 230, startY: 620 },
      { startX: 290, startY: 620 },
      { startX: 350, startY: 620 },
      { startX: 110, startY: 687 },
      { startX: 170, startY: 687 },
      { startX: 230, startY: 687 },
      { startX: 290, startY: 687 },
      { startX: 350, startY: 687 },
    ];

    arrowRightGroups.forEach((group, i) => {
      const g = container.append("g")
        .attr("id", `arrow-right-${i}`)
        .attr("transform", `translate(${group.startX}, ${group.startY})`);

      const path = g.append("path")
        .attr("d", "M 0 0 L 20 0")
        .attr("fill", "none")
        .attr("id", `arrow-right-path-${i}`)
        .attr("opacity", 0);

      const movingLine = g.append("path")
        .attr("d", "M 0 0 L 0.1 0")
        .attr("fill", "none")
        .attr("stroke", "none");

      movingLine.attr("marker-end", "url(#flow-arrow-right)");

      function animate() {
        movingLine
          .transition()
          .duration(1500)
          .ease(d3.easeLinear)
          .attrTween("transform", function () {
            const node = path.node() as SVGPathElement;
            const length = node.getTotalLength();
            return function (t) {
              const point = node.getPointAtLength(t * length);
              const opacity = t < 0.8 ? 1 : 1 - (t - 0.8) / 0.2;
              movingLine.attr("opacity", opacity);
              return `translate(${point.x}, ${point.y}) scale(1)`;
            };
          })
          .on("end", () => {
            movingLine.transition()
              .duration(500)
              .attr("opacity", 1)
              .on("end", animate);
          });
      }

      movingLine.attr("opacity", 0);
      animate();
    });

    // Reservoir icons → ใช้ container
    const ReservoirIcon = [
      { id: "reservoir-icon-1", x: 390, y: 170, imageUrl: `${Path_URL}images/icons/dam.png` },
      { id: "reservoir-icon-2", x: 390, y: 790, imageUrl: `${Path_URL}images/icons/dam.png` },
      { id: "reservoir-icon-3", x: 65, y: 350, imageUrl: `${Path_URL}images/icons/dam.png` },
    ];

    const iconGroup = container.selectAll('.reservoir-icon')
      .data(ReservoirIcon)
      .enter()
      .append('g')
      .attr('class', 'reservoir-icon')
      .attr('id', d => d.id)
      .attr('transform', d => `translate(${d.x}, ${d.y})`);

    iconGroup.append('image')
      .attr('xlink:href', d => d.imageUrl)
      .attr('x', -25)
      .attr('y', -60)
      .attr('width', 75)
      .attr('height', 75)
      .style('pointer-events', 'none');

    // เรียก fitToView อัตโนมัติครั้งแรก (หลัง render เสร็จ)
    setTimeout(fitToView, 300);

    const customTexts = [
      { text: `สำนักงานชลประทานที่ 3`, x: 180, y: 25, orientation: "horizontal", fontSize: 25, fill: "#004080", fontWeight: "bold" },
      { text: `ส่วนบริหารจัดการน้ำและบำรุงรักษา`, x: 160, y: 55, orientation: "horizontal", fontSize: 20, fill: "#004080", fontWeight: "bold" },

      { text: `หมายเหตุ`, x: 55, y: 145, orientation: "horizontal", fontSize: 14, fill: "#fe0000", fontWeight: "bold" },

      { text: "จ.น่าน", x: 385, y: 100, orientation: "horizontal", fontSize: 11, fill: "#333", fontWeight: "bold" },
      { text: "จ.อตรดิตถ์", x: 275, y: 200, orientation: "horizontal", fontSize: 11, fill: "#333", fontWeight: "bold" },
      { text: "จ.สุโขทัย", x: 190, y: 360, orientation: "horizontal", fontSize: 11, fill: "#333", fontWeight: "bold" },
      { text: "จ.พิจิตร", x: 345, y: 580, orientation: "horizontal", fontSize: 11, fill: "#333", fontWeight: "bold" },
      { text: "จ.ตาก", x: 30, y: 375, orientation: "horizontal", fontSize: 11, fill: "#333", fontWeight: "bold" },
      { text: "จ.นครสวรรค์", x: 230, y: 715, orientation: "horizontal", fontSize: 11, fill: "#333", fontWeight: "bold" },
      { text: "จ.กำแพงเพชร", x: 100, y: 620, orientation: "horizontal", fontSize: 11, fill: "#333", fontWeight: "bold" },
      { text: "จ.พิษณุโลก", x: 450, y: 480, orientation: "horizontal", fontSize: 11, fill: "#333", fontWeight: "bold" },

      { text: "แม่น้ำยม", x: 160, y: 200, orientation: "vertical", fontSize: 10, fill: "#004080", fontWeight: "bold" },
      { text: "แม่น้ำยม", x: 275, y: 610, orientation: "horizontal", fontSize: 8, fill: "#004080", fontWeight: "bold" },
      { text: "แม่น้ำน่าน", x: 385, y: 230, orientation: "vertical", fontSize: 10, fill: "#004080", fontWeight: "bold" },
      { text: "แม่น้ำปิง", x: 65, y: 530, orientation: "vertical", fontSize: 8, fill: "#004080", fontWeight: "bold" },
      { text: "แม่น้ำปิง", x: 185, y: 675, orientation: "horizontal", fontSize: 8, fill: "#004080", fontWeight: "bold" },
      { text: "แม่น้ำสะแกกรัง", x: 185, y: 730, orientation: "horizontal", fontSize: 7, fill: "#004080", fontWeight: "bold" },

      { text: "คลองหกบาท", x: 195, y: 297, orientation: "horizontal", fontSize: 7, fill: "#333" },
      { text: "คลองผันน้ำยม-น่าน", x: 280, y: 297, orientation: "horizontal", fontSize: 7, fill: "#333" },
      { text: "แม่น้ำยมสายเก่า", x: 247, y: 340, orientation: "vertical", fontSize: 7, fill: "#333", fontWeight: "bold" },
      { text: "คลอง DR2.8", x: 275, y: 543, orientation: "horizontal", fontSize: 7, fill: "#333" },
      { text: "คลอง DR15.8", x: 330, y: 480, orientation: "horizontal", fontSize: 7, fill: "#333" },
      { text: "คลองเมม", x: 235, y: 480, orientation: "horizontal", fontSize: 7, fill: "#333" },
    ];

    // สร้างข้อความ
    customTexts.forEach((label, i) => {
    const textGroup = container.append('g')
        .attr('class', 'custom-label')
        .attr('id', `label-${i}`);

    const text = textGroup.append('text')
        .attr('x', label.x)
        .attr('y', label.y)
        .attr('font-size', label.fontSize)
        .attr('fill', label.fill)
        .attr('font-weight', label.fontWeight || 'normal')
        .attr('text-anchor', label.orientation === 'vertical' ? 'middle' : 'start')
        .attr('dominant-baseline', 'middle')
        .text(label.text);

    if (label.orientation === 'vertical') {
        text.attr('transform', `rotate(-90, ${label.x}, ${label.y})`);
    }
    });

    const verticalScaleDataRight = [
        { value: 0,  unit: "ก.ม.", hours: 0, y: 100 }, 
        { value: 74.3,  unit: "ก.ม.", hours: 15, y: 160 },   // จุดบนสุด
        { value: 104.9, unit: "ก.ม.", hours: 23, y: 200 },
        { value: 185.3, unit: "ก.ม.", hours: 44, y: 310 },
        { value: 186.3, unit: "ก.ม.", hours: 44, y: 380 },
        { value: 229.7, unit: "ก.ม.", hours: 55,  y: 450 },
        { value: 315.4, unit: "ก.ม.", hours: 76, y: 520 },
        { value: 394.6, unit: "ก.ม.", hours: 95,  y: 550 },
        { value: 424.6, unit: "ก.ม.", hours: 99.5, y: 580 },
        { value: 467.3, unit: "ก.ม.", hours: 106, y: 670 },
        { value: 565.3, unit: "ก.ม.", hours: 130, y: 700 },
    ];

    // สร้าง group สำหรับเส้นทั้งหมด (เพื่อให้ซูม/แพนไปพร้อมกัน)
    const scaleGroup = container.append("g")
        .attr("class", "vertical-scale-group")
        .attr("transform", "translate(600, 50)");  // ปรับตำแหน่ง x,y ตรงนี้ให้เหมาะกับแผนผัง

    // เส้นแนวตั้งหลัก (แนวเชื่อมจุด)
    scaleGroup.append("line")
        .attr("x1", 0)
        .attr("y1", verticalScaleDataRight[0].y)
        .attr("x2", 0)
        .attr("y2", verticalScaleDataRight[verticalScaleDataRight.length - 1].y)
        .attr("stroke", "#555")
        .attr("stroke-width", 2);

    // จุดวงกลม + ข้อความแต่ละจุด
    verticalScaleDataRight.forEach((d, i) => {
        // วงกลม
        scaleGroup.append("circle")
        .attr("cx", 0)
        .attr("cy", d.y)
        .attr("r", 5)
        .attr("fill", i === 0 || i === verticalScaleDataRight.length - 1 ? "#0066cc" : "#444")
        .attr("stroke", "#fff")
        .attr("stroke-width", 2);

        if (i === 0) return;

        // ข้อความระยะทาง + วัน
        const label = scaleGroup.append("text")
        .attr("x", 18)                    // ขยับไปทางขวาเล็กน้อย
        .attr("y", d.y)
        .attr("dy", "0.35em")             // จัดกึ่งกลางแนวตั้ง
        .attr("font-size", "8px")
        .attr("fill", "#333")
        .attr("font-family", "Prompt, sans-serif");

        label.append("tspan")
        .attr("x", 18)
        .attr("dy", 0)
        .text(`${d.value} ก.ม.`);

        label.append("tspan")
        .attr("x", 18)
        .attr("dy", "0.9em")
        .attr("fill", "#0066cc")
        .attr("font-weight", "bold")
        .text(`(${d.hours} ชม.)`);
    });

    const verticalScaleDataYom = [
        { value: 0,  unit: "ก.ม.", hours: 0, y: 100 }, 
        { value: 193,  unit: "ก.ม.", hours: 51, y: 160 },   // จุดบนสุด
        { value: 226.9, unit: "ก.ม.", hours: 56, y: 230 },
        { value: 233.8, unit: "ก.ม.", hours: 57, y: 255 },
        { value: 290.6, unit: "ก.ม.", hours: 68, y: 290 },
        { value: 380.2, unit: "ก.ม.", hours: 91,  y: 400 },
        { value: 381.2, unit: "ก.ม.", hours: 91, y: 450 },
        { value: 430.2, unit: "ก.ม.", hours: 102,  y: 500 },
        { value: 501.1, unit: "ก.ม.", hours: 122, y: 540 },
    ];

    // สร้าง group สำหรับเส้นทั้งหมด (เพื่อให้ซูม/แพนไปพร้อมกัน)
    const scaleGroupYom = container.append("g")
        .attr("class", "vertical-scale-group")
        .attr("transform", "translate(20, 80)");  // ปรับตำแหน่ง x,y ตรงนี้ให้เหมาะกับแผนผัง

    // เส้นแนวตั้งหลัก (แนวเชื่อมจุด)
    scaleGroupYom.append("line")
        .attr("x1", 0)
        .attr("y1", verticalScaleDataYom[0].y)
        .attr("x2", 0)
        .attr("y2", verticalScaleDataYom[verticalScaleDataYom.length - 1].y)
        .attr("stroke", "#555")
        .attr("stroke-width", 2);

    // จุดวงกลม + ข้อความแต่ละจุด
    verticalScaleDataYom.forEach((d, i) => {
        // วงกลม
        scaleGroupYom.append("circle")
        .attr("cx", 0)
        .attr("cy", d.y)
        .attr("r", 5)
        .attr("fill", i === 0 || i === verticalScaleDataYom.length - 1 ? "#0066cc" : "#444")
        .attr("stroke", "#fff")
        .attr("stroke-width", 2);

        if (i === 0) return;

        // ข้อความระยะทาง + วัน
        const label = scaleGroupYom.append("text")
        .attr("x", -48)                    // ขยับไปทางขวาเล็กน้อย
        .attr("y", d.y)
        .attr("dy", "0.35em")             // จัดกึ่งกลางแนวตั้ง
        .attr("font-size", "8px")
        .attr("fill", "#333")
        .attr("font-family", "Prompt, sans-serif");

        label.append("tspan")
        .attr("x", -48)
        .attr("dy", 0)
        .text(`${d.value} ก.ม.`);

        label.append("tspan")
        .attr("x", -48)
        .attr("dy", "0.9em")
        .attr("fill", "#0066cc")
        .attr("font-weight", "bold")
        .text(`(${d.hours} ชม.)`);
    });

    // ===============================================================================================================
    // ข้อมูลป้าย (ปรับขนาดและตำแหน่งได้ตามต้องการ)
    // ===============================================================================================================
    const patrolSigns = [
      { label: ["อยู่ระหว่างก่อสร้าง"], color: "#ff9800", x: 55, y: 165, width: 20, height: 6, orientation: "horizontal" },
      { label: ["ก่อสร้างแล้วเสร็จ"], color: "#9e9e9e", x: 55, y: 185, width: 20, height: 6, orientation: "horizontal" },
      { label: ["ฝายจมน้ำ"], color: "#ffeb3b", x: 55, y: 205, width: 20, height: 6, orientation: "horizontal" },

      { label: ["ปตร.คลองหกบาท"], color: "#9e9e9e", x: 187, y: 285, width: 5, height: 20, orientation: "vertical" },
      { label: ["ปตร.คลองตะคร้อ"], color: "#9e9e9e", x: 255, y: 285, width: 5, height: 20, orientation: "vertical" },
      { label: ["ปตร.ใหม่", "(กม.23+436)"], color: "#9e9e9e", x: 275, y: 285, width: 5, height: 20, orientation: "vertical" },
      { label: ["ปตร.คลองกล้วย"], color: "#9e9e9e", x: 340, y: 285, width: 5, height: 20, orientation: "vertical" },

      { label: ["ฝายแม่ยม"], color: "#9e9e9e", x: 163, y: 150, width: 20, height: 6, orientation: "horizontal" },
      { label: ["ปตร.บ้านหาดสะพานจันทร์"], color: "#9e9e9e", x: 163, y: 308, width: 20, height: 5, orientation: "horizontal" },
      { label: ["ปตร.ยางซ้าย"], color: "#9e9e9e", x: 163, y: 390, width: 20, height: 5, orientation: "horizontal" },
      { label: ["ปตร.วังสะตือ"], color: "#9e9e9e", x: 193, y: 443, width: 20, height: 5, orientation: "horizontal" },
      { label: ["ฝายยางบางบ้า"], color: "#ffeb3b", x: 193, y: 455, width: 20, height: 5, orientation: "horizontal" },
      { label: ["ปตร.ท่านางงาม"], color: "#9e9e9e", x: 193, y: 469, width: 20, height: 5, orientation: "horizontal" },
      { label: ["ปตร.ท่าแห"], color: "#9e9e9e", x: 193, y: 555, width: 20, height: 5, orientation: "horizontal" },
      { label: ["ปตร.สามง่าม"], color: "#9e9e9e", x: 193, y: 595, width: 20, height: 5, orientation: "horizontal" },
    ];

    // 2. กำหนดเงา (ใส่ครั้งเดียว)
    svg.append("defs").append("filter")
    .attr("id", "patrol-shadow-simple")
    .attr("x", "-20%")
    .attr("y", "-20%")
    .attr("width", "140%")
    .attr("height", "140%")
    .append("feGaussianBlur")
        .attr("stdDeviation", 1.5)
        .attr("result", "blur");

    svg.select("#patrol-shadow-simple")
    .append("feOffset")
        .attr("in", "blur")
        .attr("dx", 1.5)
        .attr("dy", 1.5)
        .attr("result", "offsetBlur");

    svg.select("#patrol-shadow-simple")
    .append("feMerge")
        .selectAll("feMergeNode")
        .data(["offsetBlur", "SourceGraphic"])
        .enter()
        .append("feMergeNode")
        .attr("in", d => d);

    // 3. สร้าง group หลัก
    const patrolGroup = container.append("g")
    .attr("class", "patrol-signs");

    // 4. วาดแต่ละป้าย
    patrolSigns.forEach(sign => {
    const isVertical = sign.orientation === "vertical";

    // ป้ายหลัก - มุมเหลี่ยม
    patrolGroup.append("rect")
        .attr("x", sign.x)
        .attr("y", sign.y)
        .attr("width", sign.width)
        .attr("height", sign.height)
        .attr("rx", 0)
        .attr("ry", 0)
        .attr("fill", sign.color)
        .attr("stroke", "#666")
        .attr("stroke-width", 0.8);

    // เงา
    patrolGroup.append("rect")
        .attr("x", sign.x + 1.5)
        .attr("y", sign.y + 1.5)
        .attr("width", sign.width)
        .attr("height", sign.height)
        .attr("rx", 0)
        .attr("ry", 0)
        .attr("fill", "rgba(0,0,0,0.12)")
        .attr("filter", "url(#patrol-shadow-simple)");

    // ข้อความด้านนอก
    const text = patrolGroup.append("text")
        .attr("font-size", "7px")
        .attr("font-weight", "500")
        .attr("fill", "#222")
        .attr("font-family", "Prompt, sans-serif")

    if (isVertical) {
      // แนวตั้ง → ข้อความเรียงจากบนลงล่าง
      text
        .attr("x", sign.x + sign.width / 2)
        .attr("y", sign.y + sign.height - 28)  // เริ่มจากล่างขึ้นบน
        .attr("transform", `rotate(-90, ${sign.x + sign.width / 2}, ${sign.y + sign.height - 23})`)
        .attr("text-anchor", "start")
        .attr("dominant-baseline", "hanging");

      // วาดแต่ละบรรทัดด้วย <tspan>
      sign.label.forEach((line, i) => {
        text.append("tspan")
          .attr("x", sign.x + sign.width / 2)
          .attr("dy", i === 0 ? "0em" : "1.2em")
          .text(line);
      });
    } else {
        text
        .attr("x", sign.x + sign.width + 5)  
        .attr("y", sign.y + sign.height / 2)
        .attr("dy", "0.35em")
        .attr("text-anchor", "start");

        sign.label.forEach((line, i) => {
          text.append("tspan")
            .attr("x", sign.x + sign.width + 5)
            .attr("dy", i === 0 ? "0em" : "1.2em")
            .text(line);
        });
    }
    });

  }, [reservoirs, flows, theme.palette.mode]);

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedStation(undefined);
    setSelectedName('');
    setSelectedType(undefined);
  };

  if (loading) return <CircularProgress />;
  if (error) return <Typography color="error">Error: {error}</Typography>;

  return (
    <Box sx={{ p: 2, bgcolor: 'background.default', minHeight: '100vh', position: 'relative' }}>
      <Typography variant="h5" id="card-daily" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
        แผนผังสถานการณ์น้ำประจำวันที่ {formatThaiDay(reservoirs[0]?.date) || 'ล่าสุด'}
      </Typography>

      <Paper elevation={1} sx={{ p: 2, overflowX: 'auto', borderRadius: 2, position: 'relative' }}>
        <svg ref={svgRef} style={{ width: '100%', height: 'auto', minHeight: '900px' }} />
      </Paper>

      {/* ปุ่มควบคุมซูม */}
      <Box sx={{ position: 'fixed', top: 85, right: 40, display: 'flex', flexDirection: 'column', gap: 1, zIndex: 10 }}>
        <IconButton color="primary" onClick={zoomIn} title="ซูมเข้า">
          <ZoomInIcon />
        </IconButton>
        <IconButton color="primary" onClick={zoomOut} title="ซูมออก">
          <ZoomOutIcon />
        </IconButton>
        <IconButton color="primary" onClick={fitToView} title="ปรับให้พอดีหน้าจอ">
          <AspectRatioIcon />
        </IconButton>
      </Box>

      <Box mt={3} textAlign="center">
        <Typography variant="body2" color="text.secondary">
          • เขียว = ปกติ (&gt;70%) &nbsp; เหลือง = เฝ้าระวัง (40-70%) &nbsp; แดง = วิกฤต (&lt;40%)
          <br />
          ข้อมูลจาก API: https://app.rid.go.th/reservoir/api/reservoir/public
        </Typography>
      </Box>

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
          <Typography variant="h5">{`รายละเอียดสถานี ${selectedName}`}</Typography>
          <IconButton aria-label="close" onClick={handleCloseDialog}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 2 }}>
          {selectedStation && selectedType === 'reservoir' ? (
            <DataReservoirStation propsSelectedStation={selectedStation} />
          ) : selectedStation && selectedType === 'flow' ? (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <DataFlowCombined propsSelectedStation={selectedStation} />
              <Typography>ข้อมูลสถานีไหล: {selectedStation}</Typography>
            </Box>
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