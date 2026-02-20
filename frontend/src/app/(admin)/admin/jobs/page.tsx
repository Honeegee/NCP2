"use client";

import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api-client";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectOption } from "@/components/ui/select";
import {
  Briefcase,
  Plus,
  Search,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Building,
  Clock,
  DollarSign,
  Upload,
  Sparkles,
} from "lucide-react";
import { JobSidebar } from "@/components/jobs/JobSidebar";
import { JobDetailPanel } from "@/components/jobs/JobDetailPanel";
import { JobFormDialog } from "@/components/jobs/JobFormDialog";
import { BulkUploadDialog } from "@/components/jobs/BulkUploadDialog";
import { ApplicationsTab } from "@/components/jobs/ApplicationsTab";
import { fetchPaginated } from "@/lib/api-client";
import type { Job, JobMatch, JobApplicationWithDetails } from "@/types";
import { cn } from "@/lib/utils";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
function isNewJob(createdAt: string): boolean {
  return Date.now() - new Date(createdAt).getTime() < SEVEN_DAYS_MS;
}

export default function AdminJobManagement() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"jobs" | "applications">("jobs");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Job filters
  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  // Application filters
  const [appStatusFilter, setAppStatusFilter] = useState<"all" | "pending" | "reviewed" | "accepted" | "rejected">("all");
  const [appSearchName, setAppSearchName] = useState("");
  const [appJobFilter, setAppJobFilter] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

  // Dialogs
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);

  // Application counts per job
  const [appCounts, setAppCounts] = useState<Record<string, number>>({});

  // Mobile detail view
  const [showMobileDetail, setShowMobileDetail] = useState(false);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get<Job[]>("/jobs?include_inactive=true");
      setJobs(data || []);
    } catch (err) {
      console.error("Jobs fetch error:", err);
      setError(err instanceof Error ? err.message : "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  const fetchAppCounts = async () => {
    try {
      const res = await fetchPaginated<JobApplicationWithDetails>("/applications", { limit: 500 });
      const counts: Record<string, number> = {};
      for (const app of res.data) {
        counts[app.job_id] = (counts[app.job_id] || 0) + 1;
      }
      setAppCounts(counts);
    } catch {
      // Non-critical
    }
  };

  useEffect(() => {
    if (user) {
      fetchJobs();
      fetchAppCounts();
    }
  }, [user]);

  const sidebarItems: JobMatch[] = useMemo(() => {
    let filtered = jobs;
    if (statusFilter === "active") filtered = filtered.filter((j) => j.is_active);
    if (statusFilter === "inactive") filtered = filtered.filter((j) => !j.is_active);
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(
        (j) =>
          j.title.toLowerCase().includes(s) ||
          j.facility_name.toLowerCase().includes(s) ||
          j.description.toLowerCase().includes(s)
      );
    }
    if (locationFilter) {
      filtered = filtered.filter((j) =>
        j.location.toLowerCase().includes(locationFilter.toLowerCase())
      );
    }
    if (typeFilter) {
      filtered = filtered.filter((j) => j.employment_type === typeFilter);
    }

    filtered.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return filtered.map((job) => ({
      job,
      match_score: 0,
      matched_certifications: [],
      matched_skills: [],
      experience_match: false,
    }));
  }, [jobs, search, locationFilter, typeFilter, statusFilter]);

  useEffect(() => { setPage(1); }, [search, locationFilter, typeFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(sidebarItems.length / ITEMS_PER_PAGE));
  const paginatedItems = sidebarItems.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  useEffect(() => {
    if (
      paginatedItems.length > 0 &&
      !paginatedItems.find((m) => m.job.id === selectedJobId)
    ) {
      setSelectedJobId(paginatedItems[0].job.id);
    }
  }, [paginatedItems, selectedJobId]);

  const selectedJobMatch = useMemo(() => {
    if (!selectedJobId) return null;
    return sidebarItems.find((m) => m.job.id === selectedJobId) || null;
  }, [selectedJobId, sidebarItems]);

  const handleEdit = (job: Job) => { setEditingJob(job); setFormDialogOpen(true); };
  const handleCreate = () => { setEditingJob(null); setFormDialogOpen(true); };

  const handleToggleActive = async (job: Job) => {
    const action = job.is_active ? "deactivate" : "reactivate";
    if (!confirm(`Are you sure you want to ${action} "${job.title}"?`)) return;
    setActionLoading(true);
    try {
      if (job.is_active) {
        await api.delete(`/jobs/${job.id}`);
        toast.success("Job deactivated", {
          description: `"${job.title}" is no longer visible to nurses.`,
        });
      } else {
        await api.put(`/jobs/${job.id}`, { is_active: true });
        toast.success("Job reactivated", {
          description: `"${job.title}" is now active.`,
        });
      }
      await fetchJobs();
    } catch (err) {
      toast.error(`Failed to ${action} job`, {
        description: err instanceof Error ? err.message : "Something went wrong",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (job: Job) => {
    if (!confirm(`Permanently delete "${job.title}"? This cannot be undone.`)) return;
    setActionLoading(true);
    try {
      await api.delete(`/jobs/${job.id}/permanent`);
      toast.success("Job deleted", {
        description: `"${job.title}" has been permanently removed.`,
      });
      setSelectedJobId(null);
      await fetchJobs();
    } catch (err) {
      toast.error("Failed to delete job", {
        description: err instanceof Error ? err.message : "Something went wrong",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleFormSuccess = () => { fetchJobs(); fetchAppCounts(); };
  const handleMobileSelect = (id: string) => { setSelectedJobId(id); setShowMobileDetail(true); };
  const clearFilters = () => {
    setSearch("");
    setLocationFilter("");
    setTypeFilter("");
    setStatusFilter("all");
  };

  // Derived stats
  const totalJobs = jobs.length;
  const activeJobs = jobs.filter((j) => j.is_active).length;
  const inactiveJobs = jobs.filter((j) => !j.is_active).length;
  const locations = [...new Set(jobs.map((j) => j.location))];
  const types = [...new Set(jobs.map((j) => j.employment_type))];
  const hasActiveFilters =
    search !== "" || locationFilter !== "" || typeFilter !== "" || statusFilter !== "all";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground text-sm">Loading jobs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Briefcase className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-destructive font-medium mb-3">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchJobs}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in pb-16">

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold">Job Management</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage jobs and applications</p>
        </div>
        <div className="flex items-center gap-2 sm:ml-auto flex-wrap">
          <Link href="/admin">
            <Button variant="outline" size="sm">Back to Dashboard</Button>
          </Link>
          {activeTab === "jobs" && (
            <>
              <Button size="sm" variant="outline" onClick={() => setBulkUploadOpen(true)}>
                <Upload className="h-4 w-4 mr-1.5" />
                Bulk Upload
              </Button>
              <Button size="sm" className="btn-primary-green border-0" onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-1.5" />
                Create New Job
              </Button>
            </>
          )}
        </div>
      </div>

      {/* ── Single-row: Tabs + Filters ── */}
      <div className="flex flex-wrap items-center gap-2">

        {/* Tab switcher */}
        <div className="flex gap-1 p-1 bg-muted rounded-xl flex-shrink-0">
          {(["jobs", "applications"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                if (tab === "applications") {
                  setAppJobFilter("");
                  setAppStatusFilter("all");
                  setAppSearchName("");
                }
                setActiveTab(tab);
              }}
              className={cn(
                "px-4 py-1.5 rounded-lg text-sm font-medium transition-all capitalize",
                activeTab === tab
                  ? "bg-white text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Everything after the tabs is pushed to the right */}
        <div className="flex flex-wrap items-center gap-2 ml-auto">

        {/* Status pills — jobs tab only */}
        {activeTab === "jobs" && (
          <div className="flex gap-1 p-1 bg-muted rounded-xl flex-shrink-0">
            {(["all", "active", "inactive"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                  statusFilter === s
                    ? "bg-white text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {s === "all"
                  ? `All (${totalJobs})`
                  : s === "active"
                  ? `Active (${activeJobs})`
                  : `Inactive (${inactiveJobs})`}
              </button>
            ))}
          </div>
        )}

        {/* Search — jobs tab only */}
        {activeTab === "jobs" && (
          <div className="relative flex-shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search jobs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 w-48"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
              </button>
            )}
          </div>
        )}

        {/* Location + Type dropdowns — jobs tab only */}
        {activeTab === "jobs" && (
          <>
            <Select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="h-9 w-40 flex-shrink-0"
            >
              <SelectOption value="">All Locations</SelectOption>
              {locations.map((loc) => (
                <SelectOption key={loc} value={loc}>{loc}</SelectOption>
              ))}
            </Select>

            <Select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-9 w-36 flex-shrink-0"
            >
              <SelectOption value="">All Types</SelectOption>
              {types.map((type) => (
                <SelectOption key={type} value={type}>{type}</SelectOption>
              ))}
            </Select>
          </>
        )}

        {/* Application filters — applications tab only */}
        {activeTab === "applications" && (
          <>
            <Select
              value={appStatusFilter}
              onChange={(e) => setAppStatusFilter(e.target.value as typeof appStatusFilter)}
              className="h-9 w-40 flex-shrink-0"
            >
              <SelectOption value="all">All Statuses</SelectOption>
              <SelectOption value="pending">Pending</SelectOption>
              <SelectOption value="reviewed">Reviewed</SelectOption>
              <SelectOption value="accepted">Accepted</SelectOption>
              <SelectOption value="rejected">Rejected</SelectOption>
            </Select>

            <div className="relative flex-shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search nurse name..."
                value={appSearchName}
                onChange={(e) => setAppSearchName(e.target.value)}
                className="pl-9 h-9 w-48"
              />
            </div>

            <Select
              value={appJobFilter}
              onChange={(e) => setAppJobFilter(e.target.value)}
              className="h-9 w-52 flex-shrink-0"
            >
              <SelectOption value="">All Jobs</SelectOption>
              {jobs.map((job) => (
                <SelectOption key={job.id} value={job.id}>{job.title}</SelectOption>
              ))}
            </Select>
          </>
        )}

        </div> {/* end right-side wrapper */}
      </div>

      {/* ── Tab Content ── */}
      {activeTab === "applications" ? (
        <ApplicationsTab
          statusFilter={appStatusFilter}
          searchName={appSearchName}
          jobFilter={appJobFilter}
        />
      ) : (
        <>
          {/* Desktop: Sidebar + Detail */}
          <div className="hidden md:flex gap-4">

            {/* Sidebar column */}
            <div className="w-[340px] flex-shrink-0 space-y-3">
              {sidebarItems.length === 0 ? (
                <EmptyState
                  hasJobs={jobs.length > 0}
                  onClear={clearFilters}
                  onCreate={handleCreate}
                />
              ) : (
                <JobSidebar
                  items={paginatedItems}
                  selectedJobId={selectedJobId}
                  onSelectJob={setSelectedJobId}
                  appliedJobIds={new Set()}
                  showMatchScore={false}
                  showStatusBadge
                />
              )}

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

            {/* Detail column — sticky child sticks within flex stretch */}
            <div className="flex-1 min-w-0">
              {sidebarItems.length === 0 ? (
                <Card className="border shadow-sm">
                  <CardContent className="py-24 flex items-center justify-center">
                    <p className="text-sm text-muted-foreground">Select a job to view details</p>
                  </CardContent>
                </Card>
              ) : (
                <JobDetailPanel
                  jobMatch={selectedJobMatch}
                  isApplied={false}
                  onApply={() => {}}
                  applyLoading={false}
                  mode="admin"
                  onEdit={handleEdit}
                  onToggleActive={handleToggleActive}
                  onDelete={handleDelete}
                  actionLoading={actionLoading}
                  applicationCount={
                    selectedJobMatch
                      ? appCounts[selectedJobMatch.job.id] ?? 0
                      : undefined
                  }
                  onViewApplicants={(jobId) => {
                    setAppJobFilter(jobId);
                    setActiveTab("applications");
                  }}
                />
              )}
            </div>
          </div>

          {/* Mobile: Card list or Detail */}
          <div className="md:hidden space-y-3 mb-16">
            {showMobileDetail && selectedJobMatch ? (
              <>
                <button
                  onClick={() => setShowMobileDetail(false)}
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back to list
                </button>
                <JobDetailPanel
                  jobMatch={selectedJobMatch}
                  isApplied={false}
                  onApply={() => {}}
                  applyLoading={false}
                  mode="admin"
                  onEdit={handleEdit}
                  onToggleActive={handleToggleActive}
                  onDelete={handleDelete}
                  actionLoading={actionLoading}
                  applicationCount={appCounts[selectedJobMatch.job.id] ?? 0}
                  onViewApplicants={(jobId) => {
                    setAppJobFilter(jobId);
                    setActiveTab("applications");
                  }}
                />
              </>
            ) : sidebarItems.length === 0 ? (
              <EmptyState
                hasJobs={jobs.length > 0}
                onClear={clearFilters}
                onCreate={handleCreate}
              />
            ) : (
              sidebarItems.map((match) => (
                <Card
                  key={match.job.id}
                  className="border shadow-sm rounded-xl hover:border-primary/30 group cursor-pointer transition-all"
                  onClick={() => handleMobileSelect(match.job.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 space-y-1.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-semibold group-hover:text-primary transition-colors">
                            {match.job.title}
                          </h3>
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 text-[10px] font-medium rounded-full px-1.5 py-0.5 border",
                              match.job.is_active
                                ? "bg-green-50 text-green-700 border-green-200"
                                : "bg-gray-100 text-gray-500 border-gray-200"
                            )}
                          >
                            <span
                              className={cn(
                                "h-1.5 w-1.5 rounded-full",
                                match.job.is_active ? "bg-green-500" : "bg-gray-400"
                              )}
                            />
                            {match.job.is_active ? "Active" : "Inactive"}
                          </span>
                          {isNewJob(match.job.created_at) && (
                            <Badge className="bg-blue-50 text-blue-600 border border-blue-200 text-[10px] px-1.5 py-0 gap-0.5">
                              <Sparkles className="h-2.5 w-2.5" />
                              New
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Building className="h-3 w-3" />
                            {match.job.facility_name}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {match.job.location}
                          </span>
                          <span className="flex items-center gap-1 capitalize">
                            <Clock className="h-3 w-3" />
                            {match.job.employment_type}
                          </span>
                          {match.job.salary_min && (
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              {match.job.salary_currency}{" "}
                              {match.job.salary_min.toLocaleString()}
                              {match.job.salary_max &&
                                `–${match.job.salary_max.toLocaleString()}`}
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5 group-hover:text-primary transition-colors" />
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </>
      )}

      <JobFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        editingJob={editingJob}
        onSuccess={handleFormSuccess}
      />
      <BulkUploadDialog
        open={bulkUploadOpen}
        onOpenChange={setBulkUploadOpen}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}

/* ── Empty state ── */
function EmptyState({
  hasJobs,
  onClear,
  onCreate,
}: {
  hasJobs: boolean;
  onClear: () => void;
  onCreate: () => void;
}) {
  return (
    <Card className="border shadow-sm col-span-2">
      <CardContent className="py-20 text-center">
        <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
          <Briefcase className="h-7 w-7 text-muted-foreground" />
        </div>
        <p className="font-medium text-sm mb-1">
          {hasJobs ? "No jobs match your filters" : "No jobs posted yet"}
        </p>
        <p className="text-xs text-muted-foreground mb-4">
          {hasJobs
            ? "Try adjusting your search or filters."
            : "Create your first job posting to get started."}
        </p>
        {hasJobs ? (
          <Button variant="outline" size="sm" onClick={onClear}>
            Clear filters
          </Button>
        ) : (
          <Button size="sm" className="btn-primary-green border-0" onClick={onCreate}>
            <Plus className="h-4 w-4 mr-1.5" />
            Create Job
          </Button>
        )}
      </CardContent>
    </Card>
  );
}