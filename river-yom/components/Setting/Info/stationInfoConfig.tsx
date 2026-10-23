import React from "react";
import WaterDropIcon from "@mui/icons-material/WaterDrop";
import WavesIcon from "@mui/icons-material/Waves";
import WaterIcon from "@mui/icons-material/Water";
import SensorsIcon from "@mui/icons-material/Sensors";
import DamIcon from "@mui/icons-material/Landscape";
import PoolIcon from "@mui/icons-material/Pool";

export type StationFieldType = "text" | "number";

export interface StationField {
  name: string;
  label: string;
  section: string;
  type?: StationFieldType;
  required?: boolean;
  placeholder?: string;
  multiline?: boolean;
  span?: 1 | 2;
  readOnly?: boolean;
}

export interface StationInfoConfig {
  key: string;
  endpoint: string;
  idField: string;
  nameField: string;
  title: string;
  subtitle: string;
  addLabel: string;
  searchPlaceholder: string;
  emptyText: string;
  accent: string;
  icon: React.ReactElement;
  imageFolder?: string;
  fields: StationField[];
  tableColumns: string[];
  requiredFields: string[];
}

export const RAIN_STATION_CONFIG: StationInfoConfig = {
  key: "rain",
  endpoint: "/api/rain_info",
  idField: "sta_code",
  nameField: "name",
  title: "สถานีวัดน้ำฝน",
  subtitle: "จัดการข้อมูลและรูปภาพของสถานีวัดปริมาณน้ำฝน",
  addLabel: "เพิ่มสถานีน้ำฝน",
  searchPlaceholder: "ค้นหารหัส หรือชื่อสถานีน้ำฝน...",
  emptyText: "ยังไม่มีข้อมูลสถานีวัดน้ำฝน",
  accent: "#0288D1",
  icon: <WaterDropIcon />,
  imageFolder: "rain_station",
  requiredFields: ["sta_code", "name"],
  tableColumns: ["sta_code", "name", "district", "province", "owner"],
  fields: [
    { name: "sta_code", label: "รหัสสถานี", section: "ข้อมูลสถานี", required: true, placeholder: "เช่น YOM001" },
    { name: "name", label: "ชื่อสถานี", section: "ข้อมูลสถานี", required: true, placeholder: "ชื่อสถานีวัดน้ำฝน" },
    { name: "owner", label: "หน่วยงานเจ้าของสถานี", section: "ข้อมูลสถานี", placeholder: "เช่น กรมชลประทาน" },
    { name: "tambon", label: "ตำบล", section: "ที่ตั้ง", placeholder: "ตำบล" },
    { name: "district", label: "อำเภอ", section: "ที่ตั้ง", placeholder: "อำเภอ" },
    { name: "province", label: "จังหวัด", section: "ที่ตั้ง", placeholder: "จังหวัด" },
    { name: "lat", label: "ละติจูด", section: "พิกัด", type: "number", placeholder: "เช่น 16.4821" },
    { name: "long", label: "ลองจิจูด", section: "พิกัด", type: "number", placeholder: "เช่น 100.1245" },
  ],
};

