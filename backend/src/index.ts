import express, { Application, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import { connectDB } from "./config/db";
import authRoutes from "./routes/authRoutes";
import entryRoutes from "./routes/entryRoutes";
import analyticsRoutes from "./routes/analyticsRoutes";
import adminRoutes from "./routes/adminRoutes";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Security and utility middlewares
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "*",
    credentials: true,
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// Request logging in development/production
if (process.env.NODE_ENV !== "test") {
  app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
}

import mongoose from "mongoose";

// Health check endpoint
app.get("/health", (_req: Request, res: Response) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus =
    dbState === 1
      ? "connected"
      : dbState === 2
      ? "connecting"
      : "disconnected";

  res.status(200).json({
    status: "healthy",
    database: dbStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
  });
});

app.get("/api/health", (_req: Request, res: Response) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus =
    dbState === 1
      ? "connected"
      : dbState === 2
      ? "connecting"
      : "disconnected";

  res.status(200).json({
    status: "healthy",
    service: "Mental Wellness & Emotion Diary API",
    database: dbStatus,
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

// Mount modular API routes
app.use("/api/auth", authRoutes);
app.use("/api/entries", entryRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/admin", adminRoutes);

// Catch-all 404 handler for undefined routes
app.use(notFoundHandler);

// Global Centralized Error Handler
app.use(errorHandler);

// Start server immediately to bind port on Render/cloud, then connect to MongoDB
const startServer = (): void => {
  const portNumber = Number(PORT) || 5000;
  app.listen(portNumber, "0.0.0.0", () => {
    console.log(`=========================================`);
    console.log(` AuraSpace API Server is running!`);
    console.log(` Port: ${portNumber}`);
    console.log(` Host: 0.0.0.0`);
    console.log(` Mode: ${process.env.NODE_ENV || "development"}`);
    console.log(` Health: http://0.0.0.0:${portNumber}/health`);
    console.log(`=========================================`);
  });

  // Connect to database asynchronously with automatic retry
  connectDB().catch((err) => {
    console.error("[Database] Initial connection error:", err?.message || err);
  });
};

// Execute if run directly
if (process.env.NODE_ENV !== "test") {
  startServer();
}

export default app;
