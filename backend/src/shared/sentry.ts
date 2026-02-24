import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";
import { env } from "../config/env";
import { logger } from "./logger";

export function initSentry() {
    if (!env.SENTRY_DSN) {
        logger.info("Sentry DSN not provided, skipping error tracking initialization.");
        return;
    }

    Sentry.init({
        dsn: env.SENTRY_DSN,
        integrations: [
            nodeProfilingIntegration(),
        ],
        // Performance Monitoring
        tracesSampleRate: env.isProduction ? 0.1 : 1.0,
        // Set sampling rate for profiling - this is relative to tracesSampleRate
        profilesSampleRate: 1.0,
        environment: env.NODE_ENV,
    });

    logger.info("Sentry initialized successfully.");
}

export { Sentry };
