import { Router } from "express";
import { pool } from "../db.js";
import { optionalAuth } from "../middleware/auth.js";

const router = Router();

// GET /watchlist - Retrieve watchlisted modules & tracked objects
router.get("/", optionalAuth, async (req, res, next) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.json({ data: [], count: 0, message: "Sign in to synchronize watchlist across devices." });
    }

    const [rows] = await pool.execute(
      "SELECT * FROM user_watchlist WHERE user_id = ? ORDER BY created_at DESC",
      [userId]
    );

    const items = rows.map(r => {
      let parsed = {};
      try {
        parsed = typeof r.metadata === "string" ? JSON.parse(r.metadata) : (r.metadata || {});
      } catch {}
      return {
        id: r.item_id,
        itemType: r.item_type,
        label: r.label,
        icon: r.icon,
        addedAt: r.created_at,
        ...parsed
      };
    });

    res.json({ data: items, count: items.length });
  } catch (error) {
    next(error);
  }
});

// POST /watchlist - Add item or tracked object to user's watchlist
router.post("/", optionalAuth, async (req, res, next) => {
  try {
    const userId = req.auth?.userId;
    const { id, label, icon = "☆", itemType = "module", ...metadata } = req.body;

    if (!id || !label) {
      return res.status(400).json({ error: "Missing required fields (id, label)." });
    }

    if (!userId) {
      return res.json({
        item: { id, label, icon, itemType, addedAt: new Date().toISOString(), ...metadata },
        message: "Saved in session. Sign in to save to your cloud account."
      });
    }

    // Check duplicate
    const [existing] = await pool.execute(
      "SELECT id FROM user_watchlist WHERE user_id = ? AND item_id = ? LIMIT 1",
      [userId, id]
    );

    if (existing.length) {
      return res.json({ message: "Item is already on your watchlist." });
    }

    await pool.execute(
      "INSERT INTO user_watchlist (user_id, item_id, item_type, label, icon, metadata) VALUES (?, ?, ?, ?, ?, ?)",
      [userId, id, itemType, label, icon, JSON.stringify(metadata)]
    );

    res.status(201).json({
      item: { id, label, icon, itemType, ...metadata },
      message: `${label} added to your watchlist.`
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /watchlist/:itemId - Remove item from user's watchlist
router.delete("/:itemId", optionalAuth, async (req, res, next) => {
  try {
    const userId = req.auth?.userId;
    const { itemId } = req.params;

    if (userId) {
      await pool.execute(
        "DELETE FROM user_watchlist WHERE user_id = ? AND (item_id = ? OR id = ?)",
        [userId, itemId, itemId]
      );
    }

    res.json({ message: "Item removed from watchlist.", itemId });
  } catch (error) {
    next(error);
  }
});

// POST /watchlist/sync - Bulk sync from localStorage
router.post("/sync", optionalAuth, async (req, res, next) => {
  try {
    const userId = req.auth?.userId;
    const { modules = [], objects = [] } = req.body;

    if (!userId) {
      return res.json({ synced: false, message: "Sign in to synchronize watchlist." });
    }

    for (const m of modules) {
      if (m.id && m.label) {
        await pool.execute(
          "INSERT OR IGNORE INTO user_watchlist (user_id, item_id, item_type, label, icon, metadata) VALUES (?, ?, 'module', ?, ?, '{}')",
          [userId, m.id, m.label, m.icon || "☆"]
        );
      }
    }

    for (const obj of objects) {
      if (obj.id && obj.name) {
        await pool.execute(
          "INSERT OR IGNORE INTO user_watchlist (user_id, item_id, item_type, label, icon, metadata) VALUES (?, ?, 'object', ?, '☆', ?)",
          [userId, obj.id, obj.name, JSON.stringify(obj)]
        );
      }
    }

    res.json({ synced: true, message: "Watchlist synchronized." });
  } catch (error) {
    next(error);
  }
});

export default router;
