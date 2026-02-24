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
  checkEmailSchema,
  registerSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from "../../shared/validators";
import * as controller from "./auth.controller";
import * as ssoController from "./sso.controller";

const router = Router();

/**
 * @openapi
 * /api/v1/auth/login:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Authenticate user and get tokens
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                     refreshToken:
 *                       type: string
 *                     user:
 *                       type: object
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: Account unverified or locked
 */
router.post("/login", loginRateLimit, validate(loginSchema), controller.loginHandler);
router.post("/check-email", validate(checkEmailSchema), controller.checkEmailHandler);
router.post("/register", validate(registerSchema), controller.registerHandler);
router.post("/verify-email", validate(verifyEmailSchema), controller.verifyEmailHandler);
router.post("/resend-verification", validate(resendVerificationSchema), controller.resendVerificationHandler);
router.post("/refresh", controller.refreshHandler);
router.post("/forgot-password", forgotPasswordRateLimit, validate(forgotPasswordSchema), controller.forgotPasswordHandler);
router.post("/reset-password", resetPasswordRateLimit, validate(resetPasswordSchema), controller.resetPasswordHandler);
router.post("/change-password", authenticate, changePasswordRateLimit, validate(changePasswordSchema), controller.changePasswordHandler);

// SSO routes
router.get("/sso/:provider", ssoController.initiateSSO);
router.get("/sso/:provider/callback", ssoController.handleSSOCallback);

export { router as authRoutes };
