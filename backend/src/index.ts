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

// Health check endpoint
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
  });
});

app.get("/api/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "healthy",
    service: "Mental Wellness & Emotion Diary API",
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

// Start server after connecting to database
const startServer = async (): Promise<void> => {
  try {
    await connectDB();
    app.listen(Number(PORT), "0.0.0.0", () => {
      console.log(`=========================================`);
      console.log(` Mental Wellness API Server is running!`);
      console.log(` Port: ${PORT}`);
      console.log(` Mode: ${process.env.NODE_ENV || "development"}`);
      console.log(` Health: http://localhost:${PORT}/health`);
      console.log(`=========================================`);
    });
  } catch (error) {
    console.error("Failed to initialize server:", error);
    process.exit(1);
  }
};

// Execute if run directly
if (process.env.NODE_ENV !== "test") {
  startServer();
}

export default app;
