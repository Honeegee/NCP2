"use client";

import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import { api, fetchPaginated } from "@/lib/api-client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectOption } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Briefcase,
  Building,
  MapPin,
  CalendarDays,
  Clock,
  ChevronLeft,
  ChevronRight,
  Loader2,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ApplicationStatus, JobApplicationWithDetails } from "@/types";

const STATUS_CONFIG: Record<
  ApplicationStatus,
  { label: string; dot: string; bg: string; text: string; border: string }
> = {
  pending: {
    label: "Pending",
    dot: "bg-yellow-400",
    bg: "bg-yellow-50",
    text: "text-yellow-700",
    border: "border-yellow-200",
  },
  reviewed: {
    label: "Reviewed",
    dot: "bg-blue-400",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
  },
  accepted: {
    label: "Accepted",
    dot: "bg-green-500",
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
  },
  rejected: {
    label: "Rejected",
    dot: "bg-red-400",
    bg: "bg-red-50",
    text: "text-red-600",
    border: "border-red-200",
  },
};

function StatusPill({ status }: { status: ApplicationStatus }) {
  const c = STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[10px] font-medium rounded-full px-2 py-0.5 border",
        c.bg, c.text, c.border
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full flex-shrink-0", c.dot)} />
      {c.label}
    </span>
  );
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

interface ApplicationsTabProps {
  statusFilter: "all" | ApplicationStatus;
  searchName: string;
  jobFilter: string;
}

