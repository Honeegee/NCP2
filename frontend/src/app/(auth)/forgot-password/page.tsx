"use client";

import { useState } from "react";
import { api, ApiError } from "@/lib/api-client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema, type ForgotPasswordData } from "@/lib/validators";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft, Mail, CheckCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [submittedEmail, setSubmittedEmail] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordData) => {
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      await api.post("/auth/forgot-password", data, { skipAuth: true });
      setSuccess(true);
      setSubmittedEmail(data.email);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "An error occurred. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex relative">
      {/* Back button - absolute upper right corner */}
      <div className="absolute top-4 right-4 z-50">
        <Link href="/login" className="flex items-center gap-2 text-emerald-700 no-underline text-sm font-semibold hover:text-emerald-900">
          <ArrowLeft className="h-4 w-4" />
          Back to Login
        </Link>
      </div>

 {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-primary relative overflow-hidden">
        {/* Background image */}
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
          {/* Logo - upper left */}
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
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl">Reset Password</CardTitle>
                <CardDescription>
                  Enter your email address and we&apos;ll send you a link to reset your password
                </CardDescription>
              </CardHeader>
              <CardContent>
                {success ? (
                  <div className="space-y-4">
                    <div className="bg-green-50 text-green-800 text-sm p-4 rounded-lg flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Check your email</p>
                        <p className="mt-1">
                          We&apos;ve sent a password reset link to <strong>{submittedEmail}</strong>.
                          The link will expire in 1 hour.
                        </p>
                      </div>
                    </div>

                    <div className="bg-blue-50 text-blue-800 text-sm p-4 rounded-lg">
                      <p className="font-medium mb-2">Next steps:</p>
                      <ol className="list-decimal list-inside space-y-1 text-blue-700">
                        <li>Check your email inbox (and spam folder)</li>
                        <li>Click the password reset link in the email</li>
                        <li>Create your new password</li>
                      </ol>
                    </div>

                    <div className="pt-4 space-y-3">
                      <p className="text-xs text-center text-muted-foreground">
                        Didn&apos;t receive an email? Check your spam folder or try again in a few minutes.
                      </p>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {error && (
                      <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg flex items-center gap-2">
                        <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {error}
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="nurse@example.com"
                          className="h-11 pl-10"
                          {...register("email")}
                        />
                      </div>
                      {errors.email && (
                        <p className="text-sm text-destructive">{errors.email.message}</p>
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
                          Sending...
                        </span>
                      ) : (
                        "Send Reset Link"
                      )}
                    </Button>

                    <div className="pt-2">
                    </div>
                  </form>
                )}
              </CardContent>
          </div>
        </div>
      </div>
    </div>
  );
}