export const FLOW_STATION_CONFIG: StationInfoConfig = {
  key: "flow",
  endpoint: "/api/flow_info",
  idField: "sta_code",
  nameField: "sta_name",
  title: "สถานีวัดน้ำท่า",
  subtitle: "จัดการข้อมูลและรูปภาพของสถานีตรวจวัดปริมาณน้ำท่า",
  addLabel: "เพิ่มสถานีน้ำท่า",
  searchPlaceholder: "ค้นหารหัส หรือชื่อสถานีน้ำท่า...",
  emptyText: "ยังไม่มีข้อมูลสถานีวัดน้ำท่า",
  accent: "#00897B",
  icon: <WavesIcon />,
  imageFolder: "flow_station",
  requiredFields: ["sta_code", "sta_name"],
  tableColumns: ["sta_code", "sta_name", "river", "district", "capacity"],
  fields: [
    { name: "sta_code", label: "รหัสสถานี", section: "ข้อมูลสถานี", required: true, placeholder: "เช่น Y.15" },
    { name: "sta_name", label: "ชื่อสถานี", section: "ข้อมูลสถานี", required: true, placeholder: "ชื่อสถานีวัดน้ำท่า" },
    { name: "river", label: "แม่น้ำ", section: "ข้อมูลสถานี", placeholder: "ชื่อแม่น้ำ" },
    { name: "tambon", label: "ตำบล", section: "ที่ตั้ง", placeholder: "ตำบล" },
    { name: "district", label: "อำเภอ", section: "ที่ตั้ง", placeholder: "อำเภอ" },
    { name: "province", label: "จังหวัด", section: "ที่ตั้ง", placeholder: "จังหวัด" },
    { name: "da_km2", label: "พื้นที่รับน้ำ (ตร.กม.)", section: "ข้อมูลทางน้ำ", type: "number", placeholder: "เช่น 1200" },
    { name: "capacity", label: "ความจุลำน้ำ (ลบ.ม./วินาที)", section: "ข้อมูลทางน้ำ", type: "number", placeholder: "เช่น 350" },
    { name: "lat", label: "ละติจูด", section: "พิกัด", type: "number", placeholder: "เช่น 16.4821" },
    { name: "long", label: "ลองจิจูด", section: "พิกัด", type: "number", placeholder: "เช่น 100.1245" },
  ],
};

export const GATE_STATION_CONFIG: StationInfoConfig = {
  key: "gate",
  endpoint: "/api/gate_info",
  idField: "sta_code",
  nameField: "sta_name",
  title: "ประตูระบายน้ำ",
  subtitle: "จัดการข้อมูลและรูปภาพของประตูระบายน้ำ",
  addLabel: "เพิ่มประตูระบายน้ำ",
  searchPlaceholder: "ค้นหารหัส หรือชื่อประตูระบายน้ำ...",
  emptyText: "ยังไม่มีข้อมูลประตูระบายน้ำ",
  accent: "#5E35B1",
  icon: <WaterIcon />,
  imageFolder: "gate",
  requiredFields: ["sta_code", "sta_name", "gate_no", "gate_height"],
  tableColumns: ["sta_code", "sta_name", "district", "gate_no", "capacity"],
  fields: [
    { name: "sta_code", label: "รหัสสถานี", section: "ข้อมูลสถานี", required: true, placeholder: "เช่น G.01" },
    { name: "sta_name", label: "ชื่อประตูระบายน้ำ", section: "ข้อมูลสถานี", required: true, placeholder: "ชื่อประตูระบายน้ำ" },
    { name: "type", label: "ประเภทประตู", section: "ข้อมูลประตู", placeholder: "เช่น ประตูระบายน้ำ" },
    { name: "gate_no", label: "จำนวนบานระบาย", section: "ข้อมูลประตู", type: "number", required: true, placeholder: "เช่น 4" },
    { name: "gate_height", label: "ความสูงบาน (เมตร)", section: "ข้อมูลประตู", type: "number", required: true, placeholder: "เช่น 3.50" },
    { name: "capacity", label: "ความจุ (ลบ.ม./วินาที)", section: "ข้อมูลประตู", type: "number", placeholder: "เช่น 120" },
    { name: "tambon", label: "ตำบล", section: "ที่ตั้ง", placeholder: "ตำบล" },
    { name: "district", label: "อำเภอ", section: "ที่ตั้ง", placeholder: "อำเภอ" },
    { name: "province", label: "จังหวัด", section: "ที่ตั้ง", placeholder: "จังหวัด" },
    { name: "lat", label: "ละติจูด", section: "พิกัด", type: "number", placeholder: "เช่น 16.4821" },
    { name: "long", label: "ลองจิจูด", section: "พิกัด", type: "number", placeholder: "เช่น 100.1245" },
  ],
};

