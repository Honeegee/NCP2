import { Request, Response, NextFunction } from "express";
import { paginatedResponse } from "../../middleware/pagination";
import * as jobsService from "./jobs.service";
import type { JobCreateInput, JobUpdateInput } from "../../shared/types";

export async function listJobs(req: Request, res: Response, next: NextFunction) {
  try {
    const { offset, limit, page } = req.pagination!;
    const filters = {
      location: req.query.location as string | undefined,
      employment_type: req.query.employment_type as string | undefined,
      country: req.query.country as string | undefined,
      is_active: req.query.is_active === "true" ? true : req.query.is_active === "false" ? false : undefined,
    };
    const { data, total } = await jobsService.listJobs(filters, offset, limit);
    res.json(paginatedResponse(data, total, { page, limit }));
  } catch (err) { next(err); }
}

export async function getJob(req: Request, res: Response, next: NextFunction) {
  try {
    const job = await jobsService.getJob(req.params.id as string);
    res.json({ data: job });
  } catch (err) { next(err); }
}

export async function createJob(req: Request, res: Response, next: NextFunction) {
  try {
    const jobData = req.body as JobCreateInput;
    const job = await jobsService.createJob(jobData);
    res.status(201).json({ data: job });
  } catch (err) {
    next(err);
  }
}

export async function updateJob(req: Request, res: Response, next: NextFunction) {
  try {
    const updates = req.body as JobUpdateInput;
    const job = await jobsService.updateJob(req.params.id as string, updates);
    res.json({ data: job });
  } catch (err) { next(err); }
}

export async function deleteJob(req: Request, res: Response, next: NextFunction) {
  try {
    const job = await jobsService.deleteJob(req.params.id as string);
    res.json({ data: { message: "Job deactivated successfully", job } });
  } catch (err) { next(err); }
}

export async function permanentlyDeleteJob(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await jobsService.permanentlyDeleteJob(req.params.id as string);
    res.json({ data: result });
  } catch (err) { next(err); }
}

export async function bulkUploadJobs(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No CSV file provided" });
      return;
    }
    const result = await jobsService.bulkCreateJobs(req.file.buffer);
    res.status(201).json({ data: result });
  } catch (err) { next(err); }
}

export async function getMatches(req: Request, res: Response, next: NextFunction) {
  try {
    const matches = await jobsService.getJobMatches(req.user!.id);
    res.json({ data: matches });
  } catch (err) { next(err); }
}

export async function getJobStats(req: Request, res: Response, next: NextFunction) {
  try {
    const stats = await jobsService.getJobStats();
    res.json({ data: stats });
  } catch (err) { next(err); }
}