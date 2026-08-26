// mqtt-ingest.js
require('dotenv').config();
const mqtt = require('mqtt');
const mysql = require('mysql2/promise');

// ── MQTT config ─────────────────────────────────────────
const MQTT_CONFIG = {
  host: process.env.MQTT_HOST || 'broker.emqx.io',
  port: Number(process.env.MQTT_PORT || 1883),
  username: process.env.MQTT_USERNAME || 'itthirit',
  password: process.env.MQTT_PASSWORD || 'P@ssw0rd',
  clientId: `yom-right-ingest-${Math.random().toString(16).slice(2, 8)}`,
  topic: '/irrigation/yom-right/#',
};

// ── MySQL config ────────────────────────────────────────
const DB_CONFIG = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD || 'admin1234',
  database: process.env.DB_NAME || 'river_yom',
  waitForConnections: true,
  connectionLimit: 5,
};

const pool = mysql.createPool(DB_CONFIG);

// ── ค่าชดเชยระดับน้ำ (wl offset) แยกรายสถานี ────────────
const STATION_WL_OFFSET = {
  YR01: 32.594,
  // YR01: 32.534 +0.06,
  YR02: 39.548,
  // YR02: 38.388 +1 +0.16,
  YR03: 40.910,
  // YR03: 40.890 +0.02,
  YR04: 37.082,
  // YR04: 37.082,
  YR05: 30.920,
  // YR05: 31.928 -1 -0.08,
  YR06: 34.690,
  // YR06: 34.690,
};

function getWlOffset(staCode) {
  return STATION_WL_OFFSET[staCode] ?? 0;
}

function toDbStaCode(rawStationId) {
  const match = /^YR(\d+)$/.exec(rawStationId);
  if (!match) return rawStationId;
  return `YR.${match[1]}`;
}

// ── ตาราง Rating Curve: ระดับน้ำ (wl, ม.รทก.) → อัตราการไหล (discharge, ลบ.ม./วินาที) ──
//   YR01 = สะพานชุมแสงสงคราม
//   YR02 = สะพานบ้านห้วงกระได 
//   YR03 = สะพานวัดทุ่งอ้ายโห้ 
//   YR04 = สะพานข้ามคลองกรุงกรัก 
//   YR05 = สะพานท่านางงาม   
//   YR06 = สะพานข้ามคลองห้วยคด   
const RATING_CURVES = {
  YR01: [
    { wl: 32.113, q: 0 },
    { wl: 34.394, q: 2 },
    { wl: 34.685, q: 5 },
    { wl: 35.025, q: 10 },
    { wl: 35.709, q: 25 },
    { wl: 36.493, q: 50 },
    { wl: 37.653, q: 100 },
    { wl: 39.398, q: 200 },
    { wl: 42.773, q: 500 },
    { wl: 45.064, q: 1000 },
    { wl: 47.899, q: 2000 },
  ],
  // สะพานห้วยกระได
  YR02: [
    { wl: 38.214, q: 0 },
    { wl: 38.780, q: 2 },
    { wl: 39.049, q: 5 },
    { wl: 39.341, q: 10 },
    { wl: 39.895, q: 25 },
    { wl: 40.507, q: 50 },
    { wl: 41.286, q: 100 },
    { wl: 42.233, q: 200 },
    { wl: 43.943, q: 500 },
    { wl: 46.004, q: 1000 },
    { wl: 48.809, q: 2000 },
  ],
  // สะพานทุ่งอ้ายโห้
  YR03: [
    { wl: 40.506, q: 0 },
    { wl: 41.143, q: 2 },
    { wl: 41.398, q: 5 },
    { wl: 41.697, q: 10 },
    { wl: 42.186, q: 25 },
    { wl: 42.722, q: 50 },
    { wl: 43.545, q: 100 },
    { wl: 45.181, q: 200 },
    { wl: 46.867, q: 500 },
    { wl: 48.876, q: 1000 },
    { wl: 52.026, q: 2000 },
  ],
  // สะพานกรุงกรัก
  YR04: [
    { wl: 37.076, q: 0 },
    { wl: 37.224, q: 2 },
    { wl: 37.301, q: 5 },
    { wl: 37.398, q: 10 },
    { wl: 37.610, q: 25 },
    { wl: 37.878, q: 50 },
    { wl: 38.286, q: 100 },
    { wl: 38.908, q: 200 },
    { wl: 42.409, q: 500 },
    { wl: 44.712, q: 1000 },
    { wl: 47.593, q: 2000 },
  ],
  // สะพานท่านางงาม
  YR05: [
    { wl: 31.895, q: 0 },
    { wl: 33.325, q: 2 },
    { wl: 33.473, q: 5 },
    { wl: 33.696, q: 10 },
    { wl: 34.250, q: 25 },
    { wl: 34.956, q: 50 },
    { wl: 36.161, q: 100 },
    { wl: 37.960, q: 200 },
    { wl: 41.776, q: 500 },
    { wl: 43.969, q: 1000 },
    { wl: 46.558, q: 2000 },
  ],
  // สะพานห้วยคต
  YR06: [
    { wl: 34.205, q: 0 },
    { wl: 34.427, q: 2 },
    { wl: 34.550, q: 5 },
    { wl: 34.934, q: 10 },
    { wl: 35.745, q: 25 },
    { wl: 36.595, q: 50 },
    { wl: 37.772, q: 100 },
    { wl: 39.013, q: 200 },
    { wl: 41.418, q: 500 },
    { wl: 43.416, q: 1000 },
    { wl: 46.255, q: 2000 },
  ],
};

