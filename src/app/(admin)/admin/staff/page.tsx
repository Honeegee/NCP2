"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api-client";
import { HeroBackground } from "@/components/shared/HeroBackground";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectOption
} from "@/components/ui/select";
import {
    ShieldCheck,
    UserPlus,
    Trash2,
    Mail,
    UserCheck,
    ShieldAlert,
    Search,
    Filter,
    User as UserIcon,
    Eye,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { AdminProfileView } from "@/components/profile/AdminProfileView";

interface User {
    id: string;
    email: string;
    role: "admin" | "superadmin";
    created_at: string;
    last_login_at: string | null;
    email_verified: boolean;
    admin_profiles?: {
        id: string;
        user_id: string;
        first_name: string;
        last_name: string;
        phone: string | null;
        profile_picture_url: string | null;
        updated_at: string;
    } | {
        id: string;
        user_id: string;
        first_name: string;
        last_name: string;
        phone: string | null;
        profile_picture_url: string | null;
        updated_at: string;
    }[];
}

export default function StaffManagementPage() {
    const { user: currentUser } = useAuth();
    const [staff, setStaff] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newStaff, setNewStaff] = useState({
        email: "",
        password: "",
        firstName: "",
        lastName: "",
        role: "admin" as "admin" | "superadmin",
    });
    const [searchQuery, setSearchQuery] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [viewingStaff, setViewingStaff] = useState<User | null>(null);

    useEffect(() => {
        fetchStaff();
    }, []);

    async function fetchStaff() {
        try {
            const data = await api.get<User[]>("/users/staff");
            setStaff(data || []);
        } catch (err: any) {
            console.error("Failed to fetch staff:", err);
            toast.error(err.message || "Failed to load staff list");
        } finally {
            setLoading(false);
        }
    }

    async function handleCreateStaff(e: React.FormEvent) {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post("/users/staff", {
                email: newStaff.email,
                password: newStaff.password || undefined,
                role: newStaff.role,
                firstName: newStaff.firstName,
                lastName: newStaff.lastName,
            });
            toast.success("Staff account created successfully");
            setIsCreateOpen(false);
            setNewStaff({ email: "", password: "", role: "admin", firstName: "", lastName: "" });
            fetchStaff();
        } catch (err: any) {
            toast.error(err.message || "Failed to create staff account");
        } finally {
            setSubmitting(false);
        }
    }

    async function handleDeleteStaff(id: string) {
        if (id === currentUser?.id) {
            toast.error("You cannot delete your own account");
            return;
        }

        if (!confirm("Are you sure you want to remove this staff member? This action cannot be undone.")) {
            return;
        }

        try {
            await api.delete(`/users/staff/${id}`);
            toast.success("Staff member removed");
            setStaff(staff.filter((s) => s.id !== id));
        } catch (err: any) {
            toast.error(err.message || "Failed to remove staff member");
        }
    }

    async function handleUpdateRole(id: string, role: string) {
        try {
            await api.patch(`/users/staff/${id}/role`, { role });
            toast.success("Role updated successfully");
            setStaff(staff.map(s => s.id === id ? { ...s, role: role as any } : s));
        } catch (err: any) {
            toast.error(err.message || "Failed to update role");
        }
    }

    const filteredStaff = staff.filter(s => {
        const profile = Array.isArray(s.admin_profiles) ? s.admin_profiles[0] : s.admin_profiles;
        const fullName = profile ? `${profile.first_name} ${profile.last_name}`.toLowerCase() : "";
        return s.email.toLowerCase().includes(searchQuery.toLowerCase()) || fullName.includes(searchQuery.toLowerCase());
    });

    return (
        <div className="space-y-8 pb-12">
            <HeroBackground showWave>
                <div className="admin-hero-container">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-xl">
                                    <ShieldCheck className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold text-white">Staff Management</h1>
                                    <p className="text-white/60 text-sm">Manage administrative roles and permissions</p>
                                </div>
                            </div>
                        </div>

                        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                            <DialogTrigger className="btn-primary-green group h-12 px-6 shadow-xl hover:scale-[1.02] transition-all rounded-md flex items-center justify-center font-medium">
                                <UserPlus className="h-5 w-5 mr-2 group-hover:rotate-12 transition-transform" />
                                Add New Staff
                            </DialogTrigger>
                            <DialogContent className="max-w-md bg-card border-border shadow-2xl rounded-3xl p-6">
                                <DialogHeader>
                                    <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-foreground">
                                        <UserCheck className="h-6 w-6 text-primary" />
                                        Create Staff Account
                                    </DialogTitle>
                                    <DialogDescription>
                                        Create a new administrative account. Pre-verified by default.
                                    </DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleCreateStaff} className="space-y-5 mt-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2 text-foreground">
                                            <Label htmlFor="firstName">First Name</Label>
                                            <Input
                                                id="firstName"
                                                placeholder="John"
                                                className="h-11 bg-muted/50 border-border rounded-xl text-foreground"
                                                value={newStaff.firstName}
                                                onChange={(e) => setNewStaff({ ...newStaff, firstName: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2 text-foreground">
                                            <Label htmlFor="lastName">Last Name</Label>
                                            <Input
                                                id="lastName"
                                                placeholder="Doe"
                                                className="h-11 bg-muted/50 border-border rounded-xl text-foreground"
                                                value={newStaff.lastName}
                                                onChange={(e) => setNewStaff({ ...newStaff, lastName: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2 text-foreground">
                                        <Label htmlFor="email">Email Address</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="admin@nursecarepro.com"
                                                className="pl-10 h-11 bg-muted/50 border-border rounded-xl focus:ring-primary focus:border-primary transition-all text-foreground"
                                                value={newStaff.email}
                                                onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2 text-foreground">
                                        <Label htmlFor="password">Initial Password (Optional)</Label>
                                        <Input
                                            id="password"
                                            type="password"
                                            placeholder="Default: password123"
                                            className="h-11 bg-muted/50 border-border rounded-xl focus:ring-primary focus:border-primary transition-all text-foreground"
                                            value={newStaff.password}
                                            onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2 text-foreground">
                                        <Label htmlFor="role">Global Role</Label>
                                        <Select
                                            value={newStaff.role}
                                            onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value as any })}
                                        >
                                            <SelectOption value="admin">Standard Admin</SelectOption>
                                            <SelectOption value="superadmin">Super Admin (God Mode)</SelectOption>
                                        </Select>
                                    </div>
                                    <DialogFooter className="pt-2">
                                        <Button
                                            type="submit"
                                            disabled={submitting}
                                            className="w-full h-12 btn-primary font-bold shadow-lg"
                                        >
                                            {submitting ? "Creating Account..." : "Create Account"}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </HeroBackground>

            <div className="max-w-7xl mx-auto px-6 space-y-6">
                {/* Stats Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="stats-card overflow-hidden">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                                    <ShieldCheck className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Total Staff</p>
                                    <p className="text-3xl font-bold text-foreground">{staff.length}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="stats-card overflow-hidden">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-2xl bg-highlight/10 text-highlight">
                                    <ShieldAlert className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Super Admins</p>
                                    <p className="text-3xl font-bold text-foreground">
                                        {staff.filter(s => s.role === "superadmin").length}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="stats-card overflow-hidden">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-2xl bg-success/10 text-success">
                                    <UserCheck className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Active Sessions</p>
                                    <p className="text-3xl font-bold text-foreground">
                                        {staff.filter(s => s.last_login_at).length}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters/Search */}
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full sm:max-w-md">
                        <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                        <Input
                            placeholder="Search staff by name or email..."
                            className="pl-10 h-11 bg-card border-border rounded-xl shadow-sm text-foreground"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Staff Table */}
                <Card className="section-card overflow-hidden">
                    <CardHeader className="border-b bg-muted/30 p-6">
                        <CardTitle className="text-xl text-foreground">Staff Directory</CardTitle>
                        <CardDescription>Accounts with administrative access to the platform</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="p-20 flex justify-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                            </div>
                        ) : filteredStaff.length === 0 ? (
                            <div className="p-20 text-center space-y-4">
                                <div className="inline-flex p-4 rounded-full bg-muted">
                                    <Mail className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <h3 className="text-lg font-semibold text-foreground">No staff found</h3>
                                <p className="text-muted-foreground">Try adjusting your search query.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-muted/50 text-left border-b border-border">
                                            <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">User</th>
                                            <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Role</th>
                                            <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Last Activity</th>
                                            <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Joined</th>
                                            <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {filteredStaff.map((s) => {
                                            const isMe = s.id === currentUser?.id;
                                            const profile = Array.isArray(s.admin_profiles) ? s.admin_profiles[0] : s.admin_profiles;
                                            const fullName = profile ? `${profile.first_name} ${profile.last_name}`.trim() : "";
                                            const initials = (profile?.first_name?.[0] || s.email[0]).toUpperCase();

                                            return (
                                                <tr key={s.id} className="hover:bg-muted/30 transition-colors group">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center gap-3">
                                                            <Avatar className="h-10 w-10 border border-border shadow-sm">
                                                                {profile?.profile_picture_url && (
                                                                    <AvatarImage src={profile.profile_picture_url} />
                                                                )}
                                                                <AvatarFallback className="bg-primary-lighter text-primary font-bold">
                                                                    {initials}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div>
                                                                <p className="font-semibold text-foreground flex items-center gap-2">
                                                                    {fullName || s.email.split("@")[0]}
                                                                    {isMe && (
                                                                        <Badge variant="outline" className="text-[10px] font-bold bg-primary/5 text-primary border-primary/20">
                                                                            YOU
                                                                        </Badge>
                                                                    )}
                                                                </p>
                                                                <p className="text-xs text-muted-foreground">{s.email}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <Select
                                                            disabled={isMe}
                                                            value={s.role}
                                                            onChange={(e) => handleUpdateRole(s.id, e.target.value)}
                                                            className={cn(
                                                                "h-9 w-36 rounded-lg font-semibold text-xs border-none shadow-none text-foreground",
                                                                s.role === "superadmin" ? "bg-highlight/10 text-highlight" : "bg-primary/10 text-primary"
                                                            )}
                                                        >
                                                            <SelectOption value="admin">Admin</SelectOption>
                                                            <SelectOption value="superadmin">Super Admin</SelectOption>
                                                        </Select>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                                        {s.last_login_at ? new Date(s.last_login_at).toLocaleDateString() : "Never"}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                                        {new Date(s.created_at).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-9 w-9 rounded-lg hover:bg-primary/10 hover:text-primary text-muted-foreground transition-all"
                                                                onClick={() => setViewingStaff(s)}
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-9 w-9 rounded-lg hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-all"
                                                                onClick={() => handleDeleteStaff(s.id)}
                                                                disabled={isMe}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* View Profile Dialog */}
                <Dialog open={!!viewingStaff} onOpenChange={(open) => !open && setViewingStaff(null)}>
                    <DialogContent className="max-w-4xl p-0 overflow-hidden bg-card border-border rounded-3xl">
                        {viewingStaff && (
                            <AdminProfileView
                                profile={{
                                    ...(Array.isArray(viewingStaff.admin_profiles) ? viewingStaff.admin_profiles[0] : viewingStaff.admin_profiles) as any,
                                    user: {
                                        email: viewingStaff.email,
                                        role: viewingStaff.role,
                                        created_at: viewingStaff.created_at
                                    }
                                }}
                            />
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
