// lib/cameraConfig.ts
export interface CameraConfig {
  id: string;
  label: string;
  streamUrl: string;   // URL สำหรับ stream (HLS, MJPEG, หรือ embed)
  type: 'mjpeg' | 'hls' | 'embed' | 'snapshot';
  snapshotUrl?: string; // URL รูปภาพ (refresh ทุก N วินาที)
}

export const STATION_CAMERAS: Record<string, CameraConfig[]> = {
  'Y.15': [
    {
      id: 'y15-cam1',
      label: 'กล้อง 1 - มุมเสาวัดระดับน้ำในแม่น้ำ',
      type: 'hls',
      streamUrl: 'http://125.25.183.165:1935/SamsenRID/myStream/SamsenRID/chunklist_w513270344.m3u8',
      snapshotUrl: 'http://125.25.183.165:1935/SamsenRID/myStream/SamsenRID/chunklist_w513270344.m3u8',
    },
    {
      id: 'y15-cam2',
      label: 'กล้อง 2 - มุมหน้าสถานี',
      type: 'hls',
      streamUrl: 'http://125.25.183.165:1935/UpperKLP/myStream/UpperKLP/chunklist_w133703879.m3u8',
    },
  ],
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
  'Y.4': [
    {
      id: 'y4-cam1',
      label: 'กล้อง 1',
      type: 'embed',
      // กรณีกล้องฝัง iframe (เช่น hikvision web viewer)
      streamUrl: 'http://your-nvr-ip/play/index.html?channel=1',
    },
  ],
};