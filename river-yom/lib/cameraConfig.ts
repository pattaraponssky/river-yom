// lib/cameraConfig.ts


export interface CameraConfig {
  [x: string]: any;
  id: string;
  label: string;
  streamUrl: string;
  type: 'mjpeg' | 'hls' | 'embed' | 'snapshot' | 'wss';
  snapshotUrl?: string;
}

// ── กล้อง wms-rio3.rid.go.th ────────────────────────────────────────────
const RIO3_WS_BASE = 'wss://wms-yom-right.rid.go.th/cctv-relay/camera'; 

const tngCameras: CameraConfig[] = [
  { id: 'rio3a-14', label: 'ภาพรวม 1',  type: 'wss', streamUrl: `${RIO3_WS_BASE}/tng_1` },
  { id: 'rio3a-15', label: 'ภาพรวม 2',  type: 'wss', streamUrl: `${RIO3_WS_BASE}/tng_2` },
  { id: 'rio3a-09', label: 'บานประตู 1', type: 'wss', streamUrl: `${RIO3_WS_BASE}/tng_gate1` },
  { id: 'rio3a-10', label: 'บานประตู 2', type: 'wss', streamUrl: `${RIO3_WS_BASE}/tng_gate2` },
  { id: 'rio3a-11', label: 'บานประตู 3', type: 'wss', streamUrl: `${RIO3_WS_BASE}/tng_gate3` },
  { id: 'rio3a-12', label: 'บานประตู 4', type: 'wss', streamUrl: `${RIO3_WS_BASE}/tng_gate4` },
  { id: 'rio3a-13', label: 'บานประตู 5', type: 'wss', streamUrl: `${RIO3_WS_BASE}/tng_gate5` },
];

const wstCameras: CameraConfig[] = [
  { id: 'rio3b-18', label: 'ภาพรวม 1',  type: 'wss', streamUrl: `${RIO3_WS_BASE}/wst_1` },
  { id: 'rio3b-19', label: 'ภาพรวม 2',  type: 'wss', streamUrl: `${RIO3_WS_BASE}/wst_2` },
  { id: 'rio3b-11', label: 'บานประตู 1', type: 'wss', streamUrl: `${RIO3_WS_BASE}/wst_gate1` },
  { id: 'rio3b-12', label: 'บานประตู 2', type: 'wss', streamUrl: `${RIO3_WS_BASE}/wst_gate2` },
  { id: 'rio3b-13', label: 'บานประตู 3', type: 'wss', streamUrl: `${RIO3_WS_BASE}/wst_gate3` },
  { id: 'rio3b-14', label: 'บานประตู 4', type: 'wss', streamUrl: `${RIO3_WS_BASE}/wst_gate4` },
  { id: 'rio3b-15', label: 'บานประตู 5', type: 'wss', streamUrl: `${RIO3_WS_BASE}/wst_gate5` },
  { id: 'rio3b-16', label: 'บานประตู 6', type: 'wss', streamUrl: `${RIO3_WS_BASE}/wst_gate6` },
  { id: 'rio3b-17', label: 'บานประตู 7', type: 'wss', streamUrl: `${RIO3_WS_BASE}/wst_gate7` },
];

const kpkCameras: CameraConfig[] = [
  { id: 'rio3b-24', label: 'ภาพรวม 1',  type: 'wss', streamUrl: `${RIO3_WS_BASE}/kpk_1` },
  { id: 'rio3b-23', label: 'ภาพรวม 2',  type: 'wss', streamUrl: `${RIO3_WS_BASE}/kpk_2` },
  { id: 'rio3b-36', label: 'บานประตู 1', type: 'wss', streamUrl: `${RIO3_WS_BASE}/kpk_gate1` },
];

const YR01Cameras: CameraConfig[] = [
  { id: 'YR01', label: 'ภาพรวม 1',  type: 'wss', streamUrl: `${RIO3_WS_BASE}/YR.01` },
];

