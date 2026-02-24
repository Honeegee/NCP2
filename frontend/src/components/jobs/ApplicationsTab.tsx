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
  Send,
  Eye,
  ThumbsUp,
  XCircle,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ApplicationStatus, JobApplicationWithDetails } from "@/types";

// ── Status config using CSS vars ─────────────────────────────────────────────

type StatusMeta = {
  label: string;
  icon: React.ReactNode;
  pillStyle: React.CSSProperties;
  dotStyle: React.CSSProperties;
  iconWrapStyle: React.CSSProperties;
};

const STATUS_CONFIG: Record<ApplicationStatus, StatusMeta> = {
  pending: {
    label: "Pending",
    icon: <Send className="h-3.5 w-3.5" />,
    pillStyle: { background: "var(--highlight-muted)", color: "var(--warning)", borderColor: "var(--border)" },
    dotStyle: { background: "var(--warning)" },
    iconWrapStyle: { background: "var(--highlight-muted)", color: "var(--warning)" },
  },
  reviewed: {
    label: "Reviewed",
    icon: <Eye className="h-3.5 w-3.5" />,
    pillStyle: { background: "var(--secondary)", color: "var(--info)", borderColor: "var(--border)" },
    dotStyle: { background: "var(--info)" },
    iconWrapStyle: { background: "var(--secondary)", color: "var(--info)" },
  },
  accepted: {
    label: "Accepted",
    icon: <ThumbsUp className="h-3.5 w-3.5" />,
    pillStyle: { background: "var(--secondary)", color: "var(--success)", borderColor: "var(--border)" },
    dotStyle: { background: "var(--success)" },
    iconWrapStyle: { background: "var(--secondary)", color: "var(--success)" },
  },
  rejected: {
    label: "Rejected",
    icon: <XCircle className="h-3.5 w-3.5" />,
    pillStyle: { background: "color-mix(in srgb, var(--destructive) 10%, transparent)", color: "var(--destructive)", borderColor: "var(--border)" },
    dotStyle: { background: "var(--destructive)" },
    iconWrapStyle: { background: "color-mix(in srgb, var(--destructive) 10%, transparent)", color: "var(--destructive)" },
  },
};

// Pipeline order (rejected is a branch, not a step)
const PIPELINE: ApplicationStatus[] = ["pending", "reviewed", "accepted"];

// ── Helpers ──────────────────────────────────────────────────────────────────

function StatusPill({ status }: { status: ApplicationStatus }) {
  const c = STATUS_CONFIG[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[10px] font-semibold rounded-full px-2.5 py-1 border"
      style={c.pillStyle}
    >
      <span className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={c.dotStyle} />
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

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit",
  });
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface ApplicationsTabProps {
  statusFilter: "all" | ApplicationStatus;
  searchName: string;
  jobFilter: string;
}

// ── Main Component ────────────────────────────────────────────────────────────

