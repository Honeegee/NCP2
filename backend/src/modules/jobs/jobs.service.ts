import { parse } from "csv-parse/sync";
import { createServerSupabase } from "../../shared/database";
import { getNurseFullProfile } from "../../shared/helpers";
import { matchJobs } from "../../shared/job-matcher";
import { matchJobsWithAI } from "../../shared/ai-job-matcher";
import { isAIMatchingAvailable } from "../../shared/openai-client";
import { getNovu } from "../../shared/novu";
import { logger } from "../../shared/logger";
import { NotFoundError, BadRequestError, DatabaseError } from "../../shared/errors";
import { JobsRepository } from "./jobs.repository";
import type { NurseFullProfile, Job, JobCreateInput, JobUpdateInput } from "../../shared/types";
import { TriggerRecipientsTypeEnum } from "@novu/node";

function getRepo() {
  return new JobsRepository(createServerSupabase());
}

export async function listJobs(
  filters: { location?: string; employment_type?: string; country?: string; is_active?: boolean },
  offset: number,
  limit: number
) {
  const repo = getRepo();
  const { data, error, count } = await repo.findAll(filters, offset, limit);
  if (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown database error';
    throw new DatabaseError(errMsg, error);
  }
  return { data: data || [], total: count || 0 };
}

export async function getJob(id: string) {
  const repo = getRepo();
  const { data, error } = await repo.findById(id);
  if (error || !data) throw new NotFoundError("Job not found");
  return data;
}

export async function createJob(jobData: JobCreateInput) {
  const repo = getRepo();
  const { data, error } = await repo.create(jobData);
  if (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown database error';
    throw new DatabaseError(errMsg, error);
  }

  const novu = getNovu();
  if (novu && data) {
    try {
      await novu.trigger("new-job-posted", {
        to: [{ type: TriggerRecipientsTypeEnum.TOPIC, topicKey: "nurses" }],
        payload: {
          jobTitle: data.title,
          facility: data.facility_name,
          location: data.location,
          jobId: data.id,
        },
      });
    } catch (err) {
      logger.error({ error: err instanceof Error ? err.message : err, jobId: data.id }, "Novu new-job-posted trigger failed");
    }
  }

  return data;
}

export async function updateJob(id: string, updates: JobUpdateInput) {
  const repo = getRepo();
  const { data: existing, error: fetchErr } = await repo.findById(id);
  if (fetchErr || !existing) throw new NotFoundError("Job not found");

  const { data, error } = await repo.update(id, updates);
  if (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown database error';
    throw new DatabaseError(errMsg, error);
  }
  return data;
}

export async function deleteJob(id: string) {
  const repo = getRepo();
  const { data: existing, error: fetchErr } = await repo.findById(id);
  if (fetchErr || !existing) throw new NotFoundError("Job not found");

  const { data, error } = await repo.softDelete(id);
  if (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown database error';
    throw new DatabaseError(errMsg, error);
  }
  return data;
}

export async function permanentlyDeleteJob(id: string) {
  const repo = getRepo();
  const { data: existing, error: fetchErr } = await repo.findById(id);
  if (fetchErr || !existing) throw new NotFoundError("Job not found");

  const { error } = await repo.hardDelete(id);
  if (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown database error';
    throw new DatabaseError(errMsg, error);
  }
  return { message: "Job permanently deleted" };
}

const VALID_EMPLOYMENT_TYPES = ["full-time", "part-time", "contract"];

