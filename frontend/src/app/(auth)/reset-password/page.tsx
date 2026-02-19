"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api, ApiError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle } from "lucide-react";

const resetPasswordFormSchema = z.object({
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordFormSchema>;

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordFormSchema),
    mode: "onBlur",
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      toast.error("Invalid or missing reset token");
      return;
    }

    setLoading(true);

    try {
      await api.post("/auth/reset-password", {
        token,
        newPassword: data.newPassword,
      }, { skipAuth: true });

      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "An error occurred. Please try again.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex relative">
      {/* Back button */}
      <div className="absolute top-4 right-4 z-50">
        <Link href="/login" className="flex items-center gap-2 text-emerald-700 no-underline text-sm font-semibold hover:text-emerald-900">
          <ArrowLeft className="h-4 w-4" />
          Back to Login
        </Link>
      </div>

      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-primary relative overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/hero.png"
            alt="Background"
            fill
            className="object-cover opacity-60"
            priority
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>

        <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/90 via-emerald-900/60 to-transparent" />
        <div className="absolute inset-0">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/3 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col p-6 text-white w-full">
          <div className="flex items-center gap-3">
            <Image
              src="/ncpLogoname.png"
              alt="Nurse Care Pro"
              width={220}
              height={60}
              className="h-14 w-auto object-contain drop-shadow-[0_0_12px_rgba(255,255,255,0.5)]"
              priority
              unoptimized
            />
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex flex-col">
        <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-8">
          <div className="w-full max-w-md">
            {!token ? (
              /* No token - invalid link */
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold">Invalid Reset Link</h2>
                  <p className="text-muted-foreground mt-1">
                    This password reset link is invalid or has expired.
                  </p>
                </div>
                <Link href="/forgot-password">
                  <Button className="w-full h-11 btn-primary-green border-0 shadow-md">
                    Request New Reset Link
                  </Button>
                </Link>
              </div>
            ) : success ? (
              /* Success state */
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold">Password Reset</h2>
                </div>
                <div className="space-y-4">
                  <div className="bg-green-50 text-green-800 text-sm p-4 rounded-lg flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Password reset successful!</p>
                      <p className="mt-1">
                        Your password has been updated. Redirecting to login...
                      </p>
                    </div>
                  </div>
                  <Link href="/login">
                    <Button className="w-full h-11 btn-primary-green border-0 shadow-md">
                      Continue to Login
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              /* Form */
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold">Create New Password</h2>
                  <p className="text-muted-foreground mt-1">Enter your new password below</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="Enter new password"
                      className={`h-11 ${errors.newPassword ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                      autoComplete="new-password"
                      {...register("newPassword")}
                    />
                    {errors.newPassword && (
                      <p className="text-xs text-red-500">{errors.newPassword.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm new password"
                      className={`h-11 ${errors.confirmPassword ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                      autoComplete="new-password"
                      {...register("confirmPassword")}
                    />
                    {errors.confirmPassword && (
                      <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11 btn-primary-green border-0 shadow-md"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                        Resetting Password...
                      </span>
                    ) : (
                      "Reset Password"
                    )}
                  </Button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
