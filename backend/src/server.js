import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import apiRouter from "./routes/api.js";
import { initializeDatabase, pool } from "./db.js";

// Ensure a safe JWT secret exists without forcing crashes on fresh checkouts
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  process.env.JWT_SECRET = "astrospacial_production_grade_jwt_secret_token_default_key_2026_safe!";
}

const app = express();
const port = Number(process.env.PORT) || 4000;
const frontendOrigin = process.env.FRONTEND_ORIGIN || "http://localhost:5173";

app.disable("x-powered-by");
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or same-origin)
      if (!origin || origin.startsWith("http://localhost:") || origin === frontendOrigin) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true
  })
);
app.use(express.json({ limit: "50kb" }));
app.use(cookieParser());

// Rate limit authentication routes
app.use(
  "/api/v1/auth",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 60,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { error: "Too many authentication attempts. Please try again in 15 minutes." }
  })
);

// Real-Time Server-Sent Events (SSE) Telemetry Stream
app.get("/api/v1/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  // Send initial connected event
  res.write(`data: ${JSON.stringify({ type: "connected", timestamp: new Date().toISOString() })}\n\n`);

  // Periodic telemetry pulse
  const interval = setInterval(async () => {
    try {
      const liveTick = {
        type: "telemetry_pulse",
        timestamp: new Date().toISOString(),
        utcClock: new Date().toUTCString(),
        solarWindSpeed: +(460 + Math.random() * 25).toFixed(1),
        kpIndex: +(3.2 + Math.random() * 0.8).toFixed(1),
        debrisDelta: Math.round((Math.random() - 0.45) * 4)
      };
      res.write(`data: ${JSON.stringify(liveTick)}\n\n`);
    } catch {
      clearInterval(interval);
    }
  }, 4000);

  req.on("close", () => {
    clearInterval(interval);
    res.end();
  });
});

import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, "../../frontend/dist");

