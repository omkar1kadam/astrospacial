import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

// GET /stats - Overall dashboard counters and metrics
router.get("/", async (_req, res, next) => {
  try {
    const [sat] = await pool.execute("SELECT COUNT(*) as count FROM satellites");
    const [deb] = await pool.execute("SELECT COUNT(*) as count FROM debris");
    const [st] = await pool.execute("SELECT COUNT(*) as count FROM space_stations");
    const [neo] = await pool.execute("SELECT COUNT(*) as count FROM near_earth_objects");
    const [conj] = await pool.execute("SELECT COUNT(*) as count FROM conjunctions");
    const [crit] = await pool.execute("SELECT COUNT(*) as count FROM conjunctions WHERE risk_level = 'CRITICAL'");
    const [weather] = await pool.execute("SELECT * FROM space_weather ORDER BY recorded_at DESC LIMIT 1");

    const satCount = Number(sat[0]?.count || 0);
    const debCount = Number(deb[0]?.count || 0);
    const stCount = Number(st[0]?.count || 0);
    const neoCount = Number(neo[0]?.count || 0);
    const conjCount = Number(conj[0]?.count || 0);
    const critCount = Number(crit[0]?.count || 0);

    // Baseline stats matching the frontend live tickers
    const liveObjects = 9420 + satCount;
    const trackedDebris = 22380 + debCount;

    res.json({
      counters: {
        liveObjects,
        trackedDebris,
        spaceStations: 17 + stCount,
        nearEarthObjects: 2430 + neoCount,
        activeConjunctions: conjCount,
        criticalConjunctions: critCount
      },
      spaceWeather: weather[0] || null,
      catalogTotals: {
        registeredSatellites: satCount,
        cataloguedDebris: debCount,
        crewedStations: stCount,
        monitoredAsteroids: neoCount
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

export default router;