export async function bulkCreateJobs(csvBuffer: Buffer) {
  let records: Record<string, string>[];
  try {
    records = parse(csvBuffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
  } catch {
    throw new BadRequestError("Invalid CSV format. Please check your file and try again.");
  }

  if (records.length === 0) {
    throw new BadRequestError("CSV file is empty.");
  }

  if (records.length > 200) {
    throw new BadRequestError("Maximum 200 jobs per upload. Please split your file.");
  }

  const errors: { row: number; message: string }[] = [];
  const validJobs: JobCreateInput[] = [];

  for (let i = 0; i < records.length; i++) {
    const row = records[i];
    const rowNum = i + 2;

    if (!row.title?.trim()) {
      errors.push({ row: rowNum, message: "Missing required field: title" });
      continue;
    }
    if (!row.description?.trim()) {
      errors.push({ row: rowNum, message: "Missing required field: description" });
      continue;
    }
    if (!row.location?.trim()) {
      errors.push({ row: rowNum, message: "Missing required field: location" });
      continue;
    }
    if (!row.facility_name?.trim()) {
      errors.push({ row: rowNum, message: "Missing required field: facility_name" });
      continue;
    }

    const employmentType = (row.employment_type || "full-time").trim().toLowerCase() as JobCreateInput["employment_type"];
    if (!VALID_EMPLOYMENT_TYPES.includes(employmentType)) {
      errors.push({ row: rowNum, message: `Invalid employment_type: "${row.employment_type}". Must be one of: ${VALID_EMPLOYMENT_TYPES.join(", ")}` });
      continue;
    }

    const minExp = parseInt(row.min_experience_years || "0", 10);
    if (isNaN(minExp) || minExp < 0) {
      errors.push({ row: rowNum, message: "min_experience_years must be a non-negative number" });
      continue;
    }

    const salaryMin = row.salary_min ? parseFloat(row.salary_min) : null;
    const salaryMax = row.salary_max ? parseFloat(row.salary_max) : null;
    if (row.salary_min && (salaryMin === null || isNaN(salaryMin))) {
      errors.push({ row: rowNum, message: "salary_min must be a valid number" });
      continue;
    }
    if (row.salary_max && (salaryMax === null || isNaN(salaryMax))) {
      errors.push({ row: rowNum, message: "salary_max must be a valid number" });
      continue;
    }

    validJobs.push({
      title: row.title.trim(),
      description: row.description.trim(),
      location: row.location.trim(),
      facility_name: row.facility_name.trim(),
      employment_type: employmentType,
      min_experience_years: minExp,
      required_certifications: row.required_certifications
        ? row.required_certifications.split(";").map((s: string) => s.trim()).filter(Boolean)
        : [],
      required_skills: row.required_skills
        ? row.required_skills.split(";").map((s: string) => s.trim()).filter(Boolean)
        : [],
      salary_min: salaryMin,
      salary_max: salaryMax,
      salary_currency: (row.salary_currency || "USD").trim(),
      country: (row.country || "Philippines").trim(),
    });
  }

  let created = 0;
  if (validJobs.length > 0) {
    const repo = getRepo();
    const { data, error } = await repo.createMany(validJobs);
    if (error) {
      const errMsg = error instanceof Error ? error.message : 'Unknown database error';
      throw new DatabaseError(`Database insert failed: ${errMsg}`, error);
    }
    created = data?.length || validJobs.length;
  }

  return { created, errors, total: records.length };
}

async function calculateJobMatches(profile: NurseFullProfile) {
  const repo = getRepo();
  const { data: jobs, error: jobsError } = await repo.findAllActive();
  if (jobsError) throw new DatabaseError("Failed to fetch jobs", jobsError);

  if (!jobs || jobs.length === 0) return [];

  let matches;
  if (isAIMatchingAvailable()) {
    try {
      matches = await matchJobsWithAI(profile, jobs as Job[]);
    } catch (err) {
      logger.warn({ error: err instanceof Error ? err.message : err }, "AI matching failed, falling back to rule-based");
      matches = matchJobs(profile, jobs as Job[]);
    }
  } else {
    matches = matchJobs(profile, jobs as Job[]);
  }

  return matches;
}

export async function getJobMatchesForNurse(nurseProfileId: string) {
  const supabase = createServerSupabase();

  const { getNurseFullProfileById } = await import("../../shared/helpers");
  const { data: profile, error: profileError } = await getNurseFullProfileById(supabase, nurseProfileId);
  if (profileError || !profile) {
    throw new NotFoundError("Nurse profile not found.");
  }

  return calculateJobMatches(profile as NurseFullProfile);
}

export async function getJobMatches(userId: string) {
  const supabase = createServerSupabase();

  const { data: profile, error: profileError } = await getNurseFullProfile(supabase, userId);
  if (profileError || !profile) {
    throw new NotFoundError("Nurse profile not found. Please complete your profile first.");
  }

  const matches = await calculateJobMatches(profile as NurseFullProfile);

  const novu = getNovu();
  if (novu && matches.length > 0 && matches[0].match_score >= 70) {
    try {
      await novu.trigger("job-match-found", {
        to: { subscriberId: userId },
        payload: {
          score: matches[0].match_score,
          jobTitle: matches[0].job.title,
          facility: matches[0].job.facility_name,
          jobId: matches[0].job.id,
        },
      });
    } catch (err) {
      logger.error({ error: err instanceof Error ? err.message : err, userId }, "Novu job-match-found trigger failed");
    }
  }

  return matches;
}

export async function getJobStats() {
  const supabase = createServerSupabase();

  // Run counts in parallel
  const [
    { count: totalJobs, error: totalError },
    { count: activeJobs, error: activeError },
    { data: jobsWithCounts, error: jobsError }
  ] = await Promise.all([
    supabase.from("jobs").select("*", { count: "exact", head: true }),
    supabase.from("jobs").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("jobs")
      .select(`
        id, 
        title, 
        is_active,
        job_applications(count)
      `)
      .order("created_at", { ascending: false })
  ]);

  if (totalError) throw new DatabaseError(totalError.message, totalError);
  if (activeError) throw new DatabaseError(activeError.message, activeError);
  if (jobsError) throw new DatabaseError(jobsError.message, jobsError);

  // Map and sort for top 5
  // Note: job_applications is returned as an array or object depending on PostgREST version
  const processedJobs = (jobsWithCounts || []).map((job: any) => {
    // PostgREST returns count in various formats; handle both
    const appCount = Array.isArray(job.job_applications)
      ? (job.job_applications[0]?.count || 0)
      : (job.job_applications?.count || 0);

    return {
      id: job.id,
      title: job.title,
      is_active: job.is_active,
      application_count: appCount,
    };
  });

  processedJobs.sort((a, b) => b.application_count - a.application_count);
  const top5Jobs = processedJobs.slice(0, 5);

  return {
    totalJobs: totalJobs || 0,
    activeJobs: activeJobs || 0,
    inactiveJobs: (totalJobs || 0) - (activeJobs || 0),
    topJobsByApplications: top5Jobs,
  };
}