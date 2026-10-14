import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import { pool } from "../db.js";
import { requireAuth, getJwtSecret, COOKIE_NAME } from "../middleware/auth.js";

const router = Router();

const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000
});

const publicUser = row => ({
  id: Number(row.id),
  name: row.name,
  email: row.email,
  role: row.role,
  timezone: row.timezone,
  provider: "Email",
  initial: (row.name || "M").charAt(0).toUpperCase(),
  emailVerified: false,
  createdAt: row.created_at
});

const validEmail = email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

async function createSession(res, user) {
  const jti = randomUUID();
  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await pool.execute(
    "INSERT INTO user_sessions (user_id, token_jti, expires_at) VALUES (?, ?, ?)",
    [user.id, jti, expiresAt]
  );

  const token = jwt.sign({ sub: String(user.id), jti }, getJwtSecret(), { expiresIn });
  res.cookie(COOKIE_NAME, token, cookieOptions());
}

// POST /auth/signup
router.post("/signup", async (req, res, next) => {
  try {
    const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const password = typeof req.body?.password === "string" ? req.body.password : "";

    if (name.length < 2 || name.length > 80) {
      return res.status(400).json({ error: "Name must be between 2 and 80 characters." });
    }
    if (!validEmail(email) || email.length > 254) {
      return res.status(400).json({ error: "Enter a valid email address." });
    }
    if (password.length < 8 || password.length > 72) {
      return res.status(400).json({ error: "Password must be between 8 and 72 characters." });
    }

    const [existing] = await pool.execute("SELECT id FROM users WHERE email = ? LIMIT 1", [email]);
    if (existing && existing.length) {
      return res.status(409).json({ error: "An account with this email already exists. Please sign in." });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const timezone = typeof req.body.timezone === "string" ? req.body.timezone.slice(0, 80) : "UTC";

    const [result] = await pool.execute(
      "INSERT INTO users (name, email, password_hash, timezone) VALUES (?, ?, ?, ?)",
      [name, email, passwordHash, timezone]
    );

    const [rows] = await pool.execute(
      "SELECT id, name, email, role, timezone, created_at FROM users WHERE id = ?",
      [result.insertId]
    );

    const user = publicUser(rows[0]);
    await createSession(res, rows[0]);

    // Initialize default settings for user
    try {
      await pool.execute("INSERT OR IGNORE INTO user_settings (user_id) VALUES (?)", [rows[0].id]);
    } catch {}

    res.status(201).json({ user, message: "Account created successfully." });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY" || (error.message && error.message.includes("UNIQUE"))) {
      return res.status(409).json({ error: "An account with this email already exists. Please sign in." });
    }
    next(error);
  }
});

// POST /auth/login
router.post("/login", async (req, res, next) => {
  try {
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const password = typeof req.body?.password === "string" ? req.body.password : "";

    if (!validEmail(email) || !password) {
      return res.status(400).json({ error: "Enter your email and password." });
    }

    const [rows] = await pool.execute(
      "SELECT id, name, email, password_hash, role, timezone, created_at FROM users WHERE email = ? LIMIT 1",
      [email]
    );

    if (!rows || !rows.length || !(await bcrypt.compare(password, rows[0].password_hash))) {
      return res.status(401).json({ error: "Incorrect email or password." });
    }

    await createSession(res, rows[0]);
    res.json({ user: publicUser(rows[0]), message: "Signed in successfully." });
  } catch (error) {
    next(error);
  }
});

// GET /auth/me
router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      "SELECT id, name, email, role, timezone, created_at FROM users WHERE id = ? LIMIT 1",
      [req.auth.userId]
    );

    if (!rows || !rows.length) {
      return res.status(401).json({ error: "Account not found." });
    }

    res.json({ user: publicUser(rows[0]) });
  } catch (error) {
    next(error);
  }
});

// PATCH /auth/me
router.patch("/me", requireAuth, async (req, res, next) => {
  try {
    const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
    const role = typeof req.body?.role === "string" ? req.body.role.trim().slice(0, 80) : "Mission Specialist";
    const timezone = typeof req.body?.timezone === "string" ? req.body.timezone.trim().slice(0, 80) : "UTC";

    if (name.length < 2 || name.length > 80) {
      return res.status(400).json({ error: "Name must be between 2 and 80 characters." });
    }

    await pool.execute(
      "UPDATE users SET name = ?, role = ?, timezone = ? WHERE id = ?",
      [name, role || "Mission Specialist", timezone || "UTC", req.auth.userId]
    );

    const [rows] = await pool.execute(
      "SELECT id, name, email, role, timezone, created_at FROM users WHERE id = ?",
      [req.auth.userId]
    );

    res.json({ user: publicUser(rows[0]), message: "Profile updated." });
  } catch (error) {
    next(error);
  }
});

// POST /auth/logout
router.post("/logout", async (req, res, next) => {
  try {
    const token = req.cookies?.[COOKIE_NAME];
    if (token) {
      try {
        const payload = jwt.verify(token, getJwtSecret(), { ignoreExpiration: true });
        if (payload?.jti) {
          await pool.execute("DELETE FROM user_sessions WHERE token_jti = ?", [payload.jti]);
        }
      } catch {}
    }

    res.clearCookie(COOKIE_NAME, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/"
    });

    res.json({ message: "Signed out successfully." });
  } catch (error) {
    next(error);
  }
});

// POST /auth/change-password
router.post("/change-password", requireAuth, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || newPassword.length < 8) {
      return res.status(400).json({ error: "New password must be at least 8 characters long." });
    }

    const [rows] = await pool.execute(
      "SELECT password_hash FROM users WHERE id = ? LIMIT 1",
      [req.auth.userId]
    );

    if (!rows.length || !(await bcrypt.compare(currentPassword, rows[0].password_hash))) {
      return res.status(401).json({ error: "Current password is incorrect." });
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    await pool.execute("UPDATE users SET password_hash = ? WHERE id = ?", [newHash, req.auth.userId]);

    res.json({ message: "Password updated successfully." });
  } catch (error) {
    next(error);
  }
});

export default router;
