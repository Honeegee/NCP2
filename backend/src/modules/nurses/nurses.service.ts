import { createServerSupabase } from "../../shared/database";
import { recalculateYearsOfExperience } from "../../shared/helpers";
import { NotFoundError, ForbiddenError, DatabaseError } from "../../shared/errors";
import { NursesRepository } from "./nurses.repository";

function getRepo() {
  return new NursesRepository(createServerSupabase());
}

// --- Profile ---

export async function listNurses(offset: number, limit: number) {
  const repo = getRepo();
  const { data, error, count } = await repo.findAllProfiles(offset, limit);
  if (error) throw new DatabaseError(error.message, error);
  return { data: data || [], total: count || 0 };
}

export async function getMyProfile(userId: string) {
  const repo = getRepo();
  const { data, error } = await repo.findProfileByUserId(userId);
  if (error || !data) throw new NotFoundError("Profile not found");
  return data;
}

export async function getProfileById(profileId: string, requesterId: string, requesterRole: string) {
  const repo = getRepo();
  const { data, error } = await repo.findProfileById(profileId);
  if (error || !data) throw new NotFoundError("Nurse profile not found");

  if (requesterRole !== "admin" && requesterRole !== "superadmin" && data.user_id !== requesterId) {
    throw new ForbiddenError();
  }
  return data;
}

export async function updateProfile(profileId: string, requesterId: string, requesterRole: string, updates: Record<string, unknown>) {
  const repo = getRepo();
  const { data: existing, error: fetchErr } = await repo.findProfileOwner(profileId);
  if (fetchErr || !existing) throw new NotFoundError("Nurse profile not found");

  if (requesterRole !== "admin" && requesterRole !== "superadmin" && existing.user_id !== requesterId) {
    throw new ForbiddenError();
  }

  const { data, error } = await repo.updateProfile(profileId, updates);
  if (error) throw new DatabaseError(error.message, error);
  return data;
}

// --- Experience ---

async function requireNurseId(userId: string): Promise<string> {
  const repo = getRepo();
  const nurseId = await repo.getNurseId(userId);
  if (!nurseId) throw new NotFoundError("Profile not found");
  return nurseId;
}

export async function addExperience(userId: string, body: Record<string, unknown>) {
  const nurseId = await requireNurseId(userId);
  const supabase = createServerSupabase();
  const repo = getRepo();

  const { data, error } = await repo.createExperience(nurseId, {
    employer: body.employer || "Unknown",
    position: body.position || "Nurse",
    type: body.type || "employment",
    department: body.department || null,
    location: body.location || null,
    description: body.description || null,
    start_date: body.start_date,
    end_date: body.end_date || null,
  });
  if (error) throw new DatabaseError(error.message, error);

  await recalculateYearsOfExperience(supabase, nurseId);
  return data;
}

export async function updateExperience(userId: string, expId: string, body: Record<string, unknown>) {
  const nurseId = await requireNurseId(userId);
  const supabase = createServerSupabase();
  const repo = getRepo();

  const { data, error } = await repo.updateExperience(expId, nurseId, {
    employer: body.employer,
    position: body.position,
    type: body.type || "employment",
    department: body.department || null,
    location: body.location || null,
    description: body.description || null,
    start_date: body.start_date,
    end_date: body.end_date || null,
  });
  if (error) throw new DatabaseError(error.message, error);

  await recalculateYearsOfExperience(supabase, nurseId);
  return data;
}

export async function deleteExperience(userId: string, expId: string) {
  const nurseId = await requireNurseId(userId);
  const supabase = createServerSupabase();
  const repo = getRepo();

  const { error } = await repo.deleteExperience(expId, nurseId);
  if (error) throw new DatabaseError(error.message, error);

  await recalculateYearsOfExperience(supabase, nurseId);
}

export async function clearExperience(userId: string) {
  const nurseId = await requireNurseId(userId);
  const supabase = createServerSupabase();
  const repo = getRepo();

  const { error } = await repo.clearAllExperience(nurseId);
  if (error) throw new DatabaseError(error.message, error);

  await recalculateYearsOfExperience(supabase, nurseId);
}