export function ApplicationsTab({ statusFilter, searchName, jobFilter }: ApplicationsTabProps) {
  const [applications, setApplications] = useState<JobApplicationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

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

  const filteredApplications = useMemo(() => {
    if (!searchName) return applications;
    const s = searchName.toLowerCase();
    return applications.filter((app) => {
      const name = `${app.nurse?.first_name || ""} ${app.nurse?.last_name || ""}`.toLowerCase();
      return name.includes(s);
    });
  }, [applications, searchName]);

  const totalPages = Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE));

  const selectedApp = useMemo(
    () => (!selectedId ? null : applications.find((a) => a.id === selectedId) || null),
    [selectedId, applications]
  );

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

  const EmptyState = ({ full }: { full?: boolean }) => (
    <Card className="border shadow-sm">
      <CardContent className={cn("text-center", full ? "py-24" : "py-16")}>
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
  );

  return (
    <>
      {/* ── Desktop ── */}
      <div className="hidden md:flex gap-4">
        {/* Sidebar list */}
        <div className="w-[340px] flex-shrink-0 space-y-3">
          {filteredApplications.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-2">
              {filteredApplications.map((app) => (
                <Card
                  key={app.id}
                  className={cn(
                    "cursor-pointer transition-all duration-200 hover:shadow-md group border",
                    selectedId === app.id
                      ? "border-primary bg-primary/5 shadow-md ring-1 ring-primary/20"
                      : "border-border shadow-sm hover:border-primary/40 hover:bg-secondary/40"
                  )}
                  onClick={() => setSelectedId(app.id)}
                >
                  <CardContent className="py-3.5 px-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1 space-y-1">
                        <h3 className={cn(
                          "font-semibold text-sm leading-snug transition-colors",
                          selectedId === app.id ? "text-primary" : "text-foreground group-hover:text-primary"
                        )}>
                          {app.nurse ? `${app.nurse.first_name} ${app.nurse.last_name}` : "Unknown Nurse"}
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

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-1 pt-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-4 w-4" /> Prev
              </button>
              <span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Detail panel */}
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
                  <p className="text-sm text-muted-foreground">Select an application to view details</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* ── Mobile ── */}
      <div className="md:hidden space-y-3 mb-16">
        {filteredApplications.length === 0 ? (
          <EmptyState />
        ) : (
          filteredApplications.map((app) => (
            <Card key={app.id} className="border shadow-sm rounded-xl">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1 space-y-1">
                    <h3 className="font-semibold text-sm">
                      {app.nurse ? `${app.nurse.first_name} ${app.nurse.last_name}` : "Unknown Nurse"}
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

// ── Detail Panel ──────────────────────────────────────────────────────────────

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

  const isRejected = app.status === "rejected";
  const currentPipelineIdx = PIPELINE.indexOf(app.status);

  // Build timeline events from available data
  const timelineEvents: { label: string; sublabel?: string; date: string; status: ApplicationStatus; done: boolean }[] = [
    {
      label: "Application Submitted",
      sublabel: "Nurse submitted their application",
      date: app.applied_at,
      status: "pending",
      done: true,
    },
    {
      label: "Under Review",
      sublabel: "Application being reviewed by recruiter",
      date: app.updated_at && app.status !== "pending" ? app.updated_at : "",
      status: "reviewed",
      done: currentPipelineIdx >= 1 || isRejected,
    },
    ...(isRejected
      ? [{
          label: "Application Rejected",
          sublabel: "This application was not moved forward",
          date: app.updated_at || "",
          status: "rejected" as ApplicationStatus,
          done: true,
        }]
      : [{
          label: "Accepted",
          sublabel: "Candidate selected for the position",
          date: app.status === "accepted" ? app.updated_at || "" : "",
          status: "accepted" as ApplicationStatus,
          done: app.status === "accepted",
        }]
    ),
  ];

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
                  Applied {formatDate(app.applied_at)}
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
              <h3 className="font-semibold text-base mb-2" style={{ color: "var(--foreground)" }}>Applied For</h3>
              <div className="rounded-xl px-4 py-3 space-y-2"
                style={{ background: "var(--muted)", border: "1px solid var(--border)" }}>
                <p className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>{app.job.title}</p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm" style={{ color: "var(--muted-foreground)" }}>
                  <span className="flex items-center gap-1.5">
                    <Building className="h-4 w-4" />{app.job.facility_name}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" />{app.job.location}
                  </span>
                  <span className="flex items-center gap-1.5 capitalize">
                    <Briefcase className="h-4 w-4" />{app.job.employment_type}
                  </span>
                </div>
              </div>
            </div>
          )}

          <Separator />

          {/* Update Status */}
          <div>
            <h3 className="font-semibold text-base mb-3" style={{ color: "var(--foreground)" }}>Update Status</h3>
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
                  <><Loader2 className="h-4 w-4 animate-spin mr-1.5" />Updating...</>
                ) : (
                  "Update"
                )}
              </Button>
            </div>
            {newStatus && newStatus !== app.status && (
              <p className="text-xs mt-2" style={{ color: "var(--muted-foreground)" }}>
                Will change from{" "}
                <span className="font-semibold">{STATUS_CONFIG[app.status].label}</span>
                {" → "}
                <span className="font-semibold">{STATUS_CONFIG[newStatus as ApplicationStatus]?.label}</span>
              </p>
            )}
          </div>

          <Separator />

          {/* ── Enhanced Timeline ── */}
          <div>
            <h3 className="font-semibold text-base mb-4" style={{ color: "var(--foreground)" }}>
              Application Timeline
            </h3>

            {/* Pipeline progress bar (only for non-rejected) */}
            {!isRejected && (
              <div className="mb-5 px-1">
                <div className="flex items-center justify-between mb-2">
                  {PIPELINE.map((step, idx) => {
                    const isDone = currentPipelineIdx >= idx;
                    const isCurrent = currentPipelineIdx === idx;
                    const cfg = STATUS_CONFIG[step];
                    return (
                      <div key={step} className="flex items-center flex-1">
                        {/* Node */}
                        <div className="flex flex-col items-center gap-1 relative z-10">
                          <div
                            className="h-8 w-8 rounded-full flex items-center justify-center border-2 transition-all"
                            style={isDone
                              ? { ...cfg.iconWrapStyle, borderColor: "transparent", boxShadow: isCurrent ? `0 0 0 3px color-mix(in srgb, currentColor 20%, transparent)` : "none" }
                              : { background: "var(--muted)", borderColor: "var(--border)", color: "var(--muted-foreground)" }
                            }
                          >
                            {isDone
                              ? (isCurrent ? cfg.icon : <CheckCircle2 className="h-4 w-4" />)
                              : cfg.icon
                            }
                          </div>
                          <span
                            className="text-[10px] font-medium whitespace-nowrap"
                            style={{ color: isDone ? "var(--foreground)" : "var(--muted-foreground)" }}
                          >
                            {cfg.label}
                          </span>
                        </div>
                        {/* Connector line between nodes */}
                        {idx < PIPELINE.length - 1 && (
                          <div className="flex-1 h-0.5 mx-1 mb-4 rounded-full transition-all"
                            style={{
                              background: currentPipelineIdx > idx
                                ? "var(--success)"
                                : "var(--border)",
                            }}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Rejected banner */}
            {isRejected && (
              <div
                className="flex items-center gap-3 rounded-xl px-4 py-3 mb-4"
                style={{
                  background: "color-mix(in srgb, var(--destructive) 8%, transparent)",
                  border: "1px solid color-mix(in srgb, var(--destructive) 20%, transparent)",
                }}
              >
                <XCircle className="h-5 w-5 flex-shrink-0" style={{ color: "var(--destructive)" }} />
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--destructive)" }}>Application Not Progressed</p>
                  <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                    This application was marked as rejected
                    {app.updated_at ? ` on ${formatDate(app.updated_at)}` : ""}.
                  </p>
                </div>
              </div>
            )}

            {/* Vertical event log */}
            <div className="relative">
              {/* Vertical line */}
              <div
                className="absolute left-4 top-4 bottom-4 w-px"
                style={{ background: "var(--border)" }}
              />

              <div className="space-y-0">
                {timelineEvents.map((event, idx) => {
                  const cfg = STATUS_CONFIG[event.status];
                  const isLast = idx === timelineEvents.length - 1;

                  return (
                    <div key={idx} className="relative flex gap-4 pb-5 last:pb-0">
                      {/* Icon node */}
                      <div
                        className="relative z-10 h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all"
                        style={event.done
                          ? { ...cfg.iconWrapStyle, borderColor: "transparent" }
                          : { background: "var(--background)", borderColor: "var(--border)", color: "var(--muted-foreground)" }
                        }
                      >
                        {event.done ? cfg.icon : <div className="h-2 w-2 rounded-full" style={{ background: "var(--border)" }} />}
                      </div>

                      {/* Content */}
                      <div className={cn("flex-1 min-w-0 pt-1", !isLast && "pb-1")}>
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <div>
                            <p
                              className="text-sm font-semibold leading-snug"
                              style={{ color: event.done ? "var(--foreground)" : "var(--muted-foreground)" }}
                            >
                              {event.label}
                            </p>
                            {event.sublabel && (
                              <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                                {event.sublabel}
                              </p>
                            )}
                          </div>
                          {event.done && event.date ? (
                            <span
                              className="text-xs rounded-lg px-2 py-1 flex-shrink-0 font-medium"
                              style={{
                                background: "var(--muted)",
                                color: "var(--muted-foreground)",
                              }}
                            >
                              {formatDateTime(event.date)}
                            </span>
                          ) : !event.done ? (
                            <span
                              className="text-xs rounded-lg px-2 py-1 flex-shrink-0"
                              style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}
                            >
                              Pending
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}