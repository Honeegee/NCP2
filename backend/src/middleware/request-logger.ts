import pinoHttp from "pino-http";
import { logger } from "../shared/logger";
import { env } from "../config/env";

export const requestLogger = pinoHttp({
    logger,
    // Custom success/error level
    customSuccessMessage: (req, res) => {
        return `${req.method} ${req.url} ${res.statusCode} COMPLETED`;
    },
    customErrorMessage: (req, res, err) => {
        return `${req.method} ${req.url} ${res.statusCode} FAILED: ${err.message}`;
    },
    // Redact sensitive info
    serializers: {
        req: (req) => ({
            method: req.method,
            url: req.url,
            query: req.query,
            remoteAddress: req.remoteAddress,
        }),
    },
    enabled: env.NODE_ENV !== "test",
});
