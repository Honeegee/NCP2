"use client";

import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api-client";
import { KeyRound, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { changePasswordSchema, type ChangePasswordData } from "@/lib/validators";

interface ChangePasswordModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ChangePasswordModal({ open, onOpenChange }: ChangePasswordModalProps) {
    const [loading, setLoading] = useState(false);
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        setError,
    } = useForm<ChangePasswordData>({
        resolver: zodResolver(changePasswordSchema),
        mode: "onChange",
    });

    const onSubmit = async (data: ChangePasswordData) => {
        setLoading(true);
        try {
            const result = await api.post<{ message: string }>("/auth/change-password", data);
            toast.success(result.message || "Password changed successfully");
            onOpenChange(false);
            reset();
        } catch (err: any) {
            const message = err instanceof ApiError ? err.message : "An error occurred";
            // Check if it's a validation error from backend or a specific "current password" error
            if (message.toLowerCase().includes("current password")) {
                setError("currentPassword", { type: "manual", message });
            } else {
                toast.error(message);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleClose = (val: boolean) => {
        if (!val) {
            reset();
        }
        onOpenChange(val);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[425px] rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
                <div className="bg-primary p-8 text-white relative">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <KeyRound className="h-24 w-24" />
                    </div>
                    <DialogTitle className="text-2xl font-semibold tracking-tight">Change Password</DialogTitle>
                    <DialogDescription className="text-white/80 mt-2 font-medium">
                        Update your account security by choosing a strong password.
                    </DialogDescription>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6 bg-card">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="currentPassword" className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">
                                Current Password
                            </Label>
                            <div className="relative">
                                <Input
                                    id="currentPassword"
                                    type={showCurrent ? "text" : "password"}
                                    placeholder="Enter current password"
                                    {...register("currentPassword")}
                                    className={cn(
                                        "h-12 bg-muted/50 border-none rounded-xl pl-4 pr-12 focus-visible:ring-2",
                                        errors.currentPassword ? "ring-2 ring-destructive/30" : "focus-visible:ring-primary/20"
                                    )}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowCurrent(!showCurrent)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                                >
                                    {showCurrent ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                            {errors.currentPassword && (
                                <p className="text-[11px] font-semibold text-destructive/90 ml-1 mt-1.5 animate-in fade-in slide-in-from-top-1">
                                    {errors.currentPassword.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="newPassword" className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">
                                New Password
                            </Label>
                            <div className="relative">
                                <Input
                                    id="newPassword"
                                    type={showNew ? "text" : "password"}
                                    placeholder="Min. 8 characters"
                                    {...register("newPassword")}
                                    className={cn(
                                        "h-12 bg-muted/50 border-none rounded-xl pl-4 pr-12 focus-visible:ring-2",
                                        errors.newPassword ? "ring-2 ring-destructive/30" : "focus-visible:ring-primary/20"
                                    )}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNew(!showNew)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                                >
                                    {showNew ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                            {errors.newPassword && (
                                <p className="text-[11px] font-semibold text-destructive/90 ml-1 mt-1.5 animate-in fade-in slide-in-from-top-1">
                                    {errors.newPassword.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword" className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">
                                Confirm New Password
                            </Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                placeholder="Re-type new password"
                                {...register("confirmPassword")}
                                className={cn(
                                    "h-12 bg-muted/50 border-none rounded-xl px-4 focus-visible:ring-2",
                                    errors.confirmPassword ? "ring-2 ring-destructive/30" : "focus-visible:ring-primary/20"
                                )}
                            />
                            {errors.confirmPassword && (
                                <p className="text-[11px] font-semibold text-destructive/90 ml-1 mt-1.5 animate-in fade-in slide-in-from-top-1">
                                    {errors.confirmPassword.message}
                                </p>
                            )}
                        </div>
                    </div>

                    <DialogFooter className="pt-4 gap-3 sm:gap-0">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => handleClose(false)}
                            className="h-12 rounded-xl font-medium px-6 text-muted-foreground hover:text-foreground"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="btn-primary-green h-12 rounded-xl font-semibold px-8 border-none shadow-lg transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-70"
                        >
                            {loading ? (
                                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    <ShieldCheck className="h-5 w-5 mr-2" />
                                    Update Password
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