export const TELE_STATION_CONFIG: StationInfoConfig = {
  key: "tele",
  endpoint: "/api/tele_info",
  idField: "sta_code",
  nameField: "sta_name",
  title: "สถานีติดตั้งโครงการ",
  subtitle: "จัดการข้อมูลและรูปภาพของสถานีโทรมาตร",
  addLabel: "เพิ่มสถานีโทรมาตร",
  searchPlaceholder: "ค้นหารหัส หรือชื่อสถานีโทรมาตร...",
  emptyText: "ยังไม่มีข้อมูลสถานีติดตั้งโครงการ",
  accent: "#28378B",
  icon: <SensorsIcon />,
  imageFolder: "tele",
  requiredFields: ["sta_code", "sta_name"],
  tableColumns: ["sta_code", "sta_name", "river", "district", "capacity"],
  fields: [
    { name: "sta_code", label: "รหัสสถานี", section: "ข้อมูลสถานี", required: true, placeholder: "เช่น YR.01" },
    { name: "sta_name", label: "ชื่อสถานี", section: "ข้อมูลสถานี", required: true, placeholder: "ชื่อสถานีโทรมาตร" },
    { name: "river", label: "แม่น้ำ", section: "ข้อมูลสถานี", placeholder: "ชื่อแม่น้ำ" },
    { name: "tambon", label: "ตำบล", section: "ที่ตั้ง", placeholder: "ตำบล" },
    { name: "district", label: "อำเภอ", section: "ที่ตั้ง", placeholder: "อำเภอ" },
    { name: "province", label: "จังหวัด", section: "ที่ตั้ง", placeholder: "จังหวัด" },
    { name: "capacity", label: "ความจุลำน้ำ (ลบ.ม./วินาที)", section: "ข้อมูลทางน้ำ", type: "number", placeholder: "เช่น 350" },
    { name: "lat", label: "ละติจูด", section: "พิกัด", type: "number", placeholder: "เช่น 16.4821" },
    { name: "long", label: "ลองจิจูด", section: "พิกัด", type: "number", placeholder: "เช่น 100.1245" },
  ],
};

