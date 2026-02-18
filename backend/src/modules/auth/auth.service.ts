import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../../config/env";
import { createServerSupabase } from "../../shared/database";
import {
  checkAccountLockout,
  recordFailedLogin,
  clearFailedLogins,
  sanitizeEmail,
  generateSecureToken,
  isValidTokenFormat,
} from "../../shared/security";
import { getResend, getFromEmail } from "../../shared/resend";
import { getPasswordResetEmailHtml, getPasswordResetEmailText } from "../../shared/email-templates";
import { getNovu } from "../../shared/novu";
import {
  UnauthorizedError,
  BadRequestError,
  NotFoundError,
  ConflictError,
  TooManyRequestsError,
} from "../../shared/errors";

interface TokenPair {
  accessToken: string;
  refreshToken: string;
  user: { id: string; email: string; role: string; firstName?: string; lastName?: string };
}

function signAccessToken(payload: { id: string; email: string; role: string }): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_ACCESS_EXPIRY });
}

function signRefreshToken(payload: { id: string }): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRY });
}

export async function login(email: string, password: string): Promise<TokenPair> {
  const cleanEmail = sanitizeEmail(email);

  // Check lockout
  const lockout = checkAccountLockout(cleanEmail);
  if (lockout.isLocked) {
    const minutes = Math.ceil((lockout.remainingTime || 0) / 60);
    throw new TooManyRequestsError(
      `Account temporarily locked. Try again in ${minutes} minutes.`
    );
  }

  const supabase = createServerSupabase();
  const { data: user, error } = await supabase
    .from("users")
    .select("id, email, password_hash, role")
    .eq("email", cleanEmail)
    .single();

  if (error || !user) {
    recordFailedLogin(cleanEmail);
    throw new UnauthorizedError("Invalid email or password");
  }

  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    const result = recordFailedLogin(cleanEmail);
    if (result.shouldLockout) {
      throw new TooManyRequestsError(
        "Too many failed attempts. Account locked for 30 minutes."
      );
    }
    throw new UnauthorizedError("Invalid email or password");
  }

  clearFailedLogins(cleanEmail);

  // Get nurse profile for name
  let firstName: string | undefined;
  let lastName: string | undefined;
  if (user.role === "nurse") {
    const { data: profile } = await supabase
      .from("nurse_profiles")
      .select("first_name, last_name")
      .eq("user_id", user.id)
      .single();
    firstName = profile?.first_name;
    lastName = profile?.last_name;
  }

  // Identify Novu subscriber
  const novu = getNovu();
  if (novu) {
    try {
      await novu.subscribers.identify(user.id, {
        email: user.email,
        firstName,
        lastName,
      });
      if (user.role === "nurse") {
        await novu.topics.addSubscribers("nurses", { subscribers: [user.id] });
      }
    } catch (err) {
      console.error("Novu subscriber identify failed:", err);
    }
  }

  const accessToken = signAccessToken({ id: user.id, email: user.email, role: user.role });
  const refreshToken = signRefreshToken({ id: user.id });

  return {
    accessToken,
    refreshToken,
    user: { id: user.id, email: user.email, role: user.role, firstName, lastName },
  };
}

export async function register(data: {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  mobile_number: string;
  location_type: string;
  professional_status?: string;
  employment_status?: string;
  certifications?: { cert_type: string; cert_number?: string; score?: string }[];
  years_of_experience?: string;
  specialization?: string;
  school_name?: string;
  graduation_year?: string;
  internship_experience?: string;
}): Promise<{ user_id: string; profile_id: string; accessToken: string; refreshToken: string }> {
  const supabase = createServerSupabase();

  // Check existing user
  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("email", data.email)
    .single();

  if (existing) {
    throw new ConflictError("An account with this email already exists");
  }

  const password_hash = await bcrypt.hash(data.password, 12);

  // Create user
  const { data: user, error: userError } = await supabase
    .from("users")
    .insert({ email: data.email, password_hash, role: "nurse" })
    .select("id")
    .single();

  if (userError || !user) {
    throw new Error("Failed to create account");
  }

  const parsedYears = data.years_of_experience ? parseInt(data.years_of_experience, 10) || 0 : 0;
  const parsedGradYear = data.graduation_year ? parseInt(data.graduation_year, 10) || null : null;

  // Create nurse profile
  const { data: profile, error: profileError } = await supabase
    .from("nurse_profiles")
    .insert({
      user_id: user.id,
      first_name: data.first_name,
      last_name: data.last_name || "",
      phone: data.mobile_number || "",
      country: data.location_type === "overseas" ? "Overseas" : "Philippines",
      location_type: data.location_type || "philippines",
      professional_status: data.professional_status || "registered_nurse",
      employment_status: data.employment_status || null,
      specialization: data.specialization || null,
      school_name: data.school_name || null,
      internship_experience: data.internship_experience || null,
      graduation_year: parsedGradYear,
      years_of_experience: parsedYears,
      profile_complete: true,
    })
    .select("id")
    .single();

  if (profileError || !profile) {
    // Rollback user
    await supabase.from("users").delete().eq("id", user.id);
    throw new Error("Failed to create profile");
  }

  // Insert certifications
  if (data.certifications && data.certifications.length > 0) {
    const certRecords = data.certifications
      .filter((c) => c.cert_type)
      .map((c) => ({
        nurse_id: profile.id,
        cert_type: c.cert_type,
        cert_number: c.cert_number || null,
        score: c.score || null,
      }));
    if (certRecords.length > 0) {
      await supabase.from("nurse_certifications").insert(certRecords);
    }
  }

  // Insert education for students
  if (data.professional_status === "nursing_student" && data.school_name) {
    await supabase.from("nurse_education").insert({
      nurse_id: profile.id,
      institution: data.school_name,
      degree: "Bachelor of Science in Nursing",
      graduation_year: parsedGradYear,
    });
  }

  const accessToken = signAccessToken({ id: user.id, email: data.email, role: "nurse" });
  const refreshToken = signRefreshToken({ id: user.id });

  return { user_id: user.id, profile_id: profile.id, accessToken, refreshToken };
}