function wlToDischarge(rawStationId, wl) {
  const curve = RATING_CURVES[rawStationId];
  if (!curve || curve.length < 2 || wl === null || wl === undefined) return null;

  if (wl <= curve[0].wl) return curve[0].q;

  const last = curve[curve.length - 1];
  if (wl >= last.wl) {
    const prev = curve[curve.length - 2];
    const slope = (last.q - prev.q) / (last.wl - prev.wl);
    return last.q + slope * (wl - last.wl);
  }

  for (let i = 0; i < curve.length - 1; i++) {
    const a = curve[i];
    const b = curve[i + 1];
    if (wl >= a.wl && wl <= b.wl) {
      const ratio = (wl - a.wl) / (b.wl - a.wl);
      return a.q + ratio * (b.q - a.q);
    }
  }
  return null;
}

// ── คำนวณ wl ที่จะเก็บจริง = wl ดิบ + offset ของสถานีนั้น ──
function computeAdjustedWl(payload) {
  const rawWl = payload.water_level !== undefined
    ? payload.water_level
    : payload.raw_value;

  if (rawWl === undefined || rawWl === null) return { rawWl: null, offset: 0, adjWl: null };

  const offset = getWlOffset(payload.station_id);
  return { rawWl, offset, adjWl: rawWl + offset };
}

// ── validate payload ก่อนเขียนลง DB ────────────────────
function validatePayload(payload) {
  const required = ['station_id', 'timestamp', 'status'];
  for (const key of required) {
    if (payload[key] === undefined || payload[key] === null) {
      return `missing field: ${key}`;
    }
  }
  if (payload.water_level === undefined && payload.raw_value === undefined) {
    return 'missing water_level or raw_value';
  }
  return null;
}

const FIVE_MIN_MS = 5 * 60 * 1000;

function parseDbTimestamp(ts) {
  const m = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})$/.exec(String(ts).trim());
  if (!m) return null;
  const [, y, mo, d, h, mi, s] = m.map(Number);
  return Date.UTC(y, mo - 1, d, h, mi, s);
}

function formatDbTimestamp(epochMs) {
  const dt = new Date(epochMs);
  const pad = (n) => String(n).padStart(2, '0');
  return (
    `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())} ` +
    `${pad(dt.getUTCHours())}:${pad(dt.getUTCMinutes())}:${pad(dt.getUTCSeconds())}`
  );
}

function roundToNearest5Min(ts) {
  const epoch = parseDbTimestamp(ts);
  if (epoch === null) {
    console.warn(`[TIME] cannot parse timestamp "${ts}", using as-is`);
    return ts;
  }
  const rounded = Math.round(epoch / FIVE_MIN_MS) * FIVE_MIN_MS;
  return formatDbTimestamp(rounded);
}

