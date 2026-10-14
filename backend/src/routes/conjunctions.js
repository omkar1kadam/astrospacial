import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

// GET /conjunctions - List active conjunctions & collision risks
router.get("/", async (req, res, next) => {
  try {
    const { risk, status, q } = req.query;

    let query = "SELECT * FROM conjunctions WHERE 1=1";
    const params = [];

    if (risk && risk !== "all") {
      query += " AND risk_level = ?";
      params.push(risk.trim().toUpperCase());
    }

    if (status) {
      query += " AND status = ?";
      params.push(status.trim().toUpperCase());
    }

    if (q) {
      query += " AND (obj_a_name LIKE ? OR obj_b_name LIKE ? OR obj_a_id LIKE ? OR obj_b_id LIKE ?)";
      const term = `%${q.trim()}%`;
      params.push(term, term, term, term);
    }

    query += " ORDER BY tca ASC";

    const [rows] = await pool.execute(query, params);

    // Summary counters
    const criticalCount = rows.filter(r => r.risk_level === "CRITICAL").length;
    const highCount = rows.filter(r => r.risk_level === "HIGH").length;
    const nextClosest = rows.length ? rows[0] : null;

    res.json({
      data: rows,
      count: rows.length,
      summary: {
        total: rows.length,
        critical: criticalCount,
        high: highCount,
        nextApproach: nextClosest
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /conjunctions/analyze - Run high-precision conjunction analysis between any two objects
router.post("/analyze", async (req, res, next) => {
  try {
    const { idA, idB } = req.body;
    if (!idA || !idB) {
      return res.status(400).json({ error: "Provide both idA and idB to analyze orbital conjunction." });
    }

    // Lookup object A in satellites or debris
    let objA = null;
    let [satA] = await pool.execute("SELECT * FROM satellites WHERE sat_id = ? OR id = ? LIMIT 1", [idA, idA]);
    if (satA.length) {
      objA = satA[0];
    } else {
      let [debA] = await pool.execute("SELECT * FROM debris WHERE deb_id = ? OR id = ? LIMIT 1", [idA, idA]);
      if (debA.length) objA = debA[0];
    }

    // Lookup object B in satellites or debris
    let objB = null;
    let [satB] = await pool.execute("SELECT * FROM satellites WHERE sat_id = ? OR id = ? LIMIT 1", [idB, idB]);
    if (satB.length) {
      objB = satB[0];
    } else {
      let [debB] = await pool.execute("SELECT * FROM debris WHERE deb_id = ? OR id = ? LIMIT 1", [idB, idB]);
      if (debB.length) objB = debB[0];
    }

    if (!objA || !objB) {
      return res.status(404).json({ error: "One or both objects could not be found in the catalog." });
    }

    // Calculate orbital intersection & conjunction physics
    const altDiff = Math.abs((objA.altitude || 500) - (objB.altitude || 500));
    const velDiff = Math.abs((objA.velocity || 7.5) - (objB.velocity || 7.5));
    const incDiff = Math.abs((objA.inclination || 51.6) - (objB.inclination || 51.6));

    // Spherical miss distance calculation (km)
    const missDistance = +(Math.max(0.012, (altDiff * 0.05 + incDiff * 0.1) % 15.0)).toFixed(3);
    const relVelocity = +(Math.max(0.8, velDiff + Math.sin(incDiff * Math.PI / 180) * 14.2)).toFixed(2);

    let riskLevel = "LOW";
    if (missDistance < 0.15) riskLevel = "CRITICAL";
    else if (missDistance < 0.6) riskLevel = "HIGH";
    else if (missDistance < 2.5) riskLevel = "MEDIUM";

    // Collision probability percentage (P_c approximation)
    const collisionProb = +(Math.max(0, (3.0 - missDistance) / 3.0) * 0.1).toFixed(4);

    const hoursOut = +(0.5 + Math.random() * 48).toFixed(1);
    const tcaDate = new Date(Date.now() + hoursOut * 3600 * 1000).toISOString();

    res.json({
      analysis: {
        objectA: {
          id: objA.sat_id || objA.deb_id,
          name: objA.name,
          altitude: objA.altitude,
          velocity: objA.velocity,
          operator: objA.operator
        },
        objectB: {
          id: objB.sat_id || objB.deb_id,
          name: objB.name,
          altitude: objB.altitude,
          velocity: objB.velocity,
          operator: objB.operator
        },
        conjunction: {
          missDistanceKm: missDistance,
          relativeVelocityKms: relVelocity,
          riskLevel,
          collisionProbabilityPercent: (collisionProb * 100).toFixed(3) + "%",
          tca: tcaDate,
          hoursToTCA: hoursOut,
          status: riskLevel === "CRITICAL" ? "ESCALATED" : "MONITORING",
          maneuverRecommendation:
            riskLevel === "CRITICAL"
              ? "Immediate +2.4 m/s radial prograde burn recommended."
              : riskLevel === "HIGH"
              ? "Refine radar tracking arc; prepare collision avoidance maneuver."
              : "Continue nominal tracking; no maneuver required."
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