export async function refreshAccessToken(refreshTokenStr: string): Promise<{ accessToken: string }> {
  try {
    const decoded = jwt.verify(refreshTokenStr, env.JWT_SECRET) as { id: string };
    const supabase = createServerSupabase();
    const { data: user, error } = await supabase
      .from("users")
      .select("id, email, role")
      .eq("id", decoded.id)
      .single();

    if (error || !user) throw new UnauthorizedError("Invalid refresh token");

    const accessToken = signAccessToken({ id: user.id, email: user.email, role: user.role });
    return { accessToken };
  } catch {
    throw new UnauthorizedError("Invalid or expired refresh token");
  }
}

export async function forgotPassword(email: string, frontendUrl?: string): Promise<void> {
  const cleanEmail = sanitizeEmail(email);
  const supabase = createServerSupabase();

  const { data: user, error: userError } = await supabase
    .from("users")
    .select(`id, email, nurse_profiles (first_name, last_name)`)
    .eq("email", cleanEmail)
    .single();

  if (userError || !user) {
    // Prevent timing attacks
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return;
  }

  const resetToken = await generateSecureToken(32);
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 1);

  // Invalidate existing tokens
  await supabase
    .from("password_reset_tokens")
    .update({ used: true })
    .eq("user_id", user.id)
    .eq("used", false);

  const { error: tokenError } = await supabase
    .from("password_reset_tokens")
    .insert({
      user_id: user.id,
      token: resetToken,
      expires_at: expiresAt.toISOString(),
    });

  if (tokenError) throw new Error("Failed to create reset token");

  const baseUrl = frontendUrl || env.CORS_ORIGIN || "http://localhost:3000";
  const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

  const userProfile = Array.isArray(user.nurse_profiles)
    ? user.nurse_profiles[0]
    : user.nurse_profiles;
  const userName = userProfile?.first_name
    ? `${userProfile.first_name} ${userProfile.last_name || ""}`.trim()
    : cleanEmail.split("@")[0];

  const resend = getResend();
  if (resend) {
    try {
      await resend.emails.send({
        from: getFromEmail(),
        to: cleanEmail,
        subject: "Reset Your Password - Nurse Care Pro",
        html: getPasswordResetEmailHtml({ userName, resetUrl, expiryTime: "1 hour" }),
        text: getPasswordResetEmailText({ userName, resetUrl, expiryTime: "1 hour" }),
      });
    } catch (err) {
      console.error("Error sending reset email:", err);
    }
  }
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  if (!isValidTokenFormat(token)) {
    throw new BadRequestError("Invalid or expired reset token");
  }

  const supabase = createServerSupabase();

  const { data: resetToken, error: tokenError } = await supabase
    .from("password_reset_tokens")
    .select("*")
    .eq("token", token)
    .eq("used", false)
    .single();

  if (tokenError || !resetToken) {
    throw new BadRequestError("Invalid or expired reset token");
  }

  if (new Date() > new Date(resetToken.expires_at)) {
    await supabase.from("password_reset_tokens").update({ used: true }).eq("id", resetToken.id);
    throw new BadRequestError("Reset token has expired. Please request a new one.");
  }

  const { data: currentUser, error: userError } = await supabase
    .from("users")
    .select("password_hash")
    .eq("id", resetToken.user_id)
    .single();

  if (userError || !currentUser) throw new NotFoundError("User not found");

  const isSame = await bcrypt.compare(newPassword, currentUser.password_hash);
  if (isSame) throw new BadRequestError("New password must be different from current password");

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  const { error: updateError } = await supabase
    .from("users")
    .update({ password_hash: hashedPassword })
    .eq("id", resetToken.user_id);

  if (updateError) throw new Error("Failed to update password");

  // Invalidate all tokens for this user
  await supabase
    .from("password_reset_tokens")
    .update({ used: true })
    .eq("user_id", resetToken.user_id)
    .eq("used", false);
}

export async function changePassword(
  userId: string,
  userEmail: string,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const supabase = createServerSupabase();

  const { data: user, error } = await supabase
    .from("users")
    .select("password_hash")
    .eq("id", userId)
    .single();

  if (error || !user) throw new NotFoundError("User not found");

  const isValid = await bcrypt.compare(currentPassword, user.password_hash);
  if (!isValid) {
    const result = recordFailedLogin(userEmail);
    if (result.shouldLockout) {
      throw new TooManyRequestsError("Too many failed attempts. Account locked for 30 minutes.");
    }
    throw new BadRequestError(
      `Current password is incorrect. ${result.attemptsRemaining} attempts remaining.`
    );
  }

  clearFailedLogins(userEmail);

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  const { error: updateError } = await supabase
    .from("users")
    .update({ password_hash: hashedPassword })
    .eq("id", userId);

  if (updateError) throw new Error("Failed to update password");
}
