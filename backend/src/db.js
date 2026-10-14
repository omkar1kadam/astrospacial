import "dotenv/config";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";
import Database from "better-sqlite3";
import {
  seedSatellites,
  seedDebris,
  seedStations,
  seedConjunctions,
  seedSpaceWeather,
  seedNEOs,
  seedAlerts
} from "./seed-data.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Data directory for SQLite fallback
const dataDir = path.resolve(__dirname, "../data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
const sqliteFilePath = path.join(dataDir, "astrospacial.db");

let activePool = null;
let databaseType = "sqlite";

async function attemptMySQLConnection() {
  if (process.env.DB_TYPE === "sqlite") return null;

  const config = {
    host: process.env.MYSQL_HOST || "localhost",
    port: Number(process.env.MYSQL_PORT) || 3306,
    user: process.env.MYSQL_USER || "root",
    password: process.env.MYSQL_PASSWORD || "",
    database: process.env.MYSQL_DATABASE || "astrospacial",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: "utf8mb4",
    timezone: "Z",
  };

  try {
    const tempPool = mysql.createPool(config);
    // Quick test query with a timeout
    const testPromise = tempPool.query("SELECT 1");
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("MySQL connection timed out")), 2000)
    );
    await Promise.race([testPromise, timeoutPromise]);
    return tempPool;
  } catch (err) {
    return null;
  }
}

