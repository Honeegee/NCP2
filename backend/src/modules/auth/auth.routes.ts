import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import {
  loginRateLimit,
  forgotPasswordRateLimit,
  resetPasswordRateLimit,
  changePasswordRateLimit,
} from "../../middleware/rate-limit";
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from "../../shared/validators";
import * as controller from "./auth.controller";

const router = Router();

router.post("/login", loginRateLimit, validate(loginSchema), controller.loginHandler);
router.post("/register", validate(registerSchema), controller.registerHandler);
router.post("/refresh", controller.refreshHandler);
router.post("/forgot-password", forgotPasswordRateLimit, validate(forgotPasswordSchema), controller.forgotPasswordHandler);
router.post("/reset-password", resetPasswordRateLimit, validate(resetPasswordSchema), controller.resetPasswordHandler);
router.post("/change-password", authenticate, changePasswordRateLimit, validate(changePasswordSchema), controller.changePasswordHandler);

export { router as authRoutes };
