import { createServerSupabase } from "../../shared/database";
import { getNurseFullProfile } from "../../shared/helpers";
import { matchJobs } from "../../shared/job-matcher";
import { matchJobsWithAI } from "../../shared/ai-job-matcher";
import { isAIMatchingAvailable } from "../../shared/openai-client";
import { getNovu } from "../../shared/novu";
import { NotFoundError, BadRequestError } from "../../shared/errors";
import { JobsRepository } from "./jobs.repository";
import type { NurseFullProfile, Job } from "../../shared/types";
import { TriggerRecipientsTypeEnum } from "@novu/node";

function getRepo() {
  return new JobsRepository(createServerSupabase());
}

export async function listJobs(
  filters: { location?: string; employment_type?: string },
  offset: number,
  limit: number
) {
  const repo = getRepo();
  const { data, error, count } = await repo.findAll(filters, offset, limit);
  if (error) throw new Error(error.message);
  return { data: data || [], total: count || 0 };
}

export async function getJob(id: string) {
  const repo = getRepo();
  const { data, error } = await repo.findById(id);
  if (error || !data) throw new NotFoundError("Job not found");
  return data;
}

export async function createJob(jobData: Record<string, unknown>) {
  const repo = getRepo();
  const { data, error } = await repo.create(jobData);
  if (error) throw new Error(error.message);

  // Notify all nurses via Novu
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
      console.error("Novu new-job-posted trigger failed:", err);
    }
  }

  return data;
}

export async function updateJob(id: string, updates: Record<string, unknown>) {
  const repo = getRepo();
  // Verify exists
  const { data: existing, error: fetchErr } = await repo.findById(id);
  if (fetchErr || !existing) throw new NotFoundError("Job not found");

  const { data, error } = await repo.update(id, updates);
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteJob(id: string) {
  const repo = getRepo();
  const { data: existing, error: fetchErr } = await repo.findById(id);
  if (fetchErr || !existing) throw new NotFoundError("Job not found");

  const { data, error } = await repo.softDelete(id);
  if (error) throw new Error(error.message);
  return data;
}

export async function getJobMatchesForNurse(nurseProfileId: string) {
  const supabase = createServerSupabase();

  const { getNurseFullProfileById } = await import("../../shared/helpers");
  const { data: profile, error: profileError } = await getNurseFullProfileById(supabase, nurseProfileId);
  if (profileError || !profile) {
    throw new NotFoundError("Nurse profile not found.");
  }

  const repo = new JobsRepository(supabase);
  const { data: jobs, error: jobsError } = await repo.findAllActive();
  if (jobsError) throw new Error("Failed to fetch jobs");

  if (!jobs || jobs.length === 0) return [];

  let matches;
  if (isAIMatchingAvailable()) {
    try {
      matches = await matchJobsWithAI(profile as NurseFullProfile, jobs as Job[]);
    } catch (err) {
      console.warn("[JobMatching] AI matching failed, falling back to rule-based:", err);
      matches = matchJobs(profile as NurseFullProfile, jobs as Job[]);
    }
  } else {
    matches = matchJobs(profile as NurseFullProfile, jobs as Job[]);
  }

  return matches;
}

export async function getJobMatches(userId: string) {
  const supabase = createServerSupabase();

  const { data: profile, error: profileError } = await getNurseFullProfile(supabase, userId);
  if (profileError || !profile) {
    throw new NotFoundError("Nurse profile not found. Please complete your profile first.");
  }

  const repo = new JobsRepository(supabase);
  const { data: jobs, error: jobsError } = await repo.findAllActive();
  if (jobsError) throw new Error("Failed to fetch jobs");

  if (!jobs || jobs.length === 0) return [];

  let matches;
  if (isAIMatchingAvailable()) {
    try {
      matches = await matchJobsWithAI(profile as NurseFullProfile, jobs as Job[]);
      console.log("[JobMatching] Using AI-enhanced matching");
    } catch (err) {
      console.warn("[JobMatching] AI matching failed, falling back to rule-based:", err);
      matches = matchJobs(profile as NurseFullProfile, jobs as Job[]);
    }
  } else {
    matches = matchJobs(profile as NurseFullProfile, jobs as Job[]);
  }

  // Notify for top match if score >= 70
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
      console.error("Novu job-match-found trigger failed:", err);
    }
  }

  return matches;
}
