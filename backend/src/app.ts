import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { passport } from "./config/passport";
import { env } from "./config/env";
import { errorHandler } from "./middleware/error-handler";
import { requestLogger } from "./middleware/request-logger";
import { setupSwagger } from "./config/swagger";

// Module routes
import { authRoutes } from "./modules/auth/auth.routes";
import { nursesRoutes } from "./modules/nurses/nurses.routes";
import { jobsRoutes } from "./modules/jobs/jobs.routes";
import { resumesRoutes } from "./modules/resumes/resumes.routes";
import { applicationsRoutes } from "./modules/applications/applications.routes";
import { usersRoutes } from "./modules/users/users.routes";

const app = express();

// --- Global Middleware ---
app.use(requestLogger);
setupSwagger(app);
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like from mobile apps or curl)
    if (!origin) return callback(null, true);

    // Precise check for allowed origins and Vercel branch/preview deployments
    const isAllowedOrigin = env.CORS_ORIGINS.includes(origin);
    const isVercelDeployment = origin === "https://ncp-fe.vercel.app" || origin.endsWith(".ncp-fe.vercel.app");

    if (isAllowedOrigin || isVercelDeployment) {
      return callback(null, true);
    }

    return callback(new Error(`Not allowed by CORS: ${origin}`), false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "X-Sentry-Auth"],
  exposedHeaders: ["Content-Range", "X-Content-Range"],
  maxAge: 86400, // Cache preflight response for 24 hours
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(env.NEXTAUTH_SECRET));
app.use(passport.initialize());

// --- Health Check ---
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// --- API v1 Routes ---
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/nurses", nursesRoutes);
app.use("/api/v1/jobs", jobsRoutes);
app.use("/api/v1/resumes", resumesRoutes);
app.use("/api/v1/applications", applicationsRoutes);
app.use("/api/v1/users", usersRoutes);

// --- 404 Handler ---
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// --- Global Error Handler (must be last) ---
// Sentry error handler must be before any custom error handlers
import { Sentry } from "./shared/sentry";
if (env.SENTRY_DSN) {
  Sentry.setupExpressErrorHandler(app);
}
app.use(errorHandler);

export { app };
