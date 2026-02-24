import * as dotenv from "dotenv";
import path from "path";
import { z } from "zod";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// Environment variable schema
const envSchema = z.object({
  // Server
  PORT: z.string().transform(Number).default("4000"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),

  // Supabase (required)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("Invalid Supabase URL"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "Supabase service role key is required"),

  // JWT (required)
  NEXTAUTH_SECRET: z.string().min(32, "JWT secret must be at least 32 characters"),
  JWT_ACCESS_EXPIRY: z.string().default("24h"),
  JWT_REFRESH_EXPIRY: z.string().default("7d"),

  // Email (optional)
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().email("Invalid from email").default("onboarding@resend.dev"),

  // AI (optional)
  GOOGLE_AI_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),

  // Novu (optional)
  NOVU_API_KEY: z.string().optional(),

  // CORS - Comma-separated list of allowed origins
  CORS_ORIGIN: z.string().default("http://localhost:3000,http://localhost:3001,https://ncp-fe.vercel.app"),
  // Parse to array for easier use
  CORS_ORIGINS: z.string()
    .default(process.env.CORS_ORIGIN || process.env.CORS_ORIGINS || "http://localhost:3000,http://localhost:3001,https://ncp-fe.vercel.app")
    .transform(val => val.split(',').map(url => url.trim()).filter(url => url.length > 0)),

  // OAuth / SSO (optional)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  LINKEDIN_CLIENT_ID: z.string().optional(),
  LINKEDIN_CLIENT_SECRET: z.string().optional(),
  FACEBOOK_CLIENT_ID: z.string().optional(),
  FACEBOOK_CLIENT_SECRET: z.string().optional(),
  FRONTEND_URL: z.string().url("Invalid frontend URL").default("http://localhost:3000"),
  BACKEND_URL: z.string().url("Invalid backend URL").optional(),

  // Sentry (optional)
  SENTRY_DSN: z.string().url("Invalid Sentry DSN").optional(),
});

// Parse and validate environment variables
let parsedEnv: z.infer<typeof envSchema>;

try {
  parsedEnv = envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    const errorMessages = error.issues.map(issue =>
      `[${issue.path.join(".")}]: ${issue.message}`
    ).join("\n");
    console.error("❌ Invalid environment variables:\n", errorMessages);
    process.exit(1);
  }
  console.error("❌ Failed to validate environment variables:", error);
  process.exit(1);
}

export const env = {
  ...parsedEnv,
  // Aliases for consistency with existing code
  SUPABASE_URL: parsedEnv.NEXT_PUBLIC_SUPABASE_URL,
  JWT_SECRET: parsedEnv.NEXTAUTH_SECRET,
  // Derived properties
  isProduction: parsedEnv.NODE_ENV === "production",
  isDevelopment: parsedEnv.NODE_ENV === "development",
  isTest: parsedEnv.NODE_ENV === "test",
} as const;
