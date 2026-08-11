// rtsp-ws-relay.js
const { WebSocketServer } = require('ws');
const { spawn } = require('child_process');

// ── กำหนดกล้องแต่ละตัว ──
// type: 'rtsp'  → ต่อ RTSP ตรงๆ ด้วย ffmpeg, ใช้ -c copy ถ้ากล้องเป็น H.264 อยู่แล้ว (เร็ว, CPU ต่ำ)
// type: 'ws'    → ต่อ WS ต้นทางที่เป็น mpeg2video ต้อง transcode เป็น H.264 ก่อน
const CAMERAS = {
  'tng_1': { type: 'ws', url: 'ws://wms-rio3.rid.go.th/cctv-a/camera/14' },
  'tng_2': { type: 'ws', url: 'ws://wms-rio3.rid.go.th/cctv-a/camera/15' },
  'tng_gate1': { type: 'ws', url: 'ws://wms-rio3.rid.go.th/cctv-a/camera/9' },
  'tng_gate2': { type: 'ws', url: 'ws://wms-rio3.rid.go.th/cctv-a/camera/10' },
  'tng_gate3': { type: 'ws', url: 'ws://wms-rio3.rid.go.th/cctv-a/camera/11' },
  'tng_gate4': { type: 'ws', url: 'ws://wms-rio3.rid.go.th/cctv-a/camera/12' },
  'tng_gate5': { type: 'ws', url: 'ws://wms-rio3.rid.go.th/cctv-a/camera/13' },
  'wst_1': { type: 'ws', url: 'ws://wms-rio3.rid.go.th/cctv-b/camera/18' },
  'wst_2': { type: 'ws', url: 'ws://wms-rio3.rid.go.th/cctv-b/camera/19' },
  'wst_gate1': { type: 'ws', url: 'ws://wms-rio3.rid.go.th/cctv-b/camera/11' },
  'wst_gate2': { type: 'ws', url: 'ws://wms-rio3.rid.go.th/cctv-b/camera/12' },
  'wst_gate3': { type: 'ws', url: 'ws://wms-rio3.rid.go.th/cctv-b/camera/13' },
  'wst_gate4': { type: 'ws', url: 'ws://wms-rio3.rid.go.th/cctv-b/camera/14' },
  'wst_gate5': { type: 'ws', url: 'ws://wms-rio3.rid.go.th/cctv-b/camera/15' },
  'wst_gate6': { type: 'ws', url: 'ws://wms-rio3.rid.go.th/cctv-b/camera/16' },
  'wst_gate7': { type: 'ws', url: 'ws://wms-rio3.rid.go.th/cctv-b/camera/17' },
  'kpk_1': { type: 'ws', url: 'ws://wms-rio3.rid.go.th/cctv-b/camera/24' },
  'kpk_2': { type: 'ws', url: 'ws://wms-rio3.rid.go.th/cctv-b/camera/23' },
  'kpk_gate1': { type: 'ws', url: 'ws://wms-rio3.rid.go.th/cctv-b/camera/36' },

  'YR.01': { type: 'rtsp', url: 'rtsp://oper:itthirit2568@10.147.17.10:11012/Streaming/Channels/402' },
  'YR.02': { type: 'rtsp', url: 'rtsp://oper:itthirit2568@10.147.17.10:11012/Streaming/Channels/402' },
  'YR.03': { type: 'rtsp', url: 'rtsp://oper:itthirit2568@10.147.17.10:11012/Streaming/Channels/402' },
  'YR.04': { type: 'rtsp', url: 'rtsp://oper:itthirit2568@10.147.17.10:11012/Streaming/Channels/402' },
  'YR.05': { type: 'rtsp', url: 'rtsp://oper:itthirit2568@10.147.17.10:11012/Streaming/Channels/402' },
  'YR.06': { type: 'rtsp', url: 'rtsp://oper:itthirit2568@10.147.17.10:11012/Streaming/Channels/402' },
};

const FFMPEG_PATH   = 'ffmpeg';
const WEBSOCAT_PATH = 'websocat';

const wss = new WebSocketServer({ host: '127.0.0.1', port: 8088 });
const rooms = new Map(); // camId -> { procs: ChildProcess[], clients: Set }

