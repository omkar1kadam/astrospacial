import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

// GET /debris - List, filter, search debris catalog
router.get("/", async (req, res, next) => {
  try {
    const { q, risk, rcs, limit = 100, offset = 0 } = req.query;

    let query = "SELECT * FROM debris WHERE 1=1";
    const params = [];

    if (q) {
      query += " AND (name LIKE ? OR deb_id LIKE ? OR operator LIKE ?)";
      const term = `%${q.trim()}%`;
      params.push(term, term, term);
    }

    if (risk) {
      query += " AND risk = ?";
      params.push(risk.trim().toUpperCase());
    }

    if (rcs) {
      query += " AND rcs_size = ?";
      params.push(rcs.trim().toUpperCase());
    }

    query += " ORDER BY altitude ASC LIMIT ? OFFSET ?";
    params.push(Number(limit) || 100, Number(offset) || 0);

    const [rows] = await pool.execute(query, params);
    const [stats] = await pool.execute(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN risk = 'CRITICAL' THEN 1 ELSE 0 END) as critical,
        SUM(CASE WHEN risk = 'HIGH' THEN 1 ELSE 0 END) as high,
        SUM(CASE WHEN risk = 'MEDIUM' THEN 1 ELSE 0 END) as medium,
        SUM(CASE WHEN risk = 'LOW' THEN 1 ELSE 0 END) as low
      FROM debris
    `);

    res.json({
      data: rows,
      count: rows.length,
      stats: stats[0] || {}
    });
  } catch (error) {
    next(error);
  }
});

// GET /debris/:id
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute(
      "SELECT * FROM debris WHERE id = ? OR deb_id = ? LIMIT 1",
      [id, id]
    );

    if (!rows || !rows.length) {
      return res.status(404).json({ error: "Debris object not found." });
    }

    res.json({ debris: rows[0] });
  } catch (error) {
    next(error);
  }
});

export default router;
