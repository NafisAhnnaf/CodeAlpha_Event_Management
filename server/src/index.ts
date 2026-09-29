import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import db from "./config/db.ts";
import authRouter from "./routes/auth.routes.ts";
import userRouter from "./routes/user.routes.ts";
import eventRouter from "./routes/event.routes.ts";
import { requestLogger } from "./middlewares/logger.middleware.ts";
import { rateLimiter } from "./middlewares/rate-limit.middleware.ts";
import { errorHandler } from "./middlewares/error.middleware.ts";

const PORT = process.env.PORT || 8000;
const app = express();

app.use(cors());
app.use(express.json());
app.use(requestLogger);
app.use(rateLimiter({ windowMs: 15 * 60 * 1000, max: 300 }));

// Database connection verification
db.execute("SELECT 1")
  .then((response) => {
    console.log("Connected to database successfully. RowCount:", response.rowCount);
  })
  .catch((error: Error) => {
    console.error("Error connecting to database:", error);
  });

// Public health check endpoint
app.get("/health", async (req, res) => {
  try {
    await db.execute("SELECT 1");
    return res.status(200).json({
      status: "ok",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(503).json({
      status: "error",
      message: "Database connection failed",
    });
  }
});

// Mounted API routes
app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/events", eventRouter);

// Serve static client build (prefers server/public, falls back to client/dist)
const serverPublicPath = path.resolve(import.meta.dirname, "../public");
const clientDistPath = path.resolve(import.meta.dirname, "../../client/dist");
const staticPublicPath = fs.existsSync(serverPublicPath)
  ? serverPublicPath
  : fs.existsSync(clientDistPath)
  ? clientDistPath
  : null;

if (staticPublicPath) {
  app.use(express.static(staticPublicPath));

  // Express 5 compatible SPA fallback middleware
  app.use((req, res, next) => {
    if (
      req.method === "GET" &&
      !req.path.startsWith("/api") &&
      !req.path.startsWith("/health")
    ) {
      return res.sendFile(path.join(staticPublicPath, "index.html"));
    }
    return next();
  });
}

// 404 handler for unmatched API routes
app.use((req, res) => {
  return res.status(404).json({
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global error handling middleware
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running and listening on port ${PORT}`);
});

export default app;