// ── สร้าง pipeline ตาม type ของกล้อง ──
function buildPipeline(camId) {
  const cam = CAMERAS[camId];
  if (!cam) return null;

  if (cam.type === 'rtsp') {
    const proc = spawn(FFMPEG_PATH, [
      '-rtsp_transport', 'tcp',
      '-i', cam.url,
      '-c', 'copy',
      '-f', 'mpegts',
      '-flush_packets', '1',
      'pipe:1',
    ]);
    proc.stderr.on('data', (d) => console.error(`[ffmpeg ${camId}]`, d.toString()));
    return { procs: [proc], output: proc.stdout };
  }

  if (cam.type === 'ws') {
    // ต้นทาง WS เป็น mpeg2video → ต้อง transcode เป็น H.264 ก่อน browser ถึงเล่นได้
    const wsIn = spawn(WEBSOCAT_PATH, ['-b', cam.url]);
    const proc = spawn(FFMPEG_PATH, [
        '-f', 'mpegts',
        '-i', 'pipe:0',
        '-probesize', '32',
        '-analyzeduration', '0',
        '-fflags', '+genpts+igndts+nobuffer',
        '-flags', 'low_delay',
        '-avoid_negative_ts', 'make_zero',
        '-c:v', 'libx264',
        '-preset', 'ultrafast',
        '-tune', 'zerolatency',
        '-profile:v', 'baseline',
        '-pix_fmt', 'yuv420p',
        '-g', '30',
        '-bf', '0',
        '-c:a', 'aac',
        '-f', 'mpegts',
        '-flush_packets', '1',
        'pipe:1',
        ]);
    wsIn.stdout.pipe(proc.stdin);
    wsIn.stderr.on('data', (d) => console.error(`[websocat ${camId}]`, d.toString()));
    proc.stderr.on('data', (d) => console.error(`[ffmpeg ${camId}]`, d.toString()));
    return { procs: [wsIn, proc], output: proc.stdout };
  }

  return null;
}

function startPipeline(camId) {
  const built = buildPipeline(camId);
  if (!built) return null;

  const room = { procs: built.procs, clients: new Set() };

  built.output.on('data', (chunk) => {
    for (const ws of room.clients) {
      if (ws.readyState === ws.OPEN) ws.send(chunk, { binary: true });
    }
  });

  // process ตัวสุดท้าย (ffmpeg output) exit = pipeline ตาย ต้อง cleanup ทั้งชุด
  const mainProc = built.procs[built.procs.length - 1];
  mainProc.on('exit', (code) => {
    console.warn(`pipeline cam ${camId} exited (${code})`);
    for (const p of room.procs) { try { p.kill(); } catch (_) {} }
    rooms.delete(camId);
    setTimeout(() => {
      if (getClientCountFor(camId) > 0) startPipeline(camId);
    }, 3000);
  });

  rooms.set(camId, room);
  return room;
}

function getRoom(camId) {
  return rooms.get(camId) ?? startPipeline(camId);
}

function getClientCountFor(camId) {
  return rooms.get(camId)?.clients.size ?? 0;
}

wss.on('connection', (ws, req) => {
  const camId = req.url.split('/').filter(Boolean).pop(); // ws://host:8080/camera/14
  if (!CAMERAS[camId]) {
    console.warn(`unknown camera id: ${camId}`);
    ws.close();
    return;
  }

  const room = getRoom(camId);
  if (!room) { ws.close(); return; }

  room.clients.add(ws);
  console.log(`client joined cam ${camId} (${CAMERAS[camId].type}), total: ${room.clients.size}`);

  ws.on('close', () => {
    room.clients.delete(ws);
    if (room.clients.size === 0) {
      for (const p of room.procs) { try { p.kill(); } catch (_) {} }
      rooms.delete(camId);
      console.log(`no more clients for cam ${camId}, pipeline stopped`);
    }
  });

  ws.on('error', (err) => console.error(`ws error cam ${camId}:`, err.message));
});

console.log('RTSP/WS → WS relay listening on ws://127.0.0.1:8088');