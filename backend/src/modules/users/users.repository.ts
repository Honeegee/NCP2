import { SupabaseClient } from "@supabase/supabase-js";

export class UsersRepository {
    constructor(private supabase: SupabaseClient) { }

    async listStaff() {
        return this.supabase
            .from("users")
            .select("id, email, role, created_at, last_login_at, email_verified, admin_profiles(*)")
            .in("role", ["admin", "superadmin"])
            .order("created_at", { ascending: false });
    }

    async findByEmail(email: string) {
        return this.supabase
            .from("users")
            .select("id, email, role")
            .eq("email", email)
            .single();
    }

    async createStaff(data: {
        email: string;
        password_hash: string;
        role: "admin" | "superadmin";
        email_verified: boolean;
    }) {
        return this.supabase
            .from("users")
            .insert(data)
            .select()
            .single();
    }

    async deleteUser(id: string) {
        return this.supabase
            .from("users")
            .delete()
            .eq("id", id);
    }

    async updateRole(id: string, role: "nurse" | "admin" | "superadmin") {
        return this.supabase
            .from("users")
            .update({ role })
            .eq("id", id)
            .select()
            .single();
    }

    async getProfile(userId: string) {
        return this.supabase
            .from("admin_profiles")
            .select("*")
            .eq("user_id", userId)
            .single();
    }

    async updateProfile(userId: string, data: { first_name?: string; last_name?: string; phone?: string; profile_picture_url?: string | null }) {
        return this.supabase
            .from("admin_profiles")
            .update({ ...data, updated_at: new Date().toISOString() })
            .eq("user_id", userId)
            .select()
            .single();
    }

    async uploadProfilePicture(bucket: string, path: string, body: Buffer, contentType: string) {
        return this.supabase.storage
            .from(bucket)
            .upload(path, body, {
                contentType,
                upsert: true
            });
    }

    async getPublicUrl(bucket: string, path: string) {
        return this.supabase.storage
            .from(bucket)
            .getPublicUrl(path);
    }

    async deleteStorageFile(bucket: string, paths: string[]) {
        return this.supabase.storage
            .from(bucket)
            .remove(paths);
    }
}
