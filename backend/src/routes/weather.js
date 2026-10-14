import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

// GET /space-weather - Current solar & geomagnetic indicators
router.get("/", async (_req, res, next) => {
  try {
    const [rows] = await pool.execute(
      "SELECT * FROM space_weather ORDER BY recorded_at DESC LIMIT 1"
    );

    const current = rows[0] || {
      kp_index: 3.8,
      solar_wind_speed: 472.5,
      solar_flare: "M1.4",
      proton_flux: 0.85,
      geomagnetic_status: "G1 Minor Storm Watch",
      aurora_latitude: 58.5
    };

    // Calculate simulated fluctuations around the baseline
    const jitter = Math.sin(Date.now() / 60000);
    const liveWind = +(current.solar_wind_speed + jitter * 15.0).toFixed(1);
    const liveKp = +(Math.max(1.0, Math.min(9.0, current.kp_index + jitter * 0.4))).toFixed(1);

    res.json({
      data: {
        ...current,
        solar_wind_speed_km_s: liveWind,
        kp_index: liveKp,
        radio_blackout_scale: "R1 - Minor",
        solar_radiation_scale: "S1 - Minor",
        geomagnetic_storm_scale: liveKp >= 5.0 ? "G1 - Minor Storm" : "Quiet / Unsettled",
        aurora_forecast: {
          visibleNorthernLatitudes: `> ${Math.round(current.aurora_latitude || 58)}° N`,
          kpThreshold: 4.0,
          probabilityPercent: 68
        },
        sensors: {
          dscovr_status: "OPERATIONAL",
          ace_satellite_status: "NOMINAL",
          goes_xray_flux_status: "TRACKING_ACTIVE"
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /space-weather/forecast - 3-day forecast
router.get("/forecast", async (_req, res) => {
  const baseTime = Date.now();
  const forecast = [
    { day: "Day 1", expectedKpMax: 4.2, stormLevel: "G0 - None", flareRisk: "25% M-Class, 5% X-Class" },
    { day: "Day 2", expectedKpMax: 5.0, stormLevel: "G1 - Minor", flareRisk: "35% M-Class, 10% X-Class" },
    { day: "Day 3", expectedKpMax: 3.5, stormLevel: "G0 - None", flareRisk: "15% M-Class, 2% X-Class" }
  ];

  res.json({ forecast, generatedAt: new Date(baseTime).toISOString() });
});

export default router;
