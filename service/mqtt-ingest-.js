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


async function saveToTeleData(sta_code, roundedTimestamp, adjWl, payload) {
  const sql = `
    INSERT INTO tele_data
      (sta_code, datetime, wl, rain_mm)
    VALUES (?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      wl = VALUES(wl),
      rain_mm = VALUES(rain_mm)
  `;

  const params = [
    sta_code,
    roundedTimestamp,
    adjWl,
    payload.rainfall ?? null,
  ];

  await pool.execute(sql, params);
}

async function saveToTeleDataRaw(sta_code, roundedTimestamp, rawWl, offset, adjWl, payload) {
  const sql = `
    INSERT INTO tele_data_raw
      (sta_code, datetime, water_level, water_level_adj, wl_offset,
       rainfall, tip_count, status, error_message,
       payload_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      water_level = VALUES(water_level),
      water_level_adj = VALUES(water_level_adj),
      wl_offset = VALUES(wl_offset),
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
    payload.rainfall ?? null,
    payload.tip_count ?? null,
    payload.status ?? null,
    payload.error_message ?? null,
    JSON.stringify(payload), // ยังเก็บ timestamp ดิบต้นฉบับไว้ใน JSON นี้
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

  // ✅ ปัดเวลาให้เป็นช่วง 5 นาทีก่อนเก็บ (ทั้ง tele_data และ tele_data_raw)
  const roundedTimestamp = roundToNearest5Min(payload.timestamp);

  try {
    await saveToTeleDataRaw(sta_code, roundedTimestamp, rawWl, offset, adjWl, payload);
    await saveToTeleData(sta_code, roundedTimestamp, adjWl, payload);

    console.log(
      `[DB] saved ${payload.station_id} (sta_code=${sta_code}) ` +
      `raw_time=${payload.timestamp} → rounded=${roundedTimestamp} | ` +
      `wl_raw=${rawWl} + offset=${offset} = wl=${adjWl} | rain=${payload.rainfall}mm`
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