export function ApplicationsTab({
  statusFilter,
  searchName,
  jobFilter,
}: ApplicationsTabProps) {
  const [applications, setApplications] = useState<JobApplicationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 15;

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<ApplicationStatus | "">("");
  const [updating, setUpdating] = useState(false);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const params: Record<string, string | number> = { page, limit: ITEMS_PER_PAGE };
      if (statusFilter !== "all") params.status = statusFilter;
      if (jobFilter) params.job_id = jobFilter;
      const res = await fetchPaginated<JobApplicationWithDetails>("/applications", params);
      setApplications(res.data || []);
      setTotalCount(res.meta?.total || 0);
    } catch (err) {
      console.error("Failed to load applications:", err);
      toast.error("Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchApplications(); }, [page, statusFilter, jobFilter]);
  useEffect(() => { setPage(1); }, [statusFilter, jobFilter, searchName]);

  // Client-side name search (API doesn't support name search)
  const filteredApplications = useMemo(() => {
    if (!searchName) return applications;
    const s = searchName.toLowerCase();
    return applications.filter((app) => {
      const name = `${app.nurse?.first_name || ""} ${app.nurse?.last_name || ""}`.toLowerCase();
      return name.includes(s);
    });
  }, [applications, searchName]);

  const totalPages = Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE));

  const selectedApp = useMemo(() => {
    if (!selectedId) return null;
    return applications.find((a) => a.id === selectedId) || null;
  }, [selectedId, applications]);

  useEffect(() => {
    if (filteredApplications.length > 0 && !filteredApplications.find((a) => a.id === selectedId)) {
      setSelectedId(filteredApplications[0].id);
    }
  }, [filteredApplications, selectedId]);

  useEffect(() => {
    if (selectedApp) setNewStatus(selectedApp.status);
  }, [selectedApp]);

  const handleUpdateStatus = async () => {
    if (!selectedApp || !newStatus || newStatus === selectedApp.status) return;
    setUpdating(true);
    try {
      await api.put(`/applications/${selectedApp.id}/status`, { status: newStatus });
      toast.success("Status updated", {
        description: `${selectedApp.nurse?.first_name || "Applicant"}'s application is now "${STATUS_CONFIG[newStatus].label}".`,
      });
      await fetchApplications();
    } catch (err) {
      toast.error("Failed to update status", {
        description: err instanceof Error ? err.message : "Something went wrong",
      });
    } finally {
      setUpdating(false);
    }
  };

  if (loading && applications.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground text-sm">Loading applications...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ── Desktop: Sidebar + Detail ── */}
      <div className="hidden md:flex gap-4">

        {/* Sidebar */}
        <div className="w-[340px] flex-shrink-0 space-y-3">
          {filteredApplications.length === 0 ? (
            <Card className="border shadow-sm">
              <CardContent className="py-16 text-center">
                <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-7 w-7 text-muted-foreground" />
                </div>
                <p className="font-medium text-sm mb-1">
                  {totalCount === 0 ? "No applications yet" : "No applications match your filters"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {totalCount === 0
                    ? "Applications will appear here when nurses apply to jobs."
                    : "Try adjusting your filters."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {filteredApplications.map((app) => (
                <Card
                  key={app.id}
                  className={cn(
                    "cursor-pointer transition-all duration-200 hover:shadow-md group",
                    "border hover:border-primary/40",
                    selectedId === app.id
                      ? "border-primary bg-primary/5 shadow-md ring-1 ring-primary/20"
                      : "border-border shadow-sm hover:bg-secondary/40"
                  )}
                  onClick={() => setSelectedId(app.id)}
                >
                  <CardContent className="py-3.5 px-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1 space-y-1">
                        <h3 className={cn(
                          "font-semibold text-sm leading-snug",
                          selectedId === app.id
                            ? "text-primary"
                            : "text-foreground group-hover:text-primary transition-colors"
                        )}>
                          {app.nurse
                            ? `${app.nurse.first_name} ${app.nurse.last_name}`
                            : "Unknown Nurse"}
                        </h3>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Briefcase className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{app.job?.title || "Unknown Job"}</span>
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3 flex-shrink-0" />
                          Applied {timeAgo(app.applied_at)}
                        </p>
                      </div>
                      <div className="flex-shrink-0 pt-0.5">
                        <StatusPill status={app.status} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-1 pt-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                Prev
              </button>
              <span className="text-xs text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Detail Panel — sticky child sticks within flex stretch */}
        <div className="flex-1 min-w-0">
          {selectedApp ? (
            <ApplicationDetailPanel
              app={selectedApp}
              newStatus={newStatus}
              onStatusChange={setNewStatus}
              onUpdateStatus={handleUpdateStatus}
              updating={updating}
            />
          ) : (
            <Card className="border shadow-sm">
              <CardContent className="py-24 flex items-center justify-center">
                <div className="text-center">
                  <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3">
                    <FileText className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Select an application to view details
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* ── Mobile: Card list ── */}
      <div className="md:hidden space-y-3 mb-16">
        {filteredApplications.length === 0 ? (
          <Card className="border shadow-sm">
            <CardContent className="py-16 text-center">
              <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                <FileText className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="font-medium text-sm mb-1">
                {totalCount === 0 ? "No applications yet" : "No applications match your filters"}
              </p>
              <p className="text-xs text-muted-foreground">
                {totalCount === 0
                  ? "Applications will appear here when nurses apply to jobs."
                  : "Try adjusting your filters."}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredApplications.map((app) => (
            <Card key={app.id} className="border shadow-sm rounded-xl">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1 space-y-1">
                    <h3 className="font-semibold text-sm">
                      {app.nurse
                        ? `${app.nurse.first_name} ${app.nurse.last_name}`
                        : "Unknown Nurse"}
                    </h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Briefcase className="h-3 w-3" />
                      <span className="truncate">{app.job?.title || "Unknown Job"}</span>
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Applied {timeAgo(app.applied_at)}
                    </p>
                  </div>
                  <StatusPill status={app.status} />
                </div>
                <Select
                  value={app.status}
                  onChange={async (e) => {
                    const status = e.target.value as ApplicationStatus;
                    if (status === app.status) return;
                    try {
                      await api.put(`/applications/${app.id}/status`, { status });
                      toast.success("Status updated");
                      fetchApplications();
                    } catch {
                      toast.error("Failed to update status");
                    }
                  }}
                  className="h-8 text-sm w-full"
                >
                  <SelectOption value="pending">Pending</SelectOption>
                  <SelectOption value="reviewed">Reviewed</SelectOption>
                  <SelectOption value="accepted">Accepted</SelectOption>
                  <SelectOption value="rejected">Rejected</SelectOption>
                </Select>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </>
  );
}

/* ── Detail Panel ── */

function ApplicationDetailPanel({
  app,
  newStatus,
  onStatusChange,
  onUpdateStatus,
  updating,
}: {
  app: JobApplicationWithDetails;
  newStatus: ApplicationStatus | "";
  onStatusChange: (s: ApplicationStatus | "") => void;
  onUpdateStatus: () => void;
  updating: boolean;
}) {
  const nurseName = app.nurse
    ? `${app.nurse.first_name} ${app.nurse.last_name}`
    : "Unknown Nurse";

  return (
    <div className="sticky top-20">
      <Card className="border shadow-sm max-h-[calc(100vh-6rem)] overflow-y-auto">
        <CardContent className="py-5 space-y-5">

          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <User className="h-5 w-5 text-muted-foreground" />
                {nurseName}
              </h2>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4" />
                  Applied {new Date(app.applied_at).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  {timeAgo(app.applied_at)}
                </span>
              </div>
            </div>
            <StatusPill status={app.status} />
          </div>

          <Separator />

          {/* Applied For */}
          {app.job && (
            <div>
              <h3 className="font-semibold text-lg mb-2">Applied For</h3>
              <div className="rounded-lg bg-muted/50 border border-border px-4 py-3 space-y-2">
                <p className="font-semibold text-sm">{app.job.title}</p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Building className="h-4 w-4" />
                    {app.job.facility_name}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" />
                    {app.job.location}
                  </span>
                  <span className="flex items-center gap-1.5 capitalize">
                    <Briefcase className="h-4 w-4" />
                    {app.job.employment_type}
                  </span>
                </div>
              </div>
            </div>
          )}

          <Separator />

          {/* Update Status */}
          <div>
            <h3 className="font-semibold text-lg mb-2">Update Status</h3>
            <div className="flex items-center gap-3">
              <Select
                value={newStatus}
                onChange={(e) => onStatusChange(e.target.value as ApplicationStatus)}
                className="flex-1"
              >
                <SelectOption value="pending">Pending</SelectOption>
                <SelectOption value="reviewed">Reviewed</SelectOption>
                <SelectOption value="accepted">Accepted</SelectOption>
                <SelectOption value="rejected">Rejected</SelectOption>
              </Select>
              <Button
                className="btn-primary-green border-0"
                onClick={onUpdateStatus}
                disabled={updating || !newStatus || newStatus === app.status}
              >
                {updating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                    Updating...
                  </>
                ) : (
                  "Update"
                )}
              </Button>
            </div>
            {newStatus && newStatus !== app.status && (
              <p className="text-xs text-muted-foreground mt-2">
                Will change from{" "}
                <span className="font-medium">{STATUS_CONFIG[app.status].label}</span>
                {" "}to{" "}
                <span className="font-medium">{STATUS_CONFIG[newStatus].label}</span>
              </p>
            )}
          </div>

          <Separator />

          {/* Timeline */}
          <div>
            <h3 className="font-semibold text-lg mb-2">Timeline</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">Application Submitted</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(app.applied_at).toLocaleString()}
                  </p>
                </div>
              </div>
              {app.updated_at && app.updated_at !== app.applied_at && (
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      Status Updated to {STATUS_CONFIG[app.status].label}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(app.updated_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
