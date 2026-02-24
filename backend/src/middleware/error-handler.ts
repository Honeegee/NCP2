import { Request, Response, NextFunction } from "express";
import multer from "multer";
import { AppError } from "../shared/errors";
import { logger } from "../shared/logger";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Handle Multer errors (file size, etc.)
  if (err instanceof multer.MulterError) {
    logger.warn({ error: err.message, code: err.code }, "Multer Error");

    let message = err.message;
    if (err.code === "LIMIT_FILE_SIZE") {
      message = "File is too large. Maximum size allowed is specified in the upload rules.";
    }

    res.status(400).json({
      error: message,
      code: `UPLOAD_${err.code}`,
    });
    return;
  }

  // Check by statusCode property (more reliable than instanceof across module boundaries)
  if ("statusCode" in err && "code" in err) {
    const appErr = err as AppError;
    logger.error({
      error: appErr.message,
      code: appErr.code,
      details: appErr.details,
      stack: appErr.stack
    }, "Application Error");

    res.status(appErr.statusCode).json({
      error: appErr.message,
      code: appErr.code,
      ...(appErr.details ? { details: appErr.details } : {}),
    });
    return;
  }

  // Unexpected errors
  logger.error({ error: err.message, stack: err.stack }, "Unhandled Error");
  res.status(500).json({
    error: "Internal server error",
    code: "INTERNAL_ERROR",
    ...(process.env.NODE_ENV === "development" ? { stack: err.stack } : {}),
  });
}
