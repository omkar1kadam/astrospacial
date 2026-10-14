import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

// GET /stations - All space stations
router.get("/", async (_req, res, next) => {
  try {
    const [rows] = await pool.execute("SELECT * FROM space_stations ORDER BY altitude ASC");

    // Dynamic telemetry coordinates
    const nowSec = Date.now() / 1000;
    const enriched = rows.map(st => {
      const orbitSec = 92.5 * 60;
      const angle = ((nowSec % orbitSec) / orbitSec) * 2 * Math.PI;
      const lat = +(Math.sin(angle) * (st.inclination || 51.6)).toFixed(3);
      const lon = +(((nowSec / 240) % 360) - 180).toFixed(3);

      return {
        ...st,
        currentCoordinates: { lat, lon },
        telemetry: {
          cabinPressureKpa: 101.3,
          oxygenLevelPercent: 21.0,
          internalTempCelsius: 22.4,
          powerGenerationKw: 120.5
        }
      };
    });

    res.json({
      data: enriched,
      count: enriched.length
    });
  } catch (error) {
    next(error);
  }
});

// GET /stations/:id
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute(
      "SELECT * FROM space_stations WHERE id = ? OR station_id = ? LIMIT 1",
      [id, id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: "Space station not found." });
    }

    res.json({ station: rows[0] });
  } catch (error) {
    next(error);
  }
});

export default router;
