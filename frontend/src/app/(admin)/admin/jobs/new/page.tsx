"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NewJobPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the jobs page with new query param
    router.replace("/admin/jobs?new=true");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-muted-foreground text-sm">Loading...</p>
      </div>
    </div>
  );
}