// --- Education ---

export async function addEducation(userId: string, body: Record<string, unknown>) {
  const nurseId = await requireNurseId(userId);
  const repo = getRepo();
  const { data, error } = await repo.createEducation(nurseId, body);
  if (error) throw new DatabaseError(error.message, error);
  return data;
}

export async function updateEducation(userId: string, eduId: string, body: Record<string, unknown>) {
  const nurseId = await requireNurseId(userId);
  const repo = getRepo();
  const { data, error } = await repo.updateEducation(eduId, nurseId, body);
  if (error) throw new DatabaseError(error.message, error);
  return data;
}

export async function deleteEducation(userId: string, eduId: string) {
  const nurseId = await requireNurseId(userId);
  const repo = getRepo();
  const { error } = await repo.deleteEducation(eduId, nurseId);
  if (error) throw new DatabaseError(error.message, error);
}

export async function clearEducation(userId: string) {
  const nurseId = await requireNurseId(userId);
  const repo = getRepo();
  const { error } = await repo.clearAllEducation(nurseId);
  if (error) throw new DatabaseError(error.message, error);
}

// --- Skills ---

export async function addSkill(userId: string, body: Record<string, unknown>) {
  const nurseId = await requireNurseId(userId);
  const repo = getRepo();
  const { data, error } = await repo.createSkill(nurseId, body);
  if (error) throw new DatabaseError(error.message, error);
  return data;
}

export async function updateSkill(userId: string, skillId: string, body: Record<string, unknown>) {
  const nurseId = await requireNurseId(userId);
  const repo = getRepo();
  const { data, error } = await repo.updateSkill(skillId, nurseId, body);
  if (error) throw new DatabaseError(error.message, error);
  return data;
}

export async function deleteSkill(userId: string, skillId: string) {
  const nurseId = await requireNurseId(userId);
  const repo = getRepo();
  const { error } = await repo.deleteSkill(skillId, nurseId);
  if (error) throw new DatabaseError(error.message, error);
}

export async function clearSkills(userId: string) {
  const nurseId = await requireNurseId(userId);
  const repo = getRepo();
  const { error } = await repo.clearAllSkills(nurseId);
  if (error) throw new DatabaseError(error.message, error);
}

// --- Certifications ---

export async function addCertification(userId: string, body: Record<string, unknown>) {
  const nurseId = await requireNurseId(userId);
  const repo = getRepo();
  const { data, error } = await repo.createCertification(nurseId, body);
  if (error) throw new DatabaseError(error.message, error);
  return data;
}

export async function updateCertification(userId: string, certId: string, body: Record<string, unknown>) {
  const nurseId = await requireNurseId(userId);
  const repo = getRepo();
  const { data, error } = await repo.updateCertification(certId, nurseId, body);
  if (error) throw new DatabaseError(error.message, error);
  return data;
}

export async function deleteCertification(userId: string, certId: string) {
  const nurseId = await requireNurseId(userId);
  const repo = getRepo();
  const { error } = await repo.deleteCertification(certId, nurseId);
  if (error) throw new DatabaseError(error.message, error);
}

export async function clearCertifications(userId: string) {
  const nurseId = await requireNurseId(userId);
  const repo = getRepo();
  const { error } = await repo.clearAllCertifications(nurseId);
  if (error) throw new DatabaseError(error.message, error);
}

// --- Profile Picture ---

