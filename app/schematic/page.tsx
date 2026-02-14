'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Box, Typography, Paper, useTheme, CircularProgress } from '@mui/material';
import * as d3 from 'd3';
import { API_URL } from '@/lib/utility';
import { useRouter } from 'next/navigation';

interface ReservoirNode {
  imageUrl: string;
  id: string;
  name: string;
  res_code: string;
  province: string;
  x: number;  // คำนวณหรือ hardcode
  y: number;
  volume: number;
  inflow: number;
  outflow: number;
  percent: number;  // p จาก API
  date: string;
  detailUrl?: string;
}

const WaterSchematicSimple: React.FC = () => {
  const router = useRouter();
  const svgRef = useRef<SVGSVGElement>(null);
  const theme = useTheme();
  const [reservoirs, setReservoirs] = useState<ReservoirNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${API_URL}/api/daily/reservoir`);
        if (!res.ok) throw new Error('Failed to fetch');
        const json = await res.json();
        const data = json.data || [];

        // Map ข้อมูล API → Node พร้อมตำแหน่ง (hardcode ตาม lat/long ประมาณ)
        const mapped: ReservoirNode[] = data.map((item: any) => {
            let x = 400, y = 600;
            let imageUrl = ''; // default

            switch (item.res_code.toLowerCase()) {
                case 'ks': // กระเสียว
                x = 420; y = 650;
                imageUrl = 'https://mediaim.expedia.com/localexpert/359909/some-krasiao-dam-image.jpg'; // ตัวอย่างจาก Tripadvisor Krasiao Dam (แทนด้วย URL จริง)
                break;
                case 'hkk': // ห้วยขุนแก้ว
                x = 380; y = 250;
                imageUrl = 'https://example.com/huay-khun-kaew-reservoir.jpg'; // หา URL จริงจาก Facebook หรือ Google
                break;
                case 'ht': // ห้วยเทียน
                x = 440; y = 700;
                imageUrl = 'https://example.com/huay-thian-reservoir.jpg'; // จาก Facebook เขื่อนห้วยเทียน
                break;
                case 'hnl': // ห้วยหนองโรง
                x = 460; y = 350;
                imageUrl = 'https://example.com/huay-nong-rong-reservoir.jpg'; // จาก TrueID หรือ Facebook
                break;
                case 'htd': // ห้วยท่าเดื่อ
                x = 360; y = 550;
                imageUrl = 'https://example.com/huay-tha-due-reservoir.jpg'; // จาก Facebook Suphanburi
                break;
                default: break;
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
            detailUrl: `http://localhost:3000//reservoir?tab=0&station=${item.res_code.toLowerCase()}`,
          };
        });

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

    // พื้นหลังขาว (เหมือนใน SVG เดิม)
    svg.append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', 'white');

    // วาด rect ทั้งหมดจาก SVG ที่คุณส่งมา (สีฟ้าเข้ม/อ่อน)
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

    // // ลูกศร marker
    // svg.append("defs")
    // .append("marker")
    // .attr("id", "arrow")
    // .attr("viewBox", "0 0 10 10")
    // .attr("refX", 8)
    // .attr("refY", 5)
    // .attr("markerWidth", 8)
    // .attr("markerHeight", 8)
    // .attr("orient", "auto-start-reverse")
    // .append("path")
    // .attr("d", "M 0 0 L 10 5 L 0 10 z")
    // .attr("fill", "#000");

    //  // Define a sample flow path for the arrow to follow
    //  const flowLine = svg.append("path")
    //   .attr("d", "M 200 200 Q 300 100 400 200") // Example quadratic curve
    //   .attr("fill", "none")
    //   .attr("stroke", "#000")
    //   .attr("stroke-width", 2);

    //  const arrow = svg.append("circle")
    //   .attr("r", 5)
    //   .attr("fill", "black");

    //   function animateArrow() {
    //     arrow
    //       .transition()
    //       .duration(3000)
    //       .ease(d3.easeLinear)
    //       .attrTween("transform", function () {
    //         const path = flowLine.node() as SVGPathElement;
    //         const length = path.getTotalLength();
    //         return function (t) {
    //           const point = path.getPointAtLength(t * length);
    //           return `translate(${point.x},${point.y})`;
    //         };
    //       })
    //       .on("end", animateArrow);
    //   }

    //   animateArrow();
    const nodeGroup = svg.selectAll<SVGGElement, ReservoirNode>('.reservoir-node')
        .data(reservoirs)
        .enter()
        .append('g')
        .attr('class', 'reservoir-node')
        .attr('transform', d => `translate(${d.x}, ${d.y})`)
        .style('cursor', 'pointer')
        .on('click', (event, d) => {
            if (d.detailUrl) {
            router.push(d.detailUrl);
            }
        });

        // ไอคอน (ใช้ <image> SVG tag)
        nodeGroup.append('image')
        .attr('xlink:href', d => {
            // ถ้ามีรูปเฉพาะอ่างใช้ d.imageUrl ถ้ามี
            // fallback ใช้ไอคอนฟรีเดียวกัน
            return d.imageUrl || 'https://cdn-icons-png.flaticon.com/512/3079/3079322.png'; // dam icon
        })
        .attr('x', -40)          // กึ่งกลางไอคอน (ปรับขนาด)
        .attr('y', -80)          // วางด้านบน
        .attr('width', 80)
        .attr('height', 80)
        .style('pointer-events', 'none'); // ไม่ให้คลิกทับ group

        // ชื่ออ่าง (ด้านบนไอคอน)
        nodeGroup.append('text')
        .attr('text-anchor', 'middle')
        .attr('y', -90)          // เหนือไอคอน
        .attr('font-size', 14)
        .attr('font-weight', 'bold')
        .attr('fill', theme.palette.text.primary)
        .text(d => d.name);

        // ข้อมูลตัวเลขด้านล่างไอคอน (หลายบรรทัด)
        nodeGroup.append('text')
        .attr('text-anchor', 'middle')
        .attr('y', 20)           // ใต้ไอคอน
        .attr('font-size', 13)
        .attr('fill', theme.palette.text.primary)
        .text(d => `${d.percent.toFixed(2)}% - ${d.volume.toFixed(2)} MCM`);

        nodeGroup.append('text')
        .attr('text-anchor', 'middle')
        .attr('y', 38)
        .attr('font-size', 11)
        .attr('fill', theme.palette.text.secondary)
        .text(d => `In: ${d.inflow.toFixed(3)} / Out: ${d.outflow.toFixed(3)}`);

    // สี่เหลี่ยมโหนด สีตาม %
    // nodeGroup.append('rect')
    //   .attr('width', 180)
    //   .attr('height', 90)
    //   .attr('x', -90)
    //   .attr('y', -45)
    //   .attr('rx', 12)
    //   .attr('fill', d => {
    //     if (d.percent < 40) return '#ef5350';     // วิกฤต
    //     if (d.percent < 70) return '#ffb74d';     // เฝ้าระวัง
    //     return '#66bb6a';                         // ปกติ
    //   })
    //   .attr('stroke', theme.palette.divider)
    //   .attr('stroke-width', 2);

    // // ชื่อ + จังหวัด
    // nodeGroup.append('text')
    //   .attr('text-anchor', 'middle')
    //   .attr('y', -20)
    //   .attr('font-size', 14)
    //   .attr('font-weight', 'bold')
    //   .attr('fill', 'white')
    //   .text(d => d.name);

    // % ความจุ + volume
    // nodeGroup.append('text')
    //   .attr('text-anchor', 'middle')
    //   .attr('y', 0)
    //   .attr('font-size', 13)
    //   .attr('fill', 'white')
    //   .text(d => `${d.percent.toFixed(2)}%`);

    // nodeGroup.append('text')
    //   .attr('text-anchor', 'middle')
    //   .attr('y', 20)
    //   .attr('font-size', 12)
    //   .attr('fill', 'white')
    //   .text(d => `${d.volume.toFixed(2)} MCM`);

    // // inflow / outflow (เล็ก ๆ)
    // nodeGroup.append('text')
    //   .attr('text-anchor', 'middle')
    //   .attr('y', 38)
    //   .attr('font-size', 11)
    //   .attr('fill', '#e0e0e0')
    //   .text(d => `In: ${d.inflow.toFixed(3)} / Out: ${d.outflow.toFixed(3)}`);

  }, [reservoirs, theme.palette.mode]);

  if (loading) return <CircularProgress />;
  if (error) return <Typography color="error">Error: {error}</Typography>;

  return (
    <Box sx={{ p: 3, bgcolor: 'background.default', minHeight: '100vh' }}>
      <Typography variant="h5" gutterBottom>
        แผนผังอ่างเก็บน้ำ (ข้อมูลจริงจาก API - {reservoirs[0]?.date || 'ล่าสุด'})
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
    </Box>
  );
};

export default WaterSchematicSimple;