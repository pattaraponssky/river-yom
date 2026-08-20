// mqtt-ingest.js
require('dotenv').config();
const mqtt = require('mqtt');
const mysql = require('mysql2/promise');

// ── MQTT config ─────────────────────────────────────────
const MQTT_CONFIG = {
  host: process.env.MQTT_HOST || 'broker.emqx.io',
  port: Number(process.env.MQTT_PORT || 1883),
  username: process.env.MQTT_USERNAME || 'river_yom',
  password: process.env.MQTT_PASSWORD || 'rid!@#123',
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

function computeFromRaw(rawValue, tipCount) {
  // ตัวอย่าง: ถ้าใช้ tipping bucket แบบ tip_count * mm ต่อ tip
  // return tipCount * 0.5; // 0.5mm ต่อ 1 tip
  return rawValue; // TODO: ใส่สูตรจริงตามสเปกอุปกรณ์
}

// ── validate payload ก่อนเขียนลง DB ────────────────────
function validatePayload(payload) {
  const required = ['station_id', 'timestamp', 'raw_value', 'rainfall', 'status'];
  for (const key of required) {
    if (payload[key] === undefined) return `missing field: ${key}`;
  }
  if (payload.quality && payload.quality !== 'GOOD') return `quality not GOOD: ${payload.quality}`;
  return null;
}

// ── insert/update ลง tele_data ──────────────────────────
async function saveToTeleData(payload) {
  const waterLevel = payload.water_level !== undefined
    ? payload.water_level
    : payload.raw_value;

  const sql = `
    INSERT INTO tele_data
      (sta_code, datetime, water_level, rain_mm, tip_count, status, quality, error_message, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
    ON DUPLICATE KEY UPDATE
      water_level = VALUES(water_level),
      rain_mm = VALUES(rain_mm),
      tip_count = VALUES(tip_count),
      status = VALUES(status),
      quality = VALUES(quality),
      error_message = VALUES(error_message)
  `;

  const params = [
    payload.station_id,
    payload.timestamp,
    waterLevel,
    payload.rainfall ?? null,
    payload.tip_count ?? null,
    payload.status,
    payload.quality ?? null,
    payload.error_message ?? null,
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
  reconnectPeriod: 3000, // reconnect อัตโนมัติทุก 3 วิถ้าหลุด
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

  function validatePayload(payload) {
    const required = ['station_id', 'timestamp', 'status'];
    for (const key of required) {
        if (payload[key] === undefined || payload[key] === null) {
        return `missing field: ${key}`;
        }
    }

    // ต้องมีอย่างน้อย water_level หรือ raw_value อย่างใดอย่างหนึ่ง
    if (payload.water_level === undefined && payload.raw_value === undefined) {
        return 'missing water_level or raw_value';
    }

    return null;
    }

  try {
    await saveToTeleData(payload);
    console.log(`[DB] saved ${payload.station_id} @ ${payload.timestamp} | rain=${payload.rainfall}mm | raw=${payload.raw_value}`);
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