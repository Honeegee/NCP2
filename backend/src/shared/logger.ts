import pino from "pino";
import { env } from "../config/env";

const isProduction = env.NODE_ENV === "production";

export const logger = pino({
    level: env.LOG_LEVEL || (isProduction ? "info" : "debug"),
    transport: isProduction
        ? undefined
        : {
            target: "pino-pretty",
            options: {
                colorize: true,
                ignore: "pid,hostname",
                translateTime: "SYS:standard",
            },
        },
});

export default logger;