export const RESERVOIR_STATION_CONFIG: StationInfoConfig = {
  key: "reservoir",
  endpoint: "/api/reservoir_info",
  idField: "res_code",
  nameField: "res_name",
  title: "อ่างเก็บน้ำ",
  subtitle: "จัดการข้อมูลและรูปภาพของอ่างเก็บน้ำ",
  addLabel: "เพิ่มอ่างเก็บน้ำ",
  searchPlaceholder: "ค้นหารหัส หรือชื่ออ่างเก็บน้ำ...",
  emptyText: "ยังไม่มีข้อมูลอ่างเก็บน้ำ",
  accent: "#00695C",
  icon: <DamIcon />,
  requiredFields: ["res_code", "rid_code", "res_name"],
  tableColumns: ["res_code", "res_name", "district", "type", "size"],
  fields: [
    { name: "res_code", label: "รหัสอ่างเก็บน้ำ", section: "ข้อมูลอ่างเก็บน้ำ", required: true, placeholder: "เช่น R.01" },
    { name: "rid_code", label: "รหัสกรมชลประทาน", section: "ข้อมูลอ่างเก็บน้ำ", required: true, placeholder: "รหัสจากกรมชลประทาน" },
    { name: "res_name", label: "ชื่ออ่างเก็บน้ำ", section: "ข้อมูลอ่างเก็บน้ำ", required: true, placeholder: "ชื่ออ่างเก็บน้ำ" },
    { name: "type", label: "ชนิด", section: "ข้อมูลอ่างเก็บน้ำ", placeholder: "เช่น หลัก / รอง" },
    { name: "size", label: "ขนาดเขื่อน", section: "ข้อมูลอ่างเก็บน้ำ", placeholder: "เช่น ใหญ่ / กลาง / เล็ก" },
    { name: "owner", label: "หน่วยงานเจ้าของ", section: "ข้อมูลอ่างเก็บน้ำ", placeholder: "หน่วยงานเจ้าของเขื่อน" },
    { name: "tambon", label: "ตำบล", section: "ที่ตั้ง", placeholder: "ตำบล" },
    { name: "district", label: "อำเภอ", section: "ที่ตั้ง", placeholder: "อำเภอ" },
    { name: "province", label: "จังหวัด", section: "ที่ตั้ง", placeholder: "จังหวัด" },
    { name: "lat", label: "ละติจูด", section: "พิกัด", type: "number", placeholder: "เช่น 16.4821" },
    { name: "long", label: "ลองจิจูด", section: "พิกัด", type: "number", placeholder: "เช่น 100.1245" },
    { name: "da_km2", label: "พื้นที่รับน้ำ (ตร.กม.)", section: "พิกัด", type: "number", placeholder: "เช่น 1200" },
    { name: "maxvol", label: "ปริมาตรน้ำสูงสุด (ล้าน ลบ.ม.)", section: "ความจุ", type: "number", placeholder: "เช่น 120" },
    { name: "nhvol", label: "ปริมาตรน้ำเก็บกัก (ล้าน ลบ.ม.)", section: "ความจุ", type: "number", placeholder: "เช่น 100" },
    { name: "minvol", label: "ปริมาตรน้ำต่ำสุด (ล้าน ลบ.ม.)", section: "ความจุ", type: "number", placeholder: "เช่น 10" },
    { name: "maxwl", label: "ระดับน้ำสูงสุด (ม.รทก.)", section: "ระดับน้ำ", type: "number", placeholder: "เช่น 45.20" },
    { name: "nhwl", label: "ระดับน้ำเก็บกัก (ม.รทก.)", section: "ระดับน้ำ", type: "number", placeholder: "เช่น 43.50" },
    { name: "minwl", label: "ระดับน้ำต่ำสุด (ม.รทก.)", section: "ระดับน้ำ", type: "number", placeholder: "เช่น 38.10" },
    { name: "inflow_avg", label: "ปริมาณน้ำไหลเข้าเฉลี่ย (ล้าน ลบ.ม./ปี)", section: "อื่น ๆ", type: "number", placeholder: "เช่น 85" },
  ],
};

export const SEA_STATION_CONFIG: StationInfoConfig = {
  key: "sea",
  endpoint: "/api/sea_info",
  idField: "sta_code",
  nameField: "name",
  title: "สถานีน้ำทะเล",
  subtitle: "จัดการข้อมูลและรูปภาพของสถานีน้ำทะเล",
  addLabel: "เพิ่มสถานีน้ำทะเล",
  searchPlaceholder: "ค้นหารหัส หรือชื่อสถานีน้ำทะเล...",
  emptyText: "ยังไม่มีข้อมูลสถานีน้ำทะเล",
  accent: "#0277BD",
  icon: <PoolIcon />,
  requiredFields: ["sta_code", "name"],
  tableColumns: ["sta_code", "name", "district", "province"],
  fields: [
    { name: "sta_code", label: "รหัสสถานี", section: "ข้อมูลสถานี", required: true, placeholder: "เช่น S.01" },
    { name: "name", label: "ชื่อสถานี", section: "ข้อมูลสถานี", required: true, placeholder: "ชื่อสถานีน้ำทะเล" },
    { name: "tambon", label: "ตำบล", section: "ที่ตั้ง", placeholder: "ตำบล" },
    { name: "district", label: "อำเภอ", section: "ที่ตั้ง", placeholder: "อำเภอ" },
    { name: "province", label: "จังหวัด", section: "ที่ตั้ง", placeholder: "จังหวัด" },
    { name: "lat", label: "ละติจูด", section: "พิกัด", type: "number", placeholder: "เช่น 16.4821" },
    { name: "long", label: "ลองจิจูด", section: "พิกัด", type: "number", placeholder: "เช่น 100.1245" },
  ],
};
