"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api-client";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Briefcase,
  Plus,
  Search,
  MapPin,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  Building,
  Clock,
  DollarSign,
  CheckCircle,
  MinusCircle,
} from "lucide-react";
import { JobSidebar } from "@/components/jobs/JobSidebar";
import { JobDetailPanel } from "@/components/jobs/JobDetailPanel";
import { JobFormDialog } from "@/components/jobs/JobFormDialog";
import type { Job, JobMatch } from "@/types";

export default function AdminJobManagement() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  // Pagination
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  // Form dialog
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);

  // Mobile detail view
  const [showMobileDetail, setShowMobileDetail] = useState(false);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get<Job[]>("/jobs");
      setJobs(data || []);
    } catch (err) {
      console.error("Jobs fetch error:", err);
      setError(err instanceof Error ? err.message : "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchJobs();
    }
  }, [user]);

  // Build sidebar items with filters
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
      const l = locationFilter.toLowerCase();
      filtered = filtered.filter((j) => j.location.toLowerCase().includes(l));
    }
    if (typeFilter) {
      filtered = filtered.filter((j) => j.employment_type === typeFilter);
    }

    // Sort newest first
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

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [search, locationFilter, typeFilter, statusFilter]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sidebarItems.length / ITEMS_PER_PAGE));
  const paginatedItems = sidebarItems.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  // Auto-select first job on current page
  useEffect(() => {
    if (paginatedItems.length > 0 && !paginatedItems.find((m) => m.job.id === selectedJobId)) {
      setSelectedJobId(paginatedItems[0].job.id);
    }
  }, [paginatedItems, selectedJobId]);

  // Get selected job match data
  const selectedJobMatch = useMemo(() => {
    if (!selectedJobId) return null;
    return sidebarItems.find((m) => m.job.id === selectedJobId) || null;
  }, [selectedJobId, sidebarItems]);

  const handleEdit = (job: Job) => {
    setEditingJob(job);
    setFormDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingJob(null);
    setFormDialogOpen(true);
  };

  const handleToggleActive = async (job: Job) => {
    const action = job.is_active ? "deactivate" : "reactivate";
    if (!confirm(`Are you sure you want to ${action} "${job.title}"?`)) return;

    setActionLoading(true);
    try {
      if (job.is_active) {
        await api.delete(`/jobs/${job.id}`);
      } else {
        await api.put(`/jobs/${job.id}`, { is_active: true });
      }
      await fetchJobs();
    } catch (err) {
      alert(err instanceof Error ? err.message : `Failed to ${action} the job`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleFormSuccess = () => {
    fetchJobs();
  };

  const handleMobileSelect = (id: string) => {
    setSelectedJobId(id);
    setShowMobileDetail(true);
  };

  // Stats
  const totalJobs = jobs.length;
  const activeJobs = jobs.filter((j) => j.is_active).length;
  const inactiveJobs = jobs.filter((j) => !j.is_active).length;

  // Filter dropdown options
  const locations = [...new Set(jobs.map((j) => j.location))];
  const types = [...new Set(jobs.map((j) => j.employment_type))];

  const hasActiveFilters = search !== "" || locationFilter !== "" || typeFilter !== "" || statusFilter !== "all";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Loading jobs...</p>
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
          <Button variant="outline" size="sm" onClick={fetchJobs}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex-shrink-0">
          <h1 className="text-2xl font-bold">Job Management</h1>
          <p className="text-sm text-muted-foreground">
            {totalJobs} total jobs &middot; {activeJobs} active
          </p>
        </div>
        <div className="flex items-center gap-2 md:ml-auto">
          <Link href="/admin">
            <Button variant="outline" size="sm">
              Back to Dashboard
            </Button>
          </Link>
          <Button size="sm" onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-1" />
            Create New Job
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="stats-card">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <div className="stats-icon-blue">
                <Briefcase />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{totalJobs}</p>
                <p className="text-sm text-gray-600">Total Jobs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="stats-card">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <div className="stats-icon-green">
                <CheckCircle />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{activeJobs}</p>
                <p className="text-sm text-gray-600">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="stats-card">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <div className="stats-icon-orange">
                <MinusCircle />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{inactiveJobs}</p>
                <p className="text-sm text-gray-600">Inactive</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-2 items-stretch sm:items-center">
        {/* Status Toggle */}
        <div className="flex bg-muted rounded-lg p-0.5 flex-shrink-0">
          {(["all", "active", "inactive"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all capitalize ${
                statusFilter === s
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {s === "all" ? `All (${totalJobs})` : s === "active" ? `Active (${activeJobs})` : `Inactive (${inactiveJobs})`}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search jobs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 w-full sm:w-48"
          />
        </div>

        {/* Location + Type filters */}
        <div className="flex gap-2 flex-shrink min-w-0">
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="h-9 border rounded-lg pl-9 pr-8 text-sm bg-background appearance-none cursor-pointer hover:border-primary/50 transition-colors"
            >
              <option value="">All Locations</option>
              {locations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-9 border rounded-lg pl-9 pr-8 text-sm bg-background appearance-none cursor-pointer hover:border-primary/50 transition-colors"
            >
              <option value="">All Types</option>
              {types.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>
          {hasActiveFilters && (
            <button
              onClick={() => {
                setSearch("");
                setLocationFilter("");
                setTypeFilter("");
                setStatusFilter("all");
              }}
              className="text-xs text-primary hover:underline px-2 whitespace-nowrap"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Desktop: Sidebar + Detail Panel */}
      <div className="hidden md:flex gap-4">
        <div className="w-[350px] flex-shrink-0 space-y-3">
          <JobSidebar
            items={paginatedItems}
            selectedJobId={selectedJobId}
            onSelectJob={setSelectedJobId}
            appliedJobIds={new Set()}
            showMatchScore={false}
            showStatusBadge
          />
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                Prev
              </button>
              <span className="text-sm text-muted-foreground">
                {page} of {totalPages}
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
        <div className="flex-1 min-w-0">
          <JobDetailPanel
            jobMatch={selectedJobMatch}
            isApplied={false}
            onApply={() => {}}
            applyLoading={false}
            mode="admin"
            onEdit={handleEdit}
            onToggleActive={handleToggleActive}
            actionLoading={actionLoading}
          />
        </div>
      </div>

      {/* Mobile: Card list or Detail */}
      <div className="md:hidden flex flex-col gap-4 mb-12">
        {showMobileDetail && selectedJobMatch ? (
          <>
            <button
              onClick={() => setShowMobileDetail(false)}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors self-start"
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
              actionLoading={actionLoading}
            />
          </>
        ) : sidebarItems.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="py-16 text-center">
              <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                <Briefcase className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground font-medium mb-1">
                {jobs.length === 0 ? "No jobs posted yet" : "No jobs match your filters"}
              </p>
              {jobs.length === 0 ? (
                <Button variant="link" size="sm" className="mt-2" onClick={handleCreate}>
                  Create your first job posting
                </Button>
              ) : (
                <button
                  onClick={() => {
                    setSearch("");
                    setLocationFilter("");
                    setTypeFilter("");
                    setStatusFilter("all");
                  }}
                  className="text-sm text-primary hover:underline mt-2"
                >
                  Clear filters
                </button>
              )}
            </CardContent>
          </Card>
        ) : (
          sidebarItems.map((match) => (
            <Card
              key={match.job.id}
              className="border shadow-sm rounded-2xl hover:border-primary/30 group cursor-pointer transition-all"
              onClick={() => handleMobileSelect(match.job.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-1 space-y-2 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-semibold group-hover:text-primary transition-colors">
                        {match.job.title}
                      </h3>
                      <Badge
                        className={
                          match.job.is_active
                            ? "bg-green-100 text-green-700 border-green-200 text-xs"
                            : "bg-gray-100 text-gray-500 border-gray-200 text-xs"
                        }
                      >
                        {match.job.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Building className="h-3.5 w-3.5" />
                        {match.job.facility_name}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {match.job.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        <span className="capitalize">{match.job.employment_type}</span>
                      </span>
                      {match.job.salary_min && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3.5 w-3.5" />
                          {match.job.salary_currency} {match.job.salary_min.toLocaleString()}
                          {match.job.salary_max && `–${match.job.salary_max.toLocaleString()}`}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Form Dialog */}
      <JobFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        editingJob={editingJob}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}
