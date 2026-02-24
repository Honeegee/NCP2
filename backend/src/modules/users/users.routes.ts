import { Router } from "express";
import multer from "multer";
import { authenticate } from "../../middleware/auth";
import { requireRole } from "../../middleware/roles";
import { BadRequestError } from "../../shared/errors";
import * as controller from "./users.controller";

const router = Router();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (_req, file, cb) => {
        const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp"];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new BadRequestError("Invalid file type. Only JPG, PNG, GIF, and WEBP images are allowed."));
        }
    },
});

router.use(authenticate);

// Profile routes - accessible by any admin/superadmin
router.get("/me/profile", controller.getProfileHandler);
router.patch("/me/profile", controller.updateProfileHandler);
router.post("/me/profile-picture", upload.single("file"), controller.uploadProfilePictureHandler);
router.delete("/me/profile-picture", controller.deleteProfilePictureHandler);

// Staff management routes - superadmin only
router.use(requireRole("superadmin"));

router.get("/staff", controller.getStaffListHandler);
router.post("/staff", controller.createStaffHandler);
router.patch("/staff/:id/role", controller.updateStaffRoleHandler);
router.delete("/staff/:id", controller.deleteStaffHandler);

export { router as usersRoutes };
