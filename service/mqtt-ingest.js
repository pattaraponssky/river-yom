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
  clientId: process.env.MQTT_CLIENT_ID || `yom-right-ingest-${Math.random().toString(16).slice(2, 8)}`,
  topic: process.env.MQTT_TOPIC || '/irrigation/yom-right/#',
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
  YR01: 32.534,
  YR02: 38.388,
  YR03: 40.890,
  YR04: 37.082,
  YR05: 31.928,
  YR06: 34.690,
};

function getWlOffset(staCode) {
  return STATION_WL_OFFSET[staCode] ?? 0;
}

// คำนวณ wl ที่จะเก็บจริง = wl ดิบ (หรือ raw_value ถ้าไม่มี water_level) + offset ของสถานีนั้น
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

async function saveToTeleData(payload, adjWl) {
  const sql = `
    INSERT INTO tele_data
      (sta_code, datetime, wl, discharge, rain_mm)
    VALUES (?, ?, ?, ?, ?)
  `;

  const params = [
    payload.station_id,
    payload.timestamp,
    adjWl,
    payload.discharge ?? null,
    payload.rainfall ?? null,
  ];

  await pool.execute(sql, params);
}

// ── insert ลง tele_data_raw (เก็บทุกค่าดิบ ทุกครั้งที่รับ message) ──
async function saveToTeleDataRaw(payload, topic, rawWl, offset, adjWl) {
  const sql = `
    INSERT INTO tele_data_raw
      (sta_code, datetime, raw_value, water_level, water_level_adj, wl_offset,
       discharge, rainfall, tip_count, status, quality, error_message,
       mqtt_topic, payload_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const params = [
    payload.station_id,
    payload.timestamp,
    payload.raw_value ?? null,
    rawWl,
    adjWl,
    offset,
    payload.discharge ?? null,
    payload.rainfall ?? null,
    payload.tip_count ?? null,
    payload.status ?? null,
    payload.quality ?? null,
    payload.error_message ?? null,
    topic,
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
  reconnectPeriod: 3000,
  clean: true,
});

client.on('connect', () => {
  console.log(`[MQTT] connected as ${MQTT_CONFIG.clientId}`);
  client.subscribe(MQTT_CONFIG.topic, { qos: 0 }, (err) => {
    if (err) console.error('[MQTT] subscribe error:', err.message);
    else console.log(`[MQTT] subscribed: ${MQTT_CONFIG.topic}`);
  });
});

client.on('reconnect', () => console.log('[MQTT] reconnecting...'));
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

  const err = validatePayload(payload);
  if (err) {
    console.warn(`[MQTT] payload rejected on ${topic}: ${err}`);
    return;
  }

  const { rawWl, offset, adjWl } = computeAdjustedWl(payload);

  try {
    await saveToTeleDataRaw(payload, topic, rawWl, offset, adjWl);
    await saveToTeleData(payload, adjWl);

    console.log(
      `[DB] saved ${payload.station_id} @ ${payload.timestamp} | ` +
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