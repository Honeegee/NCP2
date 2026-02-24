import { Request, Response, NextFunction } from "express";
import { ForbiddenError, UnauthorizedError } from "../shared/errors";

/**
 * Middleware factory: requires user to have a specific role.
 * Must be used after authenticate middleware.
 */
export function requireRole(...roles: Array<"nurse" | "admin" | "superadmin">) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError());
    }
    if (req.user.role === "superadmin" || roles.includes(req.user.role)) {
      return next();
    }
    return next(new ForbiddenError("Insufficient permissions"));
  };
}
