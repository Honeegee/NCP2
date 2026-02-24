import bcrypt from "bcryptjs";
import { createServerSupabase } from "../../shared/database";
import { UsersRepository } from "./users.repository";
import { DatabaseError, ConflictError, NotFoundError, BadRequestError } from "../../shared/errors";

function getRepo() {
    return new UsersRepository(createServerSupabase());
}

export async function getStaffList() {
    const repo = getRepo();
    const { data, error } = await repo.listStaff();
    if (error) throw new DatabaseError(error.message, error);
    return data || [];
}

export async function createStaffAccount(data: {
    email: string;
    password?: string;
    role: "admin" | "superadmin";
    firstName?: string;
    lastName?: string;
}) {
    const repo = getRepo();
    const supabase = createServerSupabase();

    // Check if exists
    const { data: existing } = await repo.findByEmail(data.email);
    if (existing) {
        throw new ConflictError("A user with this email already exists");
    }

    // Use password123 as default if none provided
    const password = data.password || "password123";
    const password_hash = await bcrypt.hash(password, 12);

    const { data: user, error } = await repo.createStaff({
        email: data.email,
        password_hash,
        role: data.role,
        email_verified: true, // Staff accounts are pre-verified
    });

    if (error || !user) throw new DatabaseError(error?.message || "Failed to create user", error);

    // Create admin profile
    const { error: profileError } = await supabase
        .from("admin_profiles")
        .insert({
            user_id: user.id,
            first_name: data.firstName || data.email.split("@")[0],
            last_name: data.lastName || "",
        });

    if (profileError) {
        // Rollback user creation? For now just log, but better to be atomic.
        // Since we don't have a transaction helper here, we just proceed or throw.
        console.error("Failed to create admin profile:", profileError);
    }

    return user;
}

export async function removeStaffAccount(id: string, requesterId: string) {
    const repo = getRepo();

    if (id === requesterId) {
        throw new BadRequestError("You cannot remove your own account");
    }

    const { error } = await repo.deleteUser(id);
    if (error) throw new DatabaseError(error.message, error);
}

export async function updateStaffRole(id: string, role: "admin" | "superadmin") {
    const repo = getRepo();
    const { data, error } = await repo.updateRole(id, role);
    if (error) throw new DatabaseError(error.message, error);
    if (!data) throw new NotFoundError("User not found");
    return data;
}

export async function getAdminProfile(userId: string) {
    const repo = getRepo();
    const { data, error } = await repo.getProfile(userId);
    if (error) throw new DatabaseError(error.message, error);
    if (!data) throw new NotFoundError("Profile not found");
    return data;
}

export async function updateAdminProfile(userId: string, data: any) {
    const repo = getRepo();
    const { data: profile, error } = await repo.updateProfile(userId, data);
    if (error) throw new DatabaseError(error.message, error);
    return profile;
}

export async function uploadProfilePicture(userId: string, file: Express.Multer.File) {
    const repo = getRepo();
    const ext = file.originalname.split(".").pop() || "jpg";
    const path = `${userId}/profile.${ext}`;
    const timestamp = Date.now();

    const { error: uploadErr } = await repo.uploadProfilePicture(
        "admin-assets",
        path,
        file.buffer,
        file.mimetype
    );

    if (uploadErr) {
        throw new DatabaseError("Failed to upload profile picture", uploadErr);
    }

    const { data: urlData } = await repo.getPublicUrl("admin-assets", path);
    const cachedUrl = `${urlData.publicUrl}?t=${timestamp}`;

    const { error: updateErr } = await repo.updateProfile(userId, { profile_picture_url: cachedUrl });
    if (updateErr) throw new DatabaseError("Failed to update profile with picture URL", updateErr);

    return cachedUrl;
}

export async function deleteProfilePicture(userId: string) {
    const repo = getRepo();
    const path = `${userId}/profile.`;

    await repo.deleteStorageFile("admin-assets", [
        path + "jpg", path + "jpeg", path + "png", path + "gif", path + "webp"
    ]).catch(() => { });

    const { error } = await repo.updateProfile(userId, { profile_picture_url: null });
    if (error) throw new DatabaseError("Failed to remove profile picture URL", error);
}
