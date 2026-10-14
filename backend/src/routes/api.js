import { Router } from "express";
import { pool } from "../db.js";
import { modules } from "../data/modules.js";
import authRouter from "./auth.js";
import satellitesRouter from "./satellites.js";
import debrisRouter from "./debris.js";
import conjunctionsRouter from "./conjunctions.js";
import stationsRouter from "./stations.js";
import weatherRouter from "./weather.js";
import neosRouter from "./neos.js";
import watchlistRouter from "./watchlist.js";
import settingsRouter from "./settings.js";
import alertsRouter from "./alerts.js";
import statsRouter from "./stats.js";

const router = Router();

// API Health Check
router.get("/health", async (_req, res, next) => {
  try {
    await pool.query("SELECT 1");
    res.json({
      status: "ok",
      database: "connected",
      databaseType: pool.dbType,
      service: "astrospacial-api",
      version: "2.0.0",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

// Demo module registry
router.get("/modules", (_req, res) => {
  res.json({
    data: modules,
    count: modules.length,
    source: "database"
  });
});

// Mount Sub-routers
router.use("/auth", authRouter);
router.use("/satellites", satellitesRouter);
router.use("/debris", debrisRouter);
router.use("/conjunctions", conjunctionsRouter);
router.use("/stations", stationsRouter);
router.use("/space-weather", weatherRouter);
router.use("/neos", neosRouter);
router.use("/watchlist", watchlistRouter);
router.use("/settings", settingsRouter);
router.use("/alerts", alertsRouter);
router.use("/stats", statsRouter);

// Backwards compatibility for legacy root /me
router.use("/me", (req, res, next) => {
  req.url = "/me";
  authRouter(req, res, next);
});

export default router;
