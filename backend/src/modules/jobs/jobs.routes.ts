import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import { requireRole } from "../../middleware/roles";
import { validate } from "../../middleware/validate";
import { paginate } from "../../middleware/pagination";
import { jobSchema } from "../../shared/validators";
import * as controller from "./jobs.controller";

const router = Router();

router.use(authenticate);

router.get("/", paginate, controller.listJobs);
router.get("/matches", controller.getMatches);
router.get("/:id", controller.getJob);
router.post("/", requireRole("admin"), validate(jobSchema), controller.createJob);
router.put("/:id", requireRole("admin"), controller.updateJob);
router.delete("/:id", requireRole("admin"), controller.deleteJob);

export { router as jobsRoutes };