async function saveToTeleData(sta_code, roundedTimestamp, adjWl, discharge, payload) {
  const sql = `
    INSERT INTO tele_data
      (sta_code, datetime, wl, discharge, rain_mm)
    VALUES (?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      wl = VALUES(wl),
      discharge = VALUES(discharge),
      rain_mm = VALUES(rain_mm)
  `;

  const params = [
    sta_code,
    roundedTimestamp,
    adjWl,
    discharge,
    payload.rainfall ?? null,
  ];

  await pool.execute(sql, params);
}

async function saveToTeleDataRaw(sta_code, roundedTimestamp, rawWl, offset, adjWl, discharge, payload) {
  const sql = `
    INSERT INTO tele_data_raw
      (sta_code, datetime, water_level, water_level_adj, wl_offset,
       discharge, rainfall, tip_count, status, error_message,
       payload_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      water_level = VALUES(water_level),
      water_level_adj = VALUES(water_level_adj),
      wl_offset = VALUES(wl_offset),
      discharge = VALUES(discharge),
      rainfall = VALUES(rainfall),
      tip_count = VALUES(tip_count),
      status = VALUES(status),
      error_message = VALUES(error_message),
      payload_json = VALUES(payload_json)
  `;

  const params = [
    sta_code,
    roundedTimestamp,
    rawWl,
    adjWl,
    offset,
    discharge,
    payload.rainfall ?? null,
    payload.tip_count ?? null,
    payload.status ?? null,
    payload.error_message ?? null,
    JSON.stringify(payload), 
  ];

  await pool.execute(sql, params);
}

// ── MQTT client ──────────────────────────────────────────
const client = mqtt.connect({
  host: MQTT_CONFIG.host,
  port: MQTT_CONFIG.port,
  username: MQTT_CONFIG.username,
  password: MQTT_CONFIG.password,
  clientId: MQTT_CONFIG.clientId,
  keepalive: 30,
  reconnectPeriod: 3000,
  connectTimeout: 10000,
  clean: true,
});

client.on('connect', () => {
  console.log(`[MQTT] connected as ${MQTT_CONFIG.clientId}`);
  client.subscribe(MQTT_CONFIG.topic, { qos: 0 }, (err) => {
    if (err) console.error('[MQTT] subscribe error:', err.message);
    else console.log(`[MQTT] subscribed: ${MQTT_CONFIG.topic}`);
  });
});

let reconnectCount = 0;
client.on('reconnect', () => {
  reconnectCount++;
  console.log(`[MQTT] reconnecting... (attempt #${reconnectCount})`);
});
client.on('close', () => console.warn('[MQTT] connection closed'));
client.on('error', (err) => console.error('[MQTT] error:', err.message));

client.on('message', async (topic, messageBuf) => {
  let payload;
  try {
    payload = JSON.parse(messageBuf.toString());
  } catch (e) {
    console.error(`[MQTT] invalid JSON on ${topic}:`, messageBuf.toString());
    return;
  }

  console.log(`[MQTT] received ${topic}:`, JSON.stringify(payload));

  const err = validatePayload(payload);
  if (err) {
    console.warn(`[MQTT] payload rejected on ${topic}: ${err}`);
    return;
  }

  const { rawWl, offset, adjWl } = computeAdjustedWl(payload);
  const sta_code = toDbStaCode(payload.station_id);
  const discharge = wlToDischarge(payload.station_id, adjWl);

  // ✅ ปัดเวลาให้เป็นช่วง 5 นาทีก่อนเก็บ (ทั้ง tele_data และ tele_data_raw)
  const roundedTimestamp = roundToNearest5Min(payload.timestamp);

  try {
    await saveToTeleDataRaw(sta_code, roundedTimestamp, rawWl, offset, adjWl, discharge, payload);
    await saveToTeleData(sta_code, roundedTimestamp, adjWl, discharge, payload);

    console.log(
      `[DB] saved ${payload.station_id} (sta_code=${sta_code}) ` +
      `raw_time=${payload.timestamp} → rounded=${roundedTimestamp} | ` +
      `wl_raw=${rawWl} + offset=${offset} = wl=${adjWl} | discharge=${discharge} | rain=${payload.rainfall}mm`
    );
  } catch (e) {
    console.error(`[DB] insert failed for ${payload.station_id}:`, e.message);
  }
});

process.on('SIGINT', async () => {
  console.log('shutting down...');
  client.end();
  await pool.end();
  process.exit(0);
});