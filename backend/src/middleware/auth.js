import jwt from "jsonwebtoken";
import { pool } from "../db.js";

export const COOKIE_NAME = "astrospacial_session";

export function getJwtSecret() {
  return process.env.JWT_SECRET || "astrospacial_super_secret_jwt_key_default_32chars_long!";
}

export async function requireAuth(req, res, next) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) {
    return res.status(401).json({ error: "Please sign in to continue." });
  }

  try {
    const payload = jwt.verify(token, getJwtSecret());
    const [sessions] = await pool.execute(
      "SELECT s.id, s.user_id FROM user_sessions s WHERE s.token_jti = ? AND s.user_id = ? AND s.expires_at > UTC_TIMESTAMP() LIMIT 1",
      [payload.jti, payload.sub]
    );

    if (!sessions || !sessions.length) {
      return res.status(401).json({ error: "Your session has expired. Please sign in again." });
    }

    req.auth = { userId: Number(payload.sub), sessionId: sessions[0].id };
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Your session is invalid or expired. Please sign in again." });
    }
    next(error);
  }
}

export async function optionalAuth(req, _res, next) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) {
    req.auth = null;
    return next();
  }

  try {
    const payload = jwt.verify(token, getJwtSecret());
    const [sessions] = await pool.execute(
      "SELECT s.id, s.user_id FROM user_sessions s WHERE s.token_jti = ? AND s.user_id = ? AND s.expires_at > UTC_TIMESTAMP() LIMIT 1",
      [payload.jti, payload.sub]
    );

    if (sessions && sessions.length) {
      req.auth = { userId: Number(payload.sub), sessionId: sessions[0].id };
    } else {
      req.auth = null;
    }
  } catch {
    req.auth = null;
  }
  next();
}
