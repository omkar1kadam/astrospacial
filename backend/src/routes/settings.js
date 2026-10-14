import { Router } from "express";
import { pool } from "../db.js";
import { optionalAuth, requireAuth } from "../middleware/auth.js";

const router = Router();

const defaultSettings = {
  performance: "auto",
  reducedMotion: false,
  highContrast: false,
  largeText: false,
  animations: true,
  homeLiveStats: true
};

// GET /settings - Retrieve user interface preferences
router.get("/", optionalAuth, async (req, res, next) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.json({ settings: defaultSettings, source: "default" });
    }

    const [rows] = await pool.execute(
      "SELECT * FROM user_settings WHERE user_id = ? LIMIT 1",
      [userId]
    );

    if (!rows.length) {
      return res.json({ settings: defaultSettings, source: "default" });
    }

    const s = rows[0];
    res.json({
      settings: {
        performance: s.performance,
        reducedMotion: Boolean(s.reduced_motion),
        highContrast: Boolean(s.high_contrast),
        largeText: Boolean(s.large_text),
        animations: Boolean(s.animations),
        homeLiveStats: Boolean(s.home_live_stats)
      },
      source: "cloud"
    });
  } catch (error) {
    next(error);
  }
});

// PUT /settings - Save user interface preferences
router.put("/", requireAuth, async (req, res, next) => {
  try {
    const userId = req.auth.userId;
    const body = req.body || {};

    const performance = ["low", "medium", "high", "auto"].includes(body.performance)
      ? body.performance
      : "auto";
    const reducedMotion = body.reducedMotion ? 1 : 0;
    const highContrast = body.highContrast ? 1 : 0;
    const largeText = body.largeText ? 1 : 0;
    const animations = body.animations !== false ? 1 : 0;
    const homeLiveStats = body.homeLiveStats !== false ? 1 : 0;

    await pool.execute(
      `INSERT INTO user_settings (user_id, performance, reduced_motion, high_contrast, large_text, animations, home_live_stats)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET
         performance = excluded.performance,
         reduced_motion = excluded.reduced_motion,
         high_contrast = excluded.high_contrast,
         large_text = excluded.large_text,
         animations = excluded.animations,
         home_live_stats = excluded.home_live_stats,
         updated_at = CURRENT_TIMESTAMP`,
      [userId, performance, reducedMotion, highContrast, largeText, animations, homeLiveStats]
    ).catch(async () => {
      // Fallback for MySQL syntax
      await pool.execute(
        `INSERT INTO user_settings (user_id, performance, reduced_motion, high_contrast, large_text, animations, home_live_stats)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           performance = VALUES(performance),
           reduced_motion = VALUES(reduced_motion),
           high_contrast = VALUES(high_contrast),
           large_text = VALUES(large_text),
           animations = VALUES(animations),
           home_live_stats = VALUES(home_live_stats)`,
        [userId, performance, reducedMotion, highContrast, largeText, animations, homeLiveStats]
      );
    });

    res.json({
      settings: {
        performance,
        reducedMotion: Boolean(reducedMotion),
        highContrast: Boolean(highContrast),
        largeText: Boolean(largeText),
        animations: Boolean(animations),
        homeLiveStats: Boolean(homeLiveStats)
      },
      message: "Preferences saved to your cloud profile."
    });
  } catch (error) {
    next(error);
  }
});

export default router;
