import { env } from "./config/env";
import { app } from "./app";
import { logger } from "./shared/logger";
import { initSentry } from "./shared/sentry";

// Initialize error tracking
initSentry();

const PORT = env.PORT;

app.listen(PORT, () => {
  logger.info({ port: PORT, env: env.NODE_ENV }, `Server running on http://localhost:${PORT}`);
});
