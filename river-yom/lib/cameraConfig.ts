// lib/cameraConfig.ts

export interface CameraConfig {
  id: string;
  label: string;
  streamUrl: string;
  type: 'mjpeg' | 'hls' | 'embed' | 'snapshot' | 'wss';
  snapshotUrl?: string;
}

// ── กล้อง wms-rio3.rid.go.th (MPEG-TS over WebSocket) ──────────────────────
// deviceId → path: ws://wms-rio3.rid.go.th/cctv-b/camera/{deviceId}
const RIO3_WS_BASE = 'ws://wms-rio3.rid.go.th/cctv-b/camera';

const rio3Cameras: CameraConfig[] = [
  { id: 'rio3-18', label: 'ภาพรวม 1',   type: 'wss', streamUrl: `${RIO3_WS_BASE}/18` },
  { id: 'rio3-19', label: 'ภาพรวม 2',   type: 'wss', streamUrl: `${RIO3_WS_BASE}/19` },
  { id: 'rio3-11', label: 'บานประตู 1', type: 'wss', streamUrl: `${RIO3_WS_BASE}/11` },
  { id: 'rio3-12', label: 'บานประตู 2', type: 'wss', streamUrl: `${RIO3_WS_BASE}/12` },
  { id: 'rio3-13', label: 'บานประตู 3', type: 'wss', streamUrl: `${RIO3_WS_BASE}/13` },
  { id: 'rio3-14', label: 'บานประตู 4', type: 'wss', streamUrl: `${RIO3_WS_BASE}/14` },
  { id: 'rio3-15', label: 'บานประตู 5', type: 'wss', streamUrl: `${RIO3_WS_BASE}/15` },
  // { id: 'rio3-16', label: 'บานประตู 6', type: 'wss', streamUrl: `${RIO3_WS_BASE}/16` },
  // { id: 'rio3-17', label: 'บานประตู 7', type: 'wss', streamUrl: `${RIO3_WS_BASE}/17` },
];

// ── Map สถานี ───────────────────────────────────────────────────────────────
export const STATION_CAMERAS: Record<string, CameraConfig[]> = {

  // ── สถานีที่มีกล้อง wms-rio3 ──────────────────────────────────────────────
  'tng': rio3Cameras,   // ← ใส่ staCode ที่ตรงกับสถานีนี้

  // ── tng (wss จาก itthirit.io + hls) ─────────────────────────────────────
  // 'tng': [
  //   {
  //     id: 'tng-cam1',
  //     label: 'กล้อง 1 - มุมเสาวัดระดับน้ำในแม่น้ำ',
  //     type: 'wss',
  //     streamUrl: 'ws://wms-rio3.rid.go.th/cctv-b/camera/18',
  //   },
  //   {
  //     id: 'tng-cam2',
  //     label: 'กล้อง 2 - มุมหน้าสถานี',
  //     type: 'wss',
  //     streamUrl: 'ws://wms-rio3.rid.go.th/cctv-b/camera/19',
  //   },
  // ],

  // ── Y.15 ─────────────────────────────────────────────────────────────────
  'Y.15': [
    {
      id: 'y15-cam1',
      label: 'กล้อง 1 - มุมเสาวัดระดับน้ำในแม่น้ำ',
      type: 'hls',
      streamUrl: 'http://125.25.183.165:1935/SamsenRID/myStream/SamsenRID/playlist.m3u8',
      snapshotUrl: 'http://125.25.183.165:1935/SamsenRID/myStream/SamsenRID/playlist.m3u8',
    },
    {
      id: 'y15-cam2',
      label: 'กล้อง 2 - มุมหน้าสถานี',
      type: 'hls',
      streamUrl: 'http://125.25.183.165:1935/UpperKLP/myStream/UpperKLP/playlist.m3u8',
    },
  ],

  // ── PKT.14 ────────────────────────────────────────────────────────────────
  'PKT.14': [
    {
      id: 'pkt14-cam1',
      label: 'กล้อง 1 - มุมเสาวัดระดับน้ำ',
      type: 'hls',
      streamUrl: 'http://125.25.183.165:1935/SamsenRID/myStream/SamsenRID/playlist.m3u8',
    },
    {
      id: 'pkt14-cam2',
      label: 'กล้อง 2 - มุมหน้าสถานี',
      type: 'hls',
      streamUrl: 'http://125.25.183.165:1935/UpperKLP/myStream/UpperKLP/playlist.m3u8',
    },
  ],

  // ── Y.16 ─────────────────────────────────────────────────────────────────
  'Y.16': [
    {
      id: 'y16-cam1',
      label: 'กล้อง 1 - มุมแม่น้ำ',
      type: 'mjpeg',
      streamUrl: 'http://your-camera-ip/video.mjpg',
    },
    {
      id: 'y16-cam2',
      label: 'กล้อง 2 - ภาพรวม',
      type: 'snapshot',
      streamUrl: '',
      snapshotUrl: 'http://your-camera-ip2/snapshot.jpg',
    },
  ],

  // ── Y.4 ──────────────────────────────────────────────────────────────────
  'Y.4': [
    {
      id: 'y4-cam1',
      label: 'กล้อง 1',
      type: 'embed',
      streamUrl: 'http://your-nvr-ip/play/index.html?channel=1',
    },
  ],
};