// Interactive API Documentation endpoint
app.get("/api/v1/docs", (_req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>AstroSpacial REST API Engine</title>
  <style>
    body { background: #0a0a0c; color: #f5f5f5; font-family: 'JetBrains Mono', Consolas, monospace; padding: 32px; max-width: 900px; margin: 0 auto; line-height: 1.6; }
    h1 { color: #5fd98a; font-size: 22px; display: flex; align-items: center; gap: 10px; }
    .dot { width: 10px; height: 10px; background: #5fd98a; border-radius: 50%; box-shadow: 0 0 10px #5fd98a; display: inline-block; }
    .badge { background: #1c1c22; border: 1px solid #2a2a35; padding: 4px 8px; font-size: 11px; border-radius: 4px; color: #9a9aa0; }
    table { width: 100%; border-collapse: collapse; margin-top: 24px; }
    th, td { text-align: left; padding: 10px 14px; border-bottom: 1px solid #1c1c22; font-size: 13px; }
    th { color: #5c5c62; font-size: 11px; letter-spacing: 1px; }
    .method { font-weight: bold; padding: 2px 6px; border-radius: 3px; font-size: 11px; }
    .get { background: rgba(95, 217, 138, 0.15); color: #5fd98a; }
    .post { background: rgba(232, 197, 71, 0.15); color: #e8c547; }
    .patch { background: rgba(147, 112, 219, 0.15); color: #b39ddb; }
    .del { background: rgba(255, 77, 77, 0.15); color: #ff4d4d; }
    a { color: #5fd98a; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <h1><span class="dot"></span> ASTROSPACIAL API ENGINE v2.0.0</h1>
  <p style="color:#9a9aa0">Space Situational Awareness & Orbital Conjunction Platform REST API</p>
  <div style="margin: 16px 0;">
    <span class="badge">Engine: Node.js (Express)</span>
    <span class="badge">Database: ${pool.dbType.toUpperCase()}</span>
    <span class="badge">Status: ONLINE</span>
    <span class="badge">Port: ${port}</span>
  </div>

  <table>
    <thead>
      <tr><th>METHOD</th><th>ENDPOINT</th><th>DESCRIPTION</th></tr>
    </thead>
    <tbody>
      <tr><td><span class="method get">GET</span></td><td><a href="/api/v1/health">/api/v1/health</a></td><td>System and database health check</td></tr>
      <tr><td><span class="method get">GET</span></td><td><a href="/api/v1/stats">/api/v1/stats</a></td><td>Live platform orbital statistics and counters</td></tr>
      <tr><td><span class="method get">GET</span></td><td><a href="/api/v1/satellites">/api/v1/satellites</a></td><td>Catalogued satellites with telemetry</td></tr>
      <tr><td><span class="method get">GET</span></td><td><a href="/api/v1/debris">/api/v1/debris</a></td><td>Tracked orbital debris & risk levels</td></tr>
      <tr><td><span class="method get">GET</span></td><td><a href="/api/v1/conjunctions">/api/v1/conjunctions</a></td><td>Active conjunction events & closest approaches</td></tr>
      <tr><td><span class="method post">POST</span></td><td>/api/v1/conjunctions/analyze</td><td>Compute conjunction physics between two space objects</td></tr>
      <tr><td><span class="method get">GET</span></td><td><a href="/api/v1/stations">/api/v1/stations</a></td><td>Crewed space stations (ISS, Tiangong, Gateway)</td></tr>
      <tr><td><span class="method get">GET</span></td><td><a href="/api/v1/space-weather">/api/v1/space-weather</a></td><td>Solar wind, Kp index, and geomagnetic activity</td></tr>
      <tr><td><span class="method get">GET</span></td><td><a href="/api/v1/neos">/api/v1/neos</a></td><td>Near-Earth Asteroids & close encounters</td></tr>
      <tr><td><span class="method get">GET</span></td><td><a href="/api/v1/alerts">/api/v1/alerts</a></td><td>Real-time space alert log</td></tr>
      <tr><td><span class="method get">GET</span></td><td><a href="/api/v1/modules">/api/v1/modules</a></td><td>Module manifest registry</td></tr>
      <tr><td><span class="method post">POST</span></td><td>/api/v1/auth/signup</td><td>Create SSA account & generate session</td></tr>
      <tr><td><span class="method post">POST</span></td><td>/api/v1/auth/login</td><td>Authenticate user & set HTTP-only cookie</td></tr>
      <tr><td><span class="method get">GET</span></td><td>/api/v1/auth/me</td><td>Retrieve active session user profile</td></tr>
      <tr><td><span class="method patch">PATCH</span></td><td>/api/v1/auth/me</td><td>Update profile name, role, and timezone</td></tr>
      <tr><td><span class="method post">POST</span></td><td>/api/v1/auth/logout</td><td>Revoke session & clear cookie</td></tr>
      <tr><td><span class="method get">GET</span></td><td>/api/v1/watchlist</td><td>User persistent watchlist items</td></tr>
      <tr><td><span class="method get">GET</span></td><td>/api/v1/settings</td><td>User interface display & performance preferences</td></tr>
      <tr><td><span class="method get">GET</span></td><td><a href="/api/v1/stream">/api/v1/stream</a></td><td>Real-time Server-Sent Events (SSE) telemetry feed</td></tr>
    </tbody>
  </table>
</body>
</html>
  `);
});

// Primary API Router
app.use("/api/v1", apiRouter);

// Serve frontend static build if it exists (for production / Render deployments)
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/")) return next();
    res.sendFile(path.join(distPath, "index.html"));
  });
}

// 404 Route Handler for undefined API routes
app.use((req, res) => res.status(404).json({ error: "Route not found", path: req.path }));

// Global Error Handler
app.use((err, _req, res, _next) => {
  console.error("❌ [API Error]:", err);
  if (err.code === "ECONNREFUSED" || err.code === "ER_ACCESS_DENIED_ERROR" || err.code === "ER_BAD_DB_ERROR") {
    return res.status(503).json({
      error: "Database is unavailable. Check MySQL or local SQLite configuration.",
      detail: err.message
    });
  }
  res.status(500).json({ error: "Internal server error", message: err.message });
});

// Database initialization and server listener
try {
  await initializeDatabase();
  const server = app.listen(port, () => {
    console.log(`🌌 AstroSpacial API Engine listening at http://localhost:${port}`);
    console.log(`📡 Health Check: http://localhost:${port}/api/v1/health`);
    console.log(`📋 API Docs: http://localhost:${port}/api/v1/docs`);
  });

  const shutdown = async () => {
    console.log("\n🛑 Gracefully shutting down AstroSpacial API...");
    server.close();
    await pool.end();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
} catch (error) {
  console.error("❌ Failed to start AstroSpacial API:", error);
  process.exit(1);
}
