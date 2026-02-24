import { Router } from "express";
import multer from "multer";
import { authenticate } from "../../middleware/auth";
import { generalRateLimit } from "../../middleware/rate-limit";
import { BadRequestError } from "../../shared/errors";
import * as controller from "./resumes.controller";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new BadRequestError("Invalid file type. Only PDF and DOC/DOCX resumes are allowed."));
    }
  },
});

router.use(authenticate, generalRateLimit);

router.post("/upload", upload.single("file"), controller.uploadResume);
router.get("/:id", controller.getResumeUrl);
router.delete("/:id", controller.deleteResume);

export { router as resumesRoutes };
