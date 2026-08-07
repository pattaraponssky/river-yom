# คู่มือติดตั้งและใช้งาน RTSP → WebSocket Relay (สำหรับกล้อง CCTV)

ระบบนี้แปลงสตรีม RTSP จากกล้อง (ที่เข้าถึงได้ผ่าน VPN) ให้กลายเป็น MPEG-TS
ผ่าน WebSocket เพื่อให้เว็บ (https://) เล่นวิดีโอ live ได้ผ่าน `mpegts.js`

```
[กล้อง RTSP] → ffmpeg (remux) → Node relay (ws://127.0.0.1:8080)
                                        │
                         Apache (XAMPP) proxy ที่ /cctv-ws/ ผ่าน 443
                                        │
                         Browser (wss://yourdomain.com/cctv-ws/camera/14)
```

---

## 1. Prerequisites

| อะไร | เช็คด้วยคำสั่ง | ถ้าไม่มี |
|---|---|---|
| Node.js (แยกจาก XAMPP) | `node -v` | โหลดจาก https://nodejs.org (LTS) |
| ffmpeg | `where ffmpeg` | โหลดจาก https://www.gyan.dev/ffmpeg/builds/ แล้วเพิ่มเข้า PATH |
| pm2 | `pm2 -v` | ติดตั้งตามขั้นตอนด้านล่าง |
| Apache mod_proxy_wstunnel | - | เปิดใน `httpd.conf` (ขั้นตอน 4) |

---

## 2. ติดตั้ง Relay Server

```powershell
mkdir C:\services\rtsp-ws-relay
cd C:\services\rtsp-ws-relay
npm init -y
npm install ws
```

สร้างไฟล์ `C:\services\rtsp-ws-relay\rtsp-ws-relay.js`:

```js
// rtsp-ws-relay.js
const { WebSocketServer } = require('ws');
const { spawn } = require('child_process');

// ── แก้ mapping ให้ตรงกับกล้องของจริง ──
const CAMERAS = {
  '14': 'rtsp://user:pass@192.168.x.x:554/stream1',
  '15': 'rtsp://user:pass@192.168.x.y:554/stream1',
};

// ระบุ path เต็มถ้า service หา ffmpeg ไม่เจอ เช่น 'C:\\ffmpeg\\bin\\ffmpeg.exe'
const FFMPEG_PATH = 'ffmpeg';

const wss = new WebSocketServer({ host: '127.0.0.1', port: 8080 });
const rooms = new Map(); // camId -> { proc, clients: Set }

function startFfmpeg(camId) {
  const rtspUrl = CAMERAS[camId];
  const proc = spawn(FFMPEG_PATH, [
    '-rtsp_transport', 'tcp',
    '-i', rtspUrl,
    '-c', 'copy',
    '-f', 'mpegts',
    '-flush_packets', '1',
    'pipe:1',
  ]);

  const room = { proc, clients: new Set() };

  proc.stdout.on('data', (chunk) => {
    for (const ws of room.clients) {
      if (ws.readyState === ws.OPEN) ws.send(chunk, { binary: true });
    }
  });

  proc.stderr.on('data', (d) => console.error(`[cam ${camId}]`, d.toString()));

  proc.on('exit', (code) => {
    console.warn(`ffmpeg cam ${camId} exited (${code}), restarting in 3s`);
    rooms.delete(camId);
    setTimeout(() => {
      const r = rooms.get(camId);
      if (!r && getClientCountFor(camId) > 0) startFfmpeg(camId);
    }, 3000);
  });

  rooms.set(camId, room);
  return room;
}

function getRoom(camId) {
  return rooms.get(camId) ?? startFfmpeg(camId);
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
  room.clients.add(ws);
  console.log(`client joined cam ${camId}, total: ${room.clients.size}`);

  ws.on('close', () => {
    room.clients.delete(ws);
    if (room.clients.size === 0) {
      room.proc.kill();
      rooms.delete(camId);
      console.log(`no more clients for cam ${camId}, ffmpeg stopped`);
    }
  });

  ws.on('error', (err) => console.error(`ws error cam ${camId}:`, err.message));
});

console.log('RTSP → WS relay listening on ws://127.0.0.1:8080');
```

---

## 3. รันด้วย pm2

```powershell
npm install -g pm2

cd C:\services\rtsp-ws-relay
pm2 start rtsp-ws-relay.js --name rtsp-relay

# ตั้งให้ pm2 จำ process list ปัจจุบัน
pm2 save

# ให้ pm2 auto-start ตอน Windows boot
npm install -g pm2-windows-startup
pm2-startup install
```

**คำสั่งที่ใช้บ่อย:**

```powershell
pm2 status                 # ดูสถานะ
pm2 logs rtsp-relay        # ดู log แบบ real-time
pm2 restart rtsp-relay     # รีสตาร์ทหลังแก้โค้ด
pm2 stop rtsp-relay        # หยุดชั่วคราว
pm2 delete rtsp-relay      # ลบออกจาก pm2
```

> แก้โค้ด `rtsp-ws-relay.js` แล้วต้อง `pm2 restart rtsp-relay` ทุกครั้งถึงจะมีผล

---

## 4. ตั้งค่า Apache (XAMPP) ให้ Proxy ผ่าน HTTPS

### 4.1 เปิด module ใน `C:\xampp\apache\conf\httpd.conf`

หา (หรือเพิ่ม) บรรทัดเหล่านี้ เอา `#` ข้างหน้าออกถ้ามีอยู่แล้ว:

```apache
LoadModule proxy_module modules/mod_proxy.so
LoadModule proxy_http_module modules/mod_proxy_http.so
LoadModule proxy_wstunnel_module modules/mod_proxy_wstunnel.so
LoadModule ssl_module modules/mod_ssl.so
```

### 4.2 เพิ่ม ProxyPass ใน SSL vhost

แก้ที่ `C:\xampp\apache\conf\extra\httpd-ssl.conf`
(หรือไฟล์ vhost 443 ของโดเมนคุณถ้าตั้งแยกไว้ใน `httpd-vhosts.conf`):

```apache
<VirtualHost *:443>
    ServerName yourdomain.com
    SSLEngine on
    SSLCertificateFile "conf/ssl.crt/server.crt"
    SSLCertificateKeyFile "conf/ssl.key/server.key"

    # ... config เดิมของเว็บ/DocumentRoot ...

    # ── CCTV WebSocket proxy ──────────────────────────
    ProxyRequests Off
    ProxyPreserveHost On
    ProxyTimeout 3600

    ProxyPass        "/cctv-ws/"  "ws://127.0.0.1:8080/"
    ProxyPassReverse "/cctv-ws/"  "ws://127.0.0.1:8080/"
</VirtualHost>
```

> ถ้า Apache เวอร์ชันเก่ากว่า 2.4.47 แล้ว `ProxyPass ws://` ไม่ upgrade connection
> ให้ใช้ `mod_rewrite` แทน (ต้องเปิด `mod_rewrite` ด้วย):
> ```apache
> RewriteEngine On
> RewriteCond %{HTTP:Upgrade} =websocket [NC]
> RewriteRule /cctv-ws/(.*) ws://127.0.0.1:8080/$1 [P,L]
> ```

### 4.3 เช็ค syntax แล้วรีสตาร์ท

```powershell
C:\xampp\apache\bin\httpd.exe -t
C:\xampp\apache\bin\httpd.exe -k restart
```

หรือกด Stop/Start ผ่าน XAMPP Control Panel

### 4.4 Firewall

เปิดแค่ **443** (ปกติเปิดอยู่แล้ว) — **ห้ามเปิด 8080 ออก public**
เพราะ relay bind แค่ `127.0.0.1` ต้องเข้าผ่าน Apache proxy เท่านั้น

```powershell
netsh advfirewall firewall show rule name=all | findstr 8080
```
ต้องไม่เจอ rule allow inbound จาก public สำหรับ port นี้

---

## 5. เชื่อมกับหน้าบ้าน (Frontend)

### 5.1 เพิ่ม config กล้อง

```ts
// lib/cameraConfig.ts
export const cameraConfigs: CameraConfig[] = [
  {
    id: 'y4-cam1',
    label: 'กล้อง Y.4',
    type: 'wss',
    staCode: 'Y.4',
    streamUrl: 'wss://yourdomain.com/cctv-ws/camera/14',
  },
  {
    id: 'y15-cam1',
    label: 'กล้อง Y.15',
    type: 'wss',
    staCode: 'Y.15',
    streamUrl: 'wss://yourdomain.com/cctv-ws/camera/15',
  },
];
```

> `14` / `15` ท้าย URL ต้องตรงกับ key ใน `CAMERAS` object ของ `rtsp-ws-relay.js`

### 5.2 เรียกใช้ component (มีอยู่แล้ว ไม่ต้องแก้)

```tsx
import CameraViewer from '@/components/Data/CameraViewer';
import { cameraConfigs } from '@/lib/cameraConfig';

<CameraViewer
  cameras={cameraConfigs.filter(c => c.staCode === 'Y.4')}
  staCode="Y.4"
/>
```

`WssCamera.tsx` ที่ใช้ `mpegts.js` เล่น `wss://` ได้ทันทีโดยไม่ติด mixed-content
เพราะหน้าเว็บกับสตรีมเป็น protocol ปลอดภัย (`https` + `wss`) ตรงกันแล้ว

---

## 6. ทดสอบทีละชั้น (ไล่หา bug ง่ายขึ้นถ้ามีปัญหา)

| ขั้น | วิธีเทส | ผลที่ควรได้ |
|---|---|---|
| 1. Relay ทำงานไหม | `pm2 logs rtsp-relay` | เห็น `RTSP → WS relay listening on ws://127.0.0.1:8080` |
| 2. ffmpeg ต่อ RTSP ได้ไหม | เปิดเว็บผ่าน `CameraViewer` 1 ครั้ง แล้วดู `pm2 logs rtsp-relay` | เห็น log `client joined cam 14` ไม่มี ffmpeg error/`Connection refused` |
| 3. Apache proxy ผ่านไหม | DevTools → Network → WS → ดู request `wss://yourdomain.com/cctv-ws/camera/14` | status `101 Switching Protocols` |
| 4. Browser เล่นภาพไหม | ดูหน้าเว็บจริง | เห็นวิดีโอ + badge "LIVE" ตาม `WssCamera.tsx` |

ถ้าค้างขั้นไหนให้ดู log ของขั้นนั้นเป็นหลัก — ปัญหาที่เจอบ่อย:

- **ffmpeg exit ทันที** → เช็ค RTSP URL/user-pass/VPN ยังเชื่อมอยู่ไหม (`ffmpeg` เดียวกันลอง run ตรงๆ ใน terminal ดู error message เต็มๆ)
- **WS ค้างที่ `connecting` ไม่ error, ไม่ error, ไม่เล่น** → เช็คว่ากล้องส่ง H.264 จริงไหม (ถ้าเป็น H.265/MJPEG ต้องเปลี่ยน `-c copy` เป็น `-c:v libx264 -preset veryfast -tune zerolatency`)
- **502/พังตอน Apache proxy** → เช็คว่า relay รันอยู่จริง (`pm2 status`) และ module `mod_proxy_wstunnel` ถูกโหลดจริง (`httpd.exe -M | findstr proxy`)

---

## 7. Checklist สรุป

- [ ] ติดตั้ง Node.js + ffmpeg แยกจาก XAMPP แล้ว
- [ ] วางไฟล์ที่ `C:\services\rtsp-ws-relay\` (นอก `htdocs`)
- [ ] แก้ `CAMERAS` mapping ให้ตรงกล้องจริง
- [ ] `pm2 start` + `pm2 save` + ตั้ง `pm2-startup`
- [ ] เปิด `mod_proxy`, `mod_proxy_wstunnel`, `mod_ssl` ใน httpd.conf
- [ ] เพิ่ม `ProxyPass /cctv-ws/` ใน SSL vhost แล้ว restart Apache
- [ ] Firewall เปิดแค่ 443 ไม่เปิด 8080 ออก public
- [ ] แก้ `cameraConfig.ts` ให้ชี้ `wss://yourdomain.com/cctv-ws/camera/<id>`
- [ ] เทสผ่าน DevTools เห็น `101 Switching Protocols` และภาพขึ้นจริง