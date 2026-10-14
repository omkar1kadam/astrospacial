import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

// GET /alerts - Live space alert feed
router.get("/", async (req, res, next) => {
  try {
    const { severity, limit = 50 } = req.query;

    let query = "SELECT * FROM alerts WHERE 1=1";
    const params = [];

    if (severity) {
      query += " AND severity = ?";
      params.push(severity.trim().toUpperCase());
    }

    query += " ORDER BY created_at DESC LIMIT ?";
    params.push(Number(limit) || 50);

    const [rows] = await pool.execute(query, params);

    res.json({
      data: rows,
      count: rows.length
    });
  } catch (error) {
    next(error);
  }
});

// POST /alerts - Ingest new alert
router.post("/", async (req, res, next) => {
  try {
    const { severity = "INFO", title, description, object_id = null } = req.body;
    if (!title || !description) {
      return res.status(400).json({ error: "Missing required alert fields (title, description)." });
    }

    const [result] = await pool.execute(
      "INSERT INTO alerts (severity, title, description, object_id) VALUES (?, ?, ?, ?)",
      [severity.toUpperCase(), title, description, object_id]
    );

    res.status(201).json({
      alert: { id: result.insertId, severity: severity.toUpperCase(), title, description, object_id },
      message: "Alert logged successfully."
    });
  } catch (error) {
    next(error);
  }
});

export default router;
