import { Router } from "express";
import { pool } from "../db.js";
import { optionalAuth } from "../middleware/auth.js";

const router = Router();

// GET /satellites - List, filter, search satellites
router.get("/", async (req, res, next) => {
  try {
    const { q, operator, risk, limit = 100, offset = 0 } = req.query;

    let query = "SELECT * FROM satellites WHERE 1=1";
    const params = [];

    if (q) {
      query += " AND (name LIKE ? OR sat_id LIKE ? OR operator LIKE ?)";
      const term = `%${q.trim()}%`;
      params.push(term, term, term);
    }

    if (operator) {
      query += " AND operator = ?";
      params.push(operator.trim());
    }

    if (risk) {
      query += " AND risk = ?";
      params.push(risk.trim().toUpperCase());
    }

    query += " ORDER BY altitude ASC LIMIT ? OFFSET ?";
    params.push(Number(limit) || 100, Number(offset) || 0);

    const [rows] = await pool.execute(query, params);
    const [totalRows] = await pool.execute("SELECT COUNT(*) as total FROM satellites");

    res.json({
      data: rows,
      count: rows.length,
      total: Number(totalRows[0]?.total || totalRows[0]?.["COUNT(*)"] || rows.length)
    });
  } catch (error) {
    next(error);
  }
});

// GET /satellites/:id - Get satellite by ID or sat_id
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute(
      "SELECT * FROM satellites WHERE id = ? OR sat_id = ? LIMIT 1",
      [id, id]
    );

    if (!rows || !rows.length) {
      return res.status(404).json({ error: "Satellite not found." });
    }

    const sat = rows[0];
    // Dynamic simulated telemetry calculation
    const nowSec = Date.now() / 1000;
    const periodSec = (sat.period || 95) * 60;
    const orbitalAngle = ((nowSec % periodSec) / periodSec) * 2 * Math.PI;
    const liveLat = +(Math.sin(orbitalAngle) * (sat.inclination || 51.6)).toFixed(3);
    const liveLon = +(((nowSec / 240) % 360) - 180).toFixed(3);

    res.json({
      satellite: {
        ...sat,
        telemetry: {
          currentLat: liveLat,
          currentLon: liveLon,
          currentAltitudeKm: sat.altitude,
          orbitalVelocityKms: sat.velocity,
          solarArrayPowerWatts: 3200 + Math.round(Math.random() * 400),
          temperatureKelvin: 285 + Math.round(Math.random() * 20),
          status: "NOMINAL"
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /satellites - Register tracked satellite
router.post("/", optionalAuth, async (req, res, next) => {
  try {
    const { name, altitude, velocity, inclination, operator, launch_date, risk = "LOW" } = req.body;
    if (!name || !altitude || !velocity) {
      return res.status(400).json({ error: "Missing required satellite fields (name, altitude, velocity)." });
    }

    const sat_id = `OBJ-${String(Math.floor(Math.random() * 90000) + 10000)}`;
    const period = +(84 + Number(altitude) * 0.085).toFixed(1);
    const inc = Number(inclination) || 51.6;

    await pool.execute(
      "INSERT INTO satellites (sat_id, name, type, altitude, velocity, inclination, period, lat, lon, operator, risk, launch_date) VALUES (?, ?, 'SAT', ?, ?, ?, ?, 0.0, 0.0, ?, ?, ?)",
      [sat_id, name, Number(altitude), Number(velocity), inc, period, operator || "PRIVATE", risk, launch_date || new Date().toISOString().split("T")[0]]
    );

    const [rows] = await pool.execute("SELECT * FROM satellites WHERE sat_id = ?", [sat_id]);
    res.status(201).json({ satellite: rows[0], message: "Satellite registered successfully." });
  } catch (error) {
    next(error);
  }
});

export default router;