function createSqliteWrapper() {
  const db = new Database(sqliteFilePath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  // Emulate MySQL UTC_TIMESTAMP() in SQLite
  db.function("UTC_TIMESTAMP", () =>
    new Date().toISOString().replace("T", " ").substring(0, 19)
  );

  return {
    dbType: "sqlite",
    rawDb: db,
    async execute(sql, params = []) {
      const trimmed = sql.trim();
      const isSelect = /^(SELECT|PRAGMA|EXPLAIN)/i.test(trimmed);

      // Sanitize standard ? params
      const sanitizedParams = params.map(p => (p instanceof Date ? p.toISOString().replace("T", " ").substring(0, 19) : p));

      try {
        if (isSelect) {
          const stmt = db.prepare(sql);
          const rows = stmt.all(...sanitizedParams);
          return [rows, null];
        } else {
          const stmt = db.prepare(sql);
          const info = stmt.run(...sanitizedParams);
          const result = {
            insertId: Number(info.lastInsertRowid),
            affectedRows: info.changes,
            changes: info.changes
          };
          return [result, null];
        }
      } catch (err) {
        throw err;
      }
    },
    async query(sql, params = []) {
      return this.execute(sql, params);
    },
    async end() {
      try {
        db.close();
      } catch {}
    }
  };
}

// Global exported pool wrapper
export const pool = {
  get dbType() {
    return databaseType;
  },
  async execute(sql, params = []) {
    return activePool.execute(sql, params);
  },
  async query(sql, params = []) {
    return activePool.query(sql, params);
  },
  async end() {
    if (activePool && activePool.end) {
      await activePool.end();
    }
  }
};

export async function initializeDatabase() {
  const mysqlPool = await attemptMySQLConnection();

  if (mysqlPool) {
    databaseType = "mysql";
    activePool = mysqlPool;
    console.log("⚡ [Database] Connected successfully to MySQL (host: " + (process.env.MYSQL_HOST || "localhost") + ")");
    await initializeMySQLTables();
  } else {
    databaseType = "sqlite";
    activePool = createSqliteWrapper();
    console.log("📦 [Database] Using embedded SQLite engine at " + sqliteFilePath);
    initializeSQLiteTables(activePool.rawDb);
  }

  // Seed SSA initial records if tables are fresh
  await seedInitialData();
}

async function initializeMySQLTables() {
  const connection = await activePool.getConnection();
  try {
    await connection.query(`CREATE TABLE IF NOT EXISTS users (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(80) NOT NULL,
      email VARCHAR(254) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(80) NOT NULL DEFAULT 'Mission Specialist',
      timezone VARCHAR(80) NOT NULL DEFAULT 'UTC',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    await connection.query(`CREATE TABLE IF NOT EXISTS user_sessions (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      user_id BIGINT UNSIGNED NOT NULL,
      token_jti CHAR(36) NOT NULL UNIQUE,
      expires_at DATETIME NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_sessions_user (user_id), INDEX idx_sessions_expiry (expires_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    await connection.query(`CREATE TABLE IF NOT EXISTS user_settings (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      user_id BIGINT UNSIGNED NOT NULL UNIQUE,
      performance VARCHAR(20) NOT NULL DEFAULT 'auto',
      reduced_motion TINYINT(1) NOT NULL DEFAULT 0,
      high_contrast TINYINT(1) NOT NULL DEFAULT 0,
      large_text TINYINT(1) NOT NULL DEFAULT 0,
      animations TINYINT(1) NOT NULL DEFAULT 1,
      home_live_stats TINYINT(1) NOT NULL DEFAULT 1,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_settings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    await connection.query(`CREATE TABLE IF NOT EXISTS user_watchlist (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      user_id BIGINT UNSIGNED NOT NULL,
      item_id VARCHAR(100) NOT NULL,
      item_type VARCHAR(50) NOT NULL DEFAULT 'module',
      label VARCHAR(120) NOT NULL,
      icon VARCHAR(20) DEFAULT '☆',
      metadata TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_watchlist_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_watchlist_user (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    await connection.query(`CREATE TABLE IF NOT EXISTS satellites (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      sat_id VARCHAR(50) NOT NULL UNIQUE,
      name VARCHAR(120) NOT NULL,
      type VARCHAR(40) NOT NULL DEFAULT 'SAT',
      altitude FLOAT NOT NULL,
      velocity FLOAT NOT NULL,
      inclination FLOAT NOT NULL,
      eccentricity FLOAT NOT NULL DEFAULT 0.001,
      period FLOAT NOT NULL,
      lat FLOAT NOT NULL,
      lon FLOAT NOT NULL,
      operator VARCHAR(80) NOT NULL,
      risk VARCHAR(20) NOT NULL DEFAULT 'LOW',
      launch_date VARCHAR(30),
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    await connection.query(`CREATE TABLE IF NOT EXISTS debris (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      deb_id VARCHAR(50) NOT NULL UNIQUE,
      name VARCHAR(120) NOT NULL,
      altitude FLOAT NOT NULL,
      velocity FLOAT NOT NULL,
      inclination FLOAT NOT NULL,
      eccentricity FLOAT NOT NULL DEFAULT 0.005,
      period FLOAT NOT NULL,
      lat FLOAT NOT NULL,
      lon FLOAT NOT NULL,
      operator VARCHAR(80) NOT NULL,
      risk VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
      rcs_size VARCHAR(20) DEFAULT 'MEDIUM',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    await connection.query(`CREATE TABLE IF NOT EXISTS space_stations (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      station_id VARCHAR(50) NOT NULL UNIQUE,
      name VARCHAR(120) NOT NULL,
      crew INT NOT NULL DEFAULT 0,
      altitude FLOAT NOT NULL,
      velocity FLOAT NOT NULL,
      lat FLOAT NOT NULL,
      lon FLOAT NOT NULL,
      inclination FLOAT NOT NULL,
      operator VARCHAR(80) NOT NULL,
      status VARCHAR(40) NOT NULL DEFAULT 'CREWED',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    await connection.query(`CREATE TABLE IF NOT EXISTS conjunctions (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      conj_id VARCHAR(50) NOT NULL UNIQUE,
      obj_a_id VARCHAR(50) NOT NULL,
      obj_a_name VARCHAR(120) NOT NULL,
      obj_b_id VARCHAR(50) NOT NULL,
      obj_b_name VARCHAR(120) NOT NULL,
      miss_distance_km FLOAT NOT NULL,
      rel_velocity_kms FLOAT NOT NULL,
      risk_level VARCHAR(20) NOT NULL DEFAULT 'LOW',
      collision_probability FLOAT NOT NULL DEFAULT 0.001,
      tca DATETIME NOT NULL,
      status VARCHAR(40) NOT NULL DEFAULT 'MONITORING',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    await connection.query(`CREATE TABLE IF NOT EXISTS space_weather (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      kp_index FLOAT NOT NULL,
      solar_wind_speed FLOAT NOT NULL,
      solar_flare VARCHAR(20) NOT NULL,
      proton_flux FLOAT NOT NULL,
      geomagnetic_status VARCHAR(60) NOT NULL,
      aurora_latitude FLOAT NOT NULL,
      recorded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    await connection.query(`CREATE TABLE IF NOT EXISTS near_earth_objects (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      neo_id VARCHAR(50) NOT NULL UNIQUE,
      name VARCHAR(120) NOT NULL,
      diameter_m FLOAT NOT NULL,
      velocity_kms FLOAT NOT NULL,
      miss_distance_ld FLOAT NOT NULL,
      is_hazardous TINYINT(1) NOT NULL DEFAULT 0,
      close_approach DATETIME NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    await connection.query(`CREATE TABLE IF NOT EXISTS alerts (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      severity VARCHAR(20) NOT NULL DEFAULT 'INFO',
      title VARCHAR(150) NOT NULL,
      description TEXT NOT NULL,
      object_id VARCHAR(50),
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  } finally {
    connection.release();
  }
}

function initializeSQLiteTables(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'Mission Specialist',
      timezone TEXT NOT NULL DEFAULT 'UTC',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token_jti TEXT NOT NULL UNIQUE,
      expires_at DATETIME NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_sessions_user ON user_sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_expiry ON user_sessions(expires_at);

    CREATE TABLE IF NOT EXISTS user_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      performance TEXT NOT NULL DEFAULT 'auto',
      reduced_motion INTEGER NOT NULL DEFAULT 0,
      high_contrast INTEGER NOT NULL DEFAULT 0,
      large_text INTEGER NOT NULL DEFAULT 0,
      animations INTEGER NOT NULL DEFAULT 1,
      home_live_stats INTEGER NOT NULL DEFAULT 1,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS user_watchlist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      item_id TEXT NOT NULL,
      item_type TEXT NOT NULL DEFAULT 'module',
      label TEXT NOT NULL,
      icon TEXT DEFAULT '☆',
      metadata TEXT DEFAULT '{}',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_watchlist_user ON user_watchlist(user_id);

    CREATE TABLE IF NOT EXISTS satellites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sat_id TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'SAT',
      altitude REAL NOT NULL,
      velocity REAL NOT NULL,
      inclination REAL NOT NULL,
      eccentricity REAL NOT NULL DEFAULT 0.001,
      period REAL NOT NULL,
      lat REAL NOT NULL,
      lon REAL NOT NULL,
      operator TEXT NOT NULL,
      risk TEXT NOT NULL DEFAULT 'LOW',
      launch_date TEXT,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS debris (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      deb_id TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      altitude REAL NOT NULL,
      velocity REAL NOT NULL,
      inclination REAL NOT NULL,
      eccentricity REAL NOT NULL DEFAULT 0.005,
      period REAL NOT NULL,
      lat REAL NOT NULL,
      lon REAL NOT NULL,
      operator TEXT NOT NULL,
      risk TEXT NOT NULL DEFAULT 'MEDIUM',
      rcs_size TEXT DEFAULT 'MEDIUM',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS space_stations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      station_id TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      crew INTEGER NOT NULL DEFAULT 0,
      altitude REAL NOT NULL,
      velocity REAL NOT NULL,
      lat REAL NOT NULL,
      lon REAL NOT NULL,
      inclination REAL NOT NULL,
      operator TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'CREWED',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS conjunctions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conj_id TEXT NOT NULL UNIQUE,
      obj_a_id TEXT NOT NULL,
      obj_a_name TEXT NOT NULL,
      obj_b_id TEXT NOT NULL,
      obj_b_name TEXT NOT NULL,
      miss_distance_km REAL NOT NULL,
      rel_velocity_kms REAL NOT NULL,
      risk_level TEXT NOT NULL DEFAULT 'LOW',
      collision_probability REAL NOT NULL DEFAULT 0.001,
      tca DATETIME NOT NULL,
      status TEXT NOT NULL DEFAULT 'MONITORING',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS space_weather (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      kp_index REAL NOT NULL,
      solar_wind_speed REAL NOT NULL,
      solar_flare TEXT NOT NULL,
      proton_flux REAL NOT NULL,
      geomagnetic_status TEXT NOT NULL,
      aurora_latitude REAL NOT NULL,
      recorded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS near_earth_objects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      neo_id TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      diameter_m REAL NOT NULL,
      velocity_kms REAL NOT NULL,
      miss_distance_ld REAL NOT NULL,
      is_hazardous INTEGER NOT NULL DEFAULT 0,
      close_approach DATETIME NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      severity TEXT NOT NULL DEFAULT 'INFO',
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      object_id TEXT,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

async function seedInitialData() {
  try {
    const [satCount] = await pool.execute("SELECT COUNT(*) as cnt FROM satellites");
    const count = Number(satCount[0]?.cnt || satCount[0]?.["COUNT(*)"] || 0);

    if (count === 0) {
      console.log("🚀 [Database] Seeding initial Space Situational Awareness datasets...");

      for (const s of seedSatellites) {
        await pool.execute(
          "INSERT INTO satellites (sat_id, name, type, altitude, velocity, inclination, eccentricity, period, lat, lon, operator, risk, launch_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [s.sat_id, s.name, s.type, s.altitude, s.velocity, s.inclination, s.eccentricity, s.period, s.lat, s.lon, s.operator, s.risk, s.launch_date]
        );
      }

      for (const d of seedDebris) {
        await pool.execute(
          "INSERT INTO debris (deb_id, name, altitude, velocity, inclination, eccentricity, period, lat, lon, operator, risk, rcs_size) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [d.deb_id, d.name, d.altitude, d.velocity, d.inclination, d.eccentricity, d.period, d.lat, d.lon, d.operator, d.risk, d.rcs_size]
        );
      }

      for (const st of seedStations) {
        await pool.execute(
          "INSERT INTO space_stations (station_id, name, crew, altitude, velocity, lat, lon, inclination, operator, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [st.station_id, st.name, st.crew, st.altitude, st.velocity, st.lat, st.lon, st.inclination, st.operator, st.status]
        );
      }

      for (const c of seedConjunctions) {
        await pool.execute(
          "INSERT INTO conjunctions (conj_id, obj_a_id, obj_a_name, obj_b_id, obj_b_name, miss_distance_km, rel_velocity_kms, risk_level, collision_probability, tca, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [c.conj_id, c.obj_a_id, c.obj_a_name, c.obj_b_id, c.obj_b_name, c.miss_distance_km, c.rel_velocity_kms, c.risk_level, c.collision_probability, c.tca, c.status]
        );
      }

      for (const w of seedSpaceWeather) {
        await pool.execute(
          "INSERT INTO space_weather (kp_index, solar_wind_speed, solar_flare, proton_flux, geomagnetic_status, aurora_latitude) VALUES (?, ?, ?, ?, ?, ?)",
          [w.kp_index, w.solar_wind_speed, w.solar_flare, w.proton_flux, w.geomagnetic_status, w.aurora_latitude]
        );
      }

      for (const n of seedNEOs) {
        await pool.execute(
          "INSERT INTO near_earth_objects (neo_id, name, diameter_m, velocity_kms, miss_distance_ld, is_hazardous, close_approach) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [n.neo_id, n.name, n.diameter_m, n.velocity_kms, n.miss_distance_ld, n.is_hazardous, n.close_approach]
        );
      }

      for (const a of seedAlerts) {
        await pool.execute(
          "INSERT INTO alerts (severity, title, description, object_id) VALUES (?, ?, ?, ?)",
          [a.severity, a.title, a.description, a.object_id]
        );
      }

      console.log("✅ [Database] Seed data populated successfully.");
    }
  } catch (err) {
    console.warn("⚠️ [Database] Seed warning:", err.message);
  }
}