export async function uploadProfilePicture(userId: string, file: Express.Multer.File) {
  const repo = getRepo();
  const nurseId = await repo.getNurseId(userId);
  if (!nurseId) throw new NotFoundError("Profile not found");

  const ext = file.originalname.split(".").pop() || "jpg";
  const path = `${userId}/profile.${ext}`;
  const timestamp = Date.now();

  const { error: uploadErr } = await repo.uploadProfilePicture(
    "profile-pictures",
    path,
    file.buffer,
    file.mimetype
  );

  if (uploadErr) {
    // Fallback to resumes bucket
    const fallbackPath = `profile-images/${userId}/profile.${ext}`;
    const { error: fallbackErr } = await repo.uploadProfilePicture(
      "resumes",
      fallbackPath,
      file.buffer,
      file.mimetype
    );
    if (fallbackErr) throw new DatabaseError("Failed to upload profile picture to fallback storage", fallbackErr);

    const { data: urlData } = await repo.getPublicUrl("resumes", fallbackPath);
    // Add cache-busting query parameter
    const cachedUrl = `${urlData.publicUrl}?t=${timestamp}`;
    await repo.updateProfile(nurseId, { profile_picture_url: cachedUrl } as Record<string, unknown>);
    return cachedUrl;
  }

  const { data: urlData } = await repo.getPublicUrl("profile-pictures", path);
  const supabase = createServerSupabase();
  // Add cache-busting query parameter to ensure browser loads new image
  const cachedUrl = `${urlData.publicUrl}?t=${timestamp}`;
  await supabase
    .from("nurse_profiles")
    .update({ profile_picture_url: cachedUrl, updated_at: new Date().toISOString() })
    .eq("id", nurseId);

  return cachedUrl;
}

export async function deleteProfilePicture(userId: string) {
  const supabase = createServerSupabase();
  const repo = new NursesRepository(supabase);
  const nurseId = await repo.getNurseId(userId);
  if (!nurseId) throw new NotFoundError("Profile not found");

  // Get the current profile to find the storage path
  const { data: profile } = await supabase
    .from("nurse_profiles")
    .select("profile_picture_url")
    .eq("id", nurseId)
    .single();

  if (profile?.profile_picture_url) {
    // Try to delete from profile-pictures bucket
    const path = `${userId}/profile.`;
    await repo.deleteStorageFile("profile-pictures", [path + "jpg", path + "jpeg", path + "png", path + "gif", path + "webp"]).catch(() => {
      // Ignore errors - file might not exist
    });

    // Try to delete from resumes bucket (fallback)
    const fallbackPath = `profile-images/${userId}/profile.`;
    await repo.deleteStorageFile("resumes", [fallbackPath + "jpg", fallbackPath + "jpeg", fallbackPath + "png", fallbackPath + "gif", fallbackPath + "webp"]).catch(() => {
      // Ignore errors - file might not exist
    });
  }

  await supabase
    .from("nurse_profiles")
    .update({ profile_picture_url: null, updated_at: new Date().toISOString() })
    .eq("id", nurseId);
}

// --- Stats ---

export async function getNurseStats() {
  const supabase = createServerSupabase();

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  // Run counts and data fetch in parallel
  const [
    { count: totalNurses, error: totalError },
    { count: completeProfiles, error: completeError },
    { data: recentUsers, error: recentError }
  ] = await Promise.all([
    supabase.from("nurse_profiles").select("*", { count: "exact", head: true }),
    supabase.from("nurse_profiles").select("*", { count: "exact", head: true }).eq("profile_complete", true),
    supabase.from("users")
      .select("created_at")
      .eq("role", "nurse")
      .gte("created_at", sevenDaysAgo.toISOString())
  ]);

  if (totalError) throw new DatabaseError(totalError.message, totalError);
  if (completeError) throw new DatabaseError(completeError.message, completeError);
  if (recentError) throw new DatabaseError(recentError.message, recentError);

  // Process registrations per day
  const registrationsPerDay: { date: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    registrationsPerDay.push({ date: dateStr, count: 0 });
  }

  recentUsers?.forEach((user) => {
    const day = new Date(user.created_at).toISOString().slice(0, 10);
    const slot = registrationsPerDay.find((d) => d.date === day);
    if (slot) slot.count++;
  });

  return {
    totalNurses: totalNurses || 0,
    completeProfiles: completeProfiles || 0,
    incompleteProfiles: (totalNurses || 0) - (completeProfiles || 0),
    registrationsPerDay,
  };
}
