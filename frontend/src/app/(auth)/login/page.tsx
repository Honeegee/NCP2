"use client";

import { Suspense, useState, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api-client";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { toast } from "sonner";
import { CheckCircle, Mail, ArrowLeft } from "lucide-react";
import { SSOButtons } from "@/components/sso/SSOButtons";

const WEAK_PASSWORDS = [
  "password", "password123", "12345678", "123456789", "1234567890",
  "qwerty", "qwerty123", "admin", "admin123", "letmein", "welcome",
  "monkey", "dragon", "baseball", "football", "superman", "iloveyou",
];

function validatePassword(pw: string) {
  return {
    minLength: pw.length >= 8,
    maxLength: pw.length <= 128,
    lowercase: /[a-z]/.test(pw),
    uppercase: /[A-Z]/.test(pw),
    number: /\d/.test(pw),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pw),
    noRepeat: !/(.)\1\1\1/.test(pw),
    notWeak: !WEAK_PASSWORDS.includes(pw.toLowerCase()),
  };
}

function isPasswordValid(rules: ReturnType<typeof validatePassword>) {
  return Object.values(rules).every(Boolean);
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    }>
      <UnifiedAuthForm />
    </Suspense>
  );
}

function UnifiedAuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const verified = searchParams.get("verified") === "true";
  const { login } = useAuth();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showVerify, setShowVerify] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string; confirmPassword?: string }>({});
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean; confirmPassword?: boolean }>({});

  const passwordRules = useMemo(() => validatePassword(password), [password]);
  const passwordsMatch = password === confirmPassword;

  const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const validateField = (field: string, value: string) => {
    const errors = { ...fieldErrors };
    if (field === "email") {
      if (!value.trim()) errors.email = "Email is required";
      else if (!isValidEmail(value.trim())) errors.email = "Please enter a valid email address";
      else delete errors.email;
    }
    if (field === "password") {
      if (!value) errors.password = "Password is required";
      else delete errors.password;
    }
    if (field === "confirmPassword") {
      if (mode === "signup" && !value) errors.confirmPassword = "Please confirm your password";
      else if (mode === "signup" && value !== password) errors.confirmPassword = "Passwords do not match";
      else delete errors.confirmPassword;
    }
    setFieldErrors(errors);
  };

  const handleBlur = (field: "email" | "password" | "confirmPassword") => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const value = field === "email" ? email : field === "password" ? password : confirmPassword;
    validateField(field, value);
  };

  const validateAll = (): boolean => {
    const errors: { email?: string; password?: string; confirmPassword?: string } = {};
    if (!email.trim()) errors.email = "Email is required";
    else if (!isValidEmail(email.trim())) errors.email = "Please enter a valid email address";
    if (!password) errors.password = "Password is required";
    if (mode === "signup") {
      if (!confirmPassword) errors.confirmPassword = "Please confirm your password";
      else if (!passwordsMatch) errors.confirmPassword = "Passwords do not match";
    }
    setFieldErrors(errors);
    setTouched({ email: true, password: true, confirmPassword: true });
    return Object.keys(errors).length === 0;
  };

  const handleSignIn = async () => {
    if (!validateAll()) return;
    setLoading(true);
    try {
      const { role, isNewUser } = await login(email.trim(), password);
      const destination = callbackUrl || (role === "admin" ? "/admin" : isNewUser ? "/profile?tour=welcome" : "/dashboard");
      router.push(destination);
      router.refresh();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Something went wrong";
      if (message.includes("verify your email")) {
        setShowVerify(true);
      } else {
        toast.error(message);
      }
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!validateAll()) return;
    if (!isPasswordValid(passwordRules)) {
      toast.error("Please fix the password requirements below.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/register", {
        email: email.trim(),
        password,
      });
      setShowVerify(true);
    } catch (regErr) {
      const regMessage = regErr instanceof ApiError ? regErr.message : "Something went wrong";
      toast.error(regMessage);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "signin") {
      await handleSignIn();
    } else {
      await handleSignUp();
    }
  };

  const handleResendVerification = async () => {
    setLoading(true);
    try {
      await api.post("/auth/resend-verification", { email: email.trim() });
      toast.success("Verification email sent! Check your inbox.");
    } catch {
      toast.error("Failed to resend verification email");
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode: "signin" | "signup") => {
    setMode(newMode);
    setConfirmPassword("");
    setFieldErrors({});
    setTouched({});
  };

  return (
    <div className="min-h-screen flex relative">
      {/* Back button - absolute upper right corner */}
      <div className="absolute top-4 right-4 z-50">
        <Link href="/" className="flex items-center gap-2 text-emerald-700 no-underline text-sm font-semibold hover:text-emerald-900">
          <ArrowLeft className="h-4 w-4" />
          Back to home
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

            {/* Verified success banner */}
            {verified && !showVerify && (
              <div className="mb-6 flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 p-3">
                <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                <p className="text-sm text-green-700">Email verified successfully! You can now sign in.</p>
              </div>
            )}

            {showVerify ? (
              /* ========== VERIFY EMAIL ========== */
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold">Check Your Email</h2>
                  <p className="text-muted-foreground mt-1">We sent a verification link to {email}</p>
                </div>
                <div className="text-center space-y-4">
                  <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Mail className="h-8 w-8 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Click the verification link in the email to activate your account. The link expires in 24 hours.
                  </p>
                  <div className="pt-2 space-y-3">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleResendVerification}
                      disabled={loading}
                    >
                      {loading ? "Sending..." : "Resend Verification Email"}
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full"
                      onClick={() => setShowVerify(false)}
                    >
                      Back
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              /* ========== MAIN FORM ========== */
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold">
                    {mode === "signin" ? "Welcome Back" : "Create Account"}
                  </h2>
                  <p className="text-muted-foreground mt-1">
                    {mode === "signin"
                      ? "Sign in to your account"
                      : "Sign up to get started"
                    }
                  </p>
                </div>

                {/* Email + Password form */}
                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="nurse@example.com"
                      className={`h-11 ${touched.email && fieldErrors.email ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                      autoComplete="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (touched.email) validateField("email", e.target.value);
                      }}
                      onBlur={() => handleBlur("email")}
                    />
                    {touched.email && fieldErrors.email && (
                      <p className="text-xs text-red-500">{fieldErrors.email}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      {mode === "signin" && (
                        <Link
                          href="/forgot-password"
                          className="text-sm text-primary hover:underline"
                        >
                          Forgot password?
                        </Link>
                      )}
                    </div>
                    <Input
                      id="password"
                      type="password"
                      placeholder={mode === "signin" ? "Enter your password" : "Create a password"}
                      className={`h-11 ${touched.password && fieldErrors.password ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                      autoComplete={mode === "signin" ? "current-password" : "new-password"}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (touched.password) validateField("password", e.target.value);
                      }}
                      onBlur={() => handleBlur("password")}
                    />
                    {touched.password && fieldErrors.password && (
                      <p className="text-xs text-red-500">{fieldErrors.password}</p>
                    )}
                    {mode === "signup" && password.length > 0 && !isPasswordValid(passwordRules) && (
                      <p className="text-xs text-red-500">
                        {!passwordRules.minLength ? "Must be at least 8 characters" :
                         !passwordRules.uppercase ? "Must include an uppercase letter" :
                         !passwordRules.lowercase ? "Must include a lowercase letter" :
                         !passwordRules.number ? "Must include a number" :
                         !passwordRules.special ? "Must include a special character (!@#$%...)" :
                         !passwordRules.noRepeat ? "Cannot have 4+ repeated characters" :
                         !passwordRules.notWeak ? "Password is too common" : ""}
                      </p>
                    )}
                  </div>

                  {/* Confirm Password - sign up only */}
                  {mode === "signup" && (
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Confirm your password"
                        className={`h-11 ${touched.confirmPassword && fieldErrors.confirmPassword ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          if (touched.confirmPassword) validateField("confirmPassword", e.target.value);
                        }}
                        onBlur={() => handleBlur("confirmPassword")}
                      />
                      {touched.confirmPassword && fieldErrors.confirmPassword && (
                        <p className="text-xs text-red-500">{fieldErrors.confirmPassword}</p>
                      )}
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-11 btn-primary-green border-0 shadow-md"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                        Please wait...
                      </span>
                    ) : mode === "signin" ? (
                      "Sign In"
                    ) : (
                      "Create Account"
                    )}
                  </Button>

                  <p className="text-sm text-center text-muted-foreground">
                    {mode === "signin" ? (
                      <>
                        Don&apos;t have an account?{" "}
                        <button type="button" onClick={() => switchMode("signup")} className="text-primary hover:underline font-medium">
                          Sign Up
                        </button>
                      </>
                    ) : (
                      <>
                        Already have an account?{" "}
                        <button type="button" onClick={() => switchMode("signin")} className="text-primary hover:underline font-medium">
                          Sign In
                        </button>
                      </>
                    )}
                  </p>
                </form>

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">or</span>
                  </div>
                </div>

                {/* SSO Buttons */}
                <SSOButtons />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}