const YR02Cameras: CameraConfig[] = [
  { id: 'YR02', label: 'ภาพรวม 1',  type: 'wss', streamUrl: `${RIO3_WS_BASE}/YR.02` },
];

const YR03Cameras: CameraConfig[] = [
  { id: 'YR03', label: 'ภาพรวม 1',  type: 'wss', streamUrl: `${RIO3_WS_BASE}/YR.03` },
];

const YR04Cameras: CameraConfig[] = [
  { id: 'YR04', label: 'ภาพรวม 1',  type: 'wss', streamUrl: `${RIO3_WS_BASE}/YR.04` },
];

const YR05Cameras: CameraConfig[] = [
  { id: 'YR05', label: 'ภาพรวม 1',  type: 'wss', streamUrl: `${RIO3_WS_BASE}/YR.05` },
];

const YR06Cameras: CameraConfig[] = [
  { id: 'YR06', label: 'ภาพรวม 1',  type: 'wss', streamUrl: `${RIO3_WS_BASE}/YR.06` },
];
// ── Map สถานี ───────────────────────────────────────────────────────────────
export const STATION_CAMERAS: Record<string, CameraConfig[]> = {

  // ── สถานีที่มีกล้อง wms-rio3 ──────────────────────────────────────────────
  'tng': tngCameras, 
  'wst': wstCameras, 
  'kpk': kpkCameras, 

    // ── สถานีติดตั้งโครงการ ──────────────────────────────────────────────
  'YR.01': YR01Cameras, 
  'YR.02': YR02Cameras, 
  'YR.03': YR03Cameras, 
  'YR.04': YR04Cameras, 
  'YR.05': YR05Cameras, 
  'YR.06': YR06Cameras, 

  // ── Y.15 ─────────────────────────────────────────────────────────────────
  // 'Y.15': [
  //   {
  //     id: 'y15-cam1',
  //     label: 'กล้อง 1 - มุมเสาวัดระดับน้ำในแม่น้ำ',
  //     type: 'hls',
  //     streamUrl: 'http://125.25.183.165:1935/SamsenRID/myStream/SamsenRID/playlist.m3u8',
  //     snapshotUrl: 'http://125.25.183.165:1935/SamsenRID/myStream/SamsenRID/playlist.m3u8',
  //   },
  //   {
  //     id: 'y15-cam2',
  //     label: 'กล้อง 2 - มุมหน้าสถานี',
  //     type: 'hls',
  //     streamUrl: 'http://125.25.183.165:1935/Up1perKLP/myStream/UpperKLP/playlist.m3u8',
  //   },
  // ],

  // ── PKT.14 ────────────────────────────────────────────────────────────────
  // 'PKT.14': [
  //   {
  //     id: 'pkt14-cam1',
  //     label: 'กล้อง 1 - มุมเสาวัดระดับน้ำ',
  //     type: 'hls',
  //     streamUrl: 'http://125.25.183.165:1935/SamsenRID/myStream/SamsenRID/playlist.m3u8',
  //   },
  //   {
  //     id: 'pkt14-cam2',
  //     label: 'กล้อง 2 - มุมหน้าสถานี',
  //     type: 'hls',
  //     streamUrl: 'http://125.25.183.165:1935/UpperKLP/myStream/UpperKLP/playlist.m3u8',
  //   },
  // ],

  // // ── Y.16 ─────────────────────────────────────────────────────────────────
  // 'Y.16': [
  //   {
  //     id: 'y16-cam1',
  //     label: 'กล้อง 1 - มุมแม่น้ำ',
  //     type: 'mjpeg',
  //     streamUrl: 'http://your-camera-ip/video.mjpg',
  //   },
  //   {
  //     id: 'y16-cam2',
  //     label: 'กล้อง 2 - ภาพรวม',
  //     type: 'snapshot',
  //     streamUrl: '',
  //     snapshotUrl: 'http://your-camera-ip2/snapshot.jpg',
  //   },
  // ],

};