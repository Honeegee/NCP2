import { SupabaseClient } from "@supabase/supabase-js";
import { logger } from "../../shared/logger";
import type { Job, JobCreateInput, JobUpdateInput } from "../../shared/types";

interface JobFindAllResult {
  data: Job[] | null;
  error: unknown;
  count: number | null;
}

interface JobResult {
  data: Job | null;
  error: unknown;
}

interface JobsResult {
  data: Job[] | null;
  error: unknown;
}

export class JobsRepository {
  constructor(private supabase: SupabaseClient) { }

  async findAll(
    filters: { location?: string; employment_type?: string; country?: string; is_active?: boolean },
    offset: number,
    limit: number
  ): Promise<JobFindAllResult> {
    let query = this.supabase
      .from("jobs")
      .select("*", { count: "exact" });

    // Only filter by is_active if explicitly provided
    // undefined = return all jobs (active + inactive)
    // true = active only
    // false = inactive only
    if (filters.is_active !== undefined) {
      query = query.eq("is_active", filters.is_active);
    }

    if (filters.location) {
      query = query.ilike("location", `%${filters.location}%`);
    }
    if (filters.employment_type) {
      query = query.eq("employment_type", filters.employment_type);
    }
    if (filters.country) {
      query = query.eq("country", filters.country);
    }

    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    return { data: data as Job[] | null, error, count };
  }

  async findById(id: string): Promise<JobResult> {
    const result = await this.supabase
      .from("jobs")
      .select("*")
      .eq("id", id)
      .single();
    return { data: result.data as Job | null, error: result.error };
  }

  async create(jobData: JobCreateInput): Promise<JobResult> {
    logger.debug({ jobData }, "Supabase insert job");
    const result = await this.supabase
      .from("jobs")
      .insert({ ...jobData, is_active: true })
      .select("*")
      .single();
    if (result.error) {
      logger.error({ error: result.error, jobData }, "Supabase insert failed");
    }
    return { data: result.data as Job | null, error: result.error };
  }

  async update(id: string, updates: JobUpdateInput): Promise<JobResult> {
    const result = await this.supabase
      .from("jobs")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();
    return { data: result.data as Job | null, error: result.error };
  }

  async softDelete(id: string): Promise<JobResult> {
    const result = await this.supabase
      .from("jobs")
      .update({ is_active: false })
      .eq("id", id)
      .select("*")
      .single();
    return { data: result.data as Job | null, error: result.error };
  }

  async hardDelete(id: string): Promise<{ error: unknown }> {
    const { error } = await this.supabase
      .from("jobs")
      .delete()
      .eq("id", id);
    return { error };
  }

  async createMany(jobs: JobCreateInput[]): Promise<JobsResult> {
    const result = await this.supabase
      .from("jobs")
      .insert(jobs.map((j) => ({ ...j, is_active: true })))
      .select("*");
    return { data: result.data as Job[] | null, error: result.error };
  }

  async findAllActive(): Promise<JobsResult> {
    const result = await this.supabase
      .from("jobs")
      .select("*")
      .eq("is_active", true);
    return { data: result.data as Job[] | null, error: result.error };
  }
}