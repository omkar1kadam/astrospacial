import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

// GET /neos - Near-Earth Asteroids & close approaches
router.get("/", async (req, res, next) => {
  try {
    const { hazardous, limit = 50 } = req.query;

    let query = "SELECT * FROM near_earth_objects WHERE 1=1";
    const params = [];

    if (hazardous === "true" || hazardous === "1") {
      query += " AND is_hazardous = 1";
    }

    query += " ORDER BY close_approach ASC LIMIT ?";
    params.push(Number(limit) || 50);

    const [rows] = await pool.execute(query, params);

    const enriched = rows.map(n => ({
      ...n,
      miss_distance_km: +(n.miss_distance_ld * 384400).toLocaleString("en-US", { maximumFractionDigits: 0 }),
      kinetic_energy_megatons: +(n.diameter_m * 0.05).toFixed(1)
    }));

    res.json({
      data: enriched,
      count: enriched.length,
      lunarDistanceDefinitionKm: 384400
    });
  } catch (error) {
    next(error);
  }
});

export default router;
