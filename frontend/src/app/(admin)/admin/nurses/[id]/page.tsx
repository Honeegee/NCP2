"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api-client";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import type { NurseFullProfile } from "@/types";
import { ProfileView } from "@/components/profile/ProfileView";

export default function AdminNurseDetail() {
  const { user } = useAuth();
  const params = useParams();
  const nurseId = params.id as string;

  const [profile, setProfile] = useState<NurseFullProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        setLoading(true);
        setError(null);

        const data = await api.get<NurseFullProfile>(`/nurses/${nurseId}`);
        setProfile(data);
      } catch (err) {
        console.error("Nurse detail fetch error:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load nurse profile"
        );
      } finally {
        setLoading(false);
      }
    }

    if (user && nurseId) {
      fetchProfile();
    }
  }, [user, nurseId]);

  const getResumeUrl = useCallback(async (resumeId: string) => {
    const data = await api.get<{ url: string; filename: string }>("/resumes/" + resumeId);
    return data;
  }, []);

  const handleViewResume = useCallback(async (resumeId: string) => {
    try {
      const { url } = await getResumeUrl(resumeId);
      window.open(url, "_blank");
    } catch {
      toast.error("Could not open resume.");
    }
  }, [getResumeUrl]);

  const handleDownloadResume = useCallback(async (resumeId: string, filename: string) => {
    try {
      const { url } = await getResumeUrl(resumeId);
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(blobUrl);
    } catch {
      toast.error("Could not download resume.");
    }
  }, [getResumeUrl]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="relative mx-auto h-12 w-12">
            <div className="absolute inset-0 rounded-full border-4 border-muted" />
            <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          </div>
          <p className="text-sm text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 pb-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <p className="font-semibold">{error || "Nurse profile not found"}</p>
            </div>
            <Link href="/admin/nurses">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Nurses
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="-mt-8 -mx-4">
      {/* Back navigation */}
      <div className="mb-2 px-3 sm:px-6 relative z-10">
        <Link
          href="/admin/nurses"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Nurses
        </Link>
      </div>

      <ProfileView
        profile={profile}
        showAdminControls={true}
        nurseId={nurseId}
        onViewResume={handleViewResume}
        onDownloadResume={handleDownloadResume}
      />
    </div>
  );
}
