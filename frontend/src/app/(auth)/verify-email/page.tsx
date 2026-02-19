"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api, ApiError } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/shared/Navbar";
import { CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMessage("No verification token provided.");
      return;
    }

    async function verify() {
      try {
        await api.post("/auth/verify-email", { token });
        setStatus("success");
      } catch (err) {
        setStatus("error");
        setErrorMessage(
          err instanceof ApiError ? err.message : "Verification failed. The link may have expired."
        );
      }
    }

    verify();
  }, [token]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="flex-1 flex items-center justify-center bg-muted/30 px-3 sm:px-4">
        <div className="w-full max-w-md">
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-4 text-center">
              {status === "verifying" && (
                <div className="mx-auto mb-4">
                  <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                </div>
              )}
              {status === "success" && (
                <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              )}
              {status === "error" && (
                <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                  <XCircle className="h-8 w-8 text-red-600" />
                </div>
              )}
              <CardTitle className="text-2xl">
                {status === "verifying" && "Verifying..."}
                {status === "success" && "Email Verified!"}
                {status === "error" && "Verification Failed"}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              {status === "verifying" && (
                <p className="text-sm text-muted-foreground">Please wait while we verify your email address.</p>
              )}
              {status === "success" && (
                <>
                  <p className="text-sm text-muted-foreground">
                    Your email has been verified. You can now sign in to your account.
                  </p>
                  <Link href="/login?verified=true">
                    <Button className="w-full btn-primary-green border-0 shadow-md">
                      Sign In
                    </Button>
                  </Link>
                </>
              )}
              {status === "error" && (
                <>
                  <p className="text-sm text-muted-foreground">{errorMessage}</p>
                  <Link href="/login">
                    <Button variant="outline" className="w-full">
                      Back to Sign In
                    </Button>
                  </Link>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
