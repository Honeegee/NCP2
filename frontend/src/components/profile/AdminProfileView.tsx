"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    User,
    Mail,
    Phone,
    Edit2,
    ShieldCheck,
    ShieldAlert,
    Calendar,
    CheckCircle,
    UserCircle,
    Trash2,
} from "lucide-react";
import { HeroBackground } from "@/components/shared/HeroBackground";
import Image from "next/image";
import type { AdminProfile } from "@/types";

import { ChangePasswordModal } from "./modals/ChangePasswordModal";

interface AdminProfileViewProps {
    profile: AdminProfile & { user: { email: string; role: string; created_at: string } };
    onEditProfile?: () => void;
    onProfilePictureUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onDeleteProfilePicture?: () => void;
    uploadingPicture?: boolean;
}

export function AdminProfileView({
    profile,
    onEditProfile,
    onProfilePictureUpload,
    onDeleteProfilePicture,
    uploadingPicture,
}: AdminProfileViewProps) {
    const [passwordModalOpen, setPasswordModalOpen] = React.useState(false);
    const editable = !!onEditProfile;
    const initials = `${(profile.first_name || "A")[0]}${(profile.last_name || "D")[0]}`.toUpperCase();
    const displayName = (profile.first_name || profile.last_name)
        ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim()
        : profile.user.email.split("@")[0];

    return (
        <div className="space-y-8 pb-12">
            <HeroBackground style={{ paddingBottom: "14rem", minHeight: "18rem" }} showWave />

            <div className="max-w-7xl mx-auto px-6 -mt-52 relative z-10 w-full">
                <div className="flex flex-col md:flex-row items-center gap-8 md:gap-10">
                    <div className="relative group">
                        <div className="h-32 w-32 md:h-48 md:w-48 rounded-full border-4 border-white/30 shadow-[0_0_30px_rgba(0,0,0,0.3)] overflow-hidden bg-background relative z-10">
                            {profile.profile_picture_url ? (
                                <Image
                                    src={profile.profile_picture_url}
                                    alt={displayName}
                                    fill
                                    className="object-cover"
                                    priority
                                />
                            ) : (
                                <div className="h-full w-full bg-primary-lighter text-primary flex items-center justify-center text-3xl md:text-6xl font-black">
                                    {initials}
                                </div>
                            )}
                        </div>

                        {profile.profile_picture_url ? (
                            <div className="absolute top-2 right-2 bg-success rounded-full p-2 border-2 border-white shadow-lg z-20">
                                <CheckCircle className="h-4 w-4 text-white" />
                            </div>
                        ) : (
                            <div className="absolute top-2 right-2 bg-primary rounded-full p-2 border-2 border-white shadow-lg z-20">
                                <User className="h-4 w-4 text-white" />
                            </div>
                        )}

                        {editable && (
                            <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 bg-black/50 z-30">
                                <label className="cursor-pointer h-10 w-10 md:h-12 md:w-12 bg-white rounded-2xl flex items-center justify-center hover:bg-muted transition-all shadow-xl hover:scale-110 active:scale-95">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={onProfilePictureUpload}
                                        disabled={uploadingPicture}
                                    />
                                    {uploadingPicture ? (
                                        <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <Edit2 className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                                    )}
                                </label>

                                {profile.profile_picture_url && onDeleteProfilePicture && (
                                    <button
                                        onClick={onDeleteProfilePicture}
                                        disabled={uploadingPicture}
                                        className="h-10 w-10 md:h-12 md:w-12 bg-white rounded-2xl flex items-center justify-center hover:bg-muted transition-all shadow-xl hover:scale-110 active:scale-95"
                                    >
                                        <Trash2 className="h-5 w-5 md:h-6 md:w-6 text-destructive" />
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex-1 text-center md:text-left space-y-4">
                        <div className="space-y-1">
                            <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
                                <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight capitalize drop-shadow-md">
                                    {displayName}
                                </h1>
                                <Badge className={cn(
                                    "w-fit mx-auto md:mx-0 font-black px-4 py-1.5 text-[10px] tracking-widest border-none shadow-xl uppercase",
                                    profile.user.role === "superadmin" ? "bg-highlight text-white" : "bg-white/20 text-white backdrop-blur-md"
                                )}>
                                    {profile.user.role === "superadmin" ? "SUPER ADMIN" : "ADMINISTRATOR"}
                                </Badge>
                            </div>
                        </div>

                        <div className="flex flex-wrap justify-center md:justify-start gap-6 text-white drop-shadow-sm font-medium">
                            <div className="flex items-center gap-2.5 text-sm md:text-lg">
                                <Mail className="h-5 w-5 opacity-80" />
                                <span>{profile.user.email}</span>
                            </div>
                            {profile.phone && (
                                <div className="flex items-center gap-2.5 text-sm md:text-lg">
                                    <Phone className="h-5 w-5 opacity-80" />
                                    <span>{profile.phone}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-2.5 text-sm md:text-lg">
                                <Calendar className="h-5 w-5 opacity-80" />
                                <span>Joined {new Date(profile.user.created_at || new Date()).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>

                    {editable && (
                        <div className="md:ml-auto md:self-center">
                            <Button
                                onClick={onEditProfile}
                                variant="secondary"
                                size="icon"
                                className="bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md h-12 w-12 md:h-14 md:w-14 rounded-2xl shadow-2xl transition-all hover:scale-110 active:scale-95"
                                title="Edit Profile"
                            >
                                <Edit2 className="h-6 w-6 md:h-7 md:w-7" />
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
                <Card className="md:col-span-2 section-card overflow-hidden">
                    <CardHeader className="border-b bg-muted/30 p-6 flex flex-row items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
                                <UserCircle className="h-6 w-6" />
                            </div>
                            <div>
                                <CardTitle className="text-xl">Personal Information</CardTitle>
                                <p className="text-sm text-muted-foreground">Your account details and contact info</p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">First Name</p>
                                <p className="text-lg font-semibold text-foreground">{profile.first_name || "—"}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Last Name</p>
                                <p className="text-lg font-semibold text-foreground">{profile.last_name || "—"}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Email Address</p>
                                <p className="text-lg font-semibold text-foreground">{profile.user.email}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Phone Number</p>
                                <p className="text-lg font-semibold text-foreground">{profile.phone || "Not set"}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card className="section-card overflow-hidden shadow-sm">
                        <CardHeader className="bg-muted/30 border-b">
                            <div className="flex items-center gap-3">
                                <ShieldCheck className="h-5 w-5 text-primary" />
                                <CardTitle className="text-base">Access & Security</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Global Role</span>
                                <Badge variant="outline" className="font-bold border-primary/20 text-primary bg-primary/5 uppercase">
                                    {profile.user.role}
                                </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">2FA Status</span>
                                <Badge variant="outline" className="font-bold border-muted-foreground/20 text-muted-foreground bg-muted">
                                    DISABLED
                                </Badge>
                            </div>
                            <div className="pt-4 border-t">
                                <Button
                                    variant="outline"
                                    className="w-full text-sm font-semibold rounded-xl hover:bg-primary hover:text-white transition-all active:scale-95"
                                    onClick={() => setPasswordModalOpen(true)}
                                >
                                    Change Password
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-primary/5 border-primary/20 section-card">
                        <CardContent className="p-6 text-center space-y-4">
                            <div className="p-3 bg-white rounded-full w-fit mx-auto shadow-sm">
                                <ShieldAlert className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <p className="font-bold text-foreground">Management Permissions</p>
                                <p className="text-xs text-muted-foreground mt-1 px-4">
                                    Your account has permission to manage {profile.user.role === "superadmin" ? "all system resources including staff" : "users, jobs and applications"}.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <ChangePasswordModal
                open={passwordModalOpen}
                onOpenChange={setPasswordModalOpen}
            />
        </div>
    );
}

// Helper for cn
function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(" ");
}
