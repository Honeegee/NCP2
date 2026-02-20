"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api-client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectOption } from "@/components/ui/select";
import {
  MapPin,
  Search,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Building,
  Clock,
  DollarSign,
  Globe,
  X,
  Filter,
} from "lucide-react";
import Link from "next/link";
import { JobSidebar } from "@/components/jobs/JobSidebar";
import { JobDetailPanel } from "@/components/jobs/JobDetailPanel";
import { MatchScoreCircle } from "@/components/jobs/MatchScoreCircle";
import type { Job, JobMatch, JobApplication } from "@/types";
import { toast } from "sonner";

export default function JobsPage() {
  const { user } = useAuth();
  const [matches, setMatches] = useState<JobMatch[]>([]);
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"matched" | "all" | "applied">("matched");
  const [loading, setLoading] = useState(true);
  const [applyLoading, setApplyLoading] = useState(false);
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  // Enhanced filters
  const [search, setSearch] = useState("");
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [locationSearch, setLocationSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [expFilter, setExpFilter] = useState<string>("");

  // Derive unique filter options from jobs data
  const filterOptions = useMemo(() => {
    const countries = [...new Set(allJobs.map((j) => j.country).filter(Boolean))].sort();
    const types = [...new Set(allJobs.map((j) => j.employment_type).filter(Boolean))].sort();
    return { countries, types };
  }, [allJobs]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [matchData, jobs, applications] = await Promise.all([
          api.get<JobMatch[]>("/jobs/matches"),
          api.get<Job[]>("/jobs"),
          api.get<JobApplication[]>("/applications/me"),
        ]);

        setMatches(matchData || []);
        setAllJobs(jobs || []);
        const ids = new Set<string>(
          (applications || []).map((a: JobApplication) => a.job_id)
        );
        setAppliedJobIds(ids);
      } catch (error) {
        console.error("Error fetching jobs:", error);
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      fetchData();
    }
  }, [user]);

  // Build sidebar items based on view mode
  const sidebarItems = useMemo(() => {
    let items: JobMatch[];

    if (viewMode === "matched") {
      items = matches;
    } else {
      // "all" and "applied" both start from the full list
      const matchMap = new Map(matches.map((m) => [m.job.id, m]));
      items = allJobs.map((job) => {
        const existing = matchMap.get(job.id);
        return (
          existing || {
            job,
            match_score: 0,
            matched_certifications: [],
            matched_skills: [],
            experience_match: false,
          }
        );
      });
      items.sort(
        (a, b) =>
          new Date(b.job.created_at).getTime() -
          new Date(a.job.created_at).getTime()
      );
    }

    // Applied filter
    if (viewMode === "applied") {
      items = items.filter((m) => appliedJobIds.has(m.job.id));
    }

    // Apply filters
    if (search) {
      const s = search.toLowerCase();
      items = items.filter(
        (m) =>
          m.job.title.toLowerCase().includes(s) ||
          m.job.facility_name.toLowerCase().includes(s) ||
          m.job.description.toLowerCase().includes(s)
      );
    }

    // Country filter (specific country or all)
    if (countryFilter && countryFilter !== "all") {
      items = items.filter((m) => m.job.country === countryFilter);
    }

    // Location/city text search
    if (locationSearch) {
      const loc = locationSearch.toLowerCase();
      items = items.filter((m) =>
        m.job.location.toLowerCase().includes(loc)
      );
    }

    // Employment type filter
    if (typeFilter) {
      items = items.filter((m) => m.job.employment_type === typeFilter);
    }

    // Experience level filter
    if (expFilter) {
      const maxExp = parseInt(expFilter, 10);
      items = items.filter((m) => m.job.min_experience_years <= maxExp);
    }

    return items;
  }, [viewMode, matches, allJobs, search, countryFilter, locationSearch, typeFilter, expFilter, appliedJobIds]);

  // Reset page when filters or view mode change
  useEffect(() => {
    setPage(1);
  }, [viewMode, search, countryFilter, locationSearch, typeFilter, expFilter]);

  // Paginate sidebar items
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

  // Get the selected job's match data
  const selectedJobMatch = useMemo(() => {
    if (!selectedJobId) return null;
    return sidebarItems.find((m) => m.job.id === selectedJobId) || null;
  }, [selectedJobId, sidebarItems]);

  async function handleApply() {
    if (!selectedJobId || appliedJobIds.has(selectedJobId)) return;

    setApplyLoading(true);
    try {
      await api.post("/applications/jobs/" + selectedJobId + "/apply");
      setAppliedJobIds((prev) => new Set([...prev, selectedJobId]));
      toast.success("Application submitted successfully!");
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setAppliedJobIds((prev) => new Set([...prev, selectedJobId]));
        toast.info("You've already applied to this job");
      } else if (error instanceof ApiError) {
        toast.error(error.message || "Failed to apply");
      } else {
        console.error("Apply error:", error);
        toast.error("Something went wrong");
      }
    } finally {
      setApplyLoading(false);
    }
  }

  // Clear all filters
  const clearFilters = () => {
    setSearch("");
    setCountryFilter("all");
    setLocationSearch("");
    setTypeFilter("");
    setExpFilter("");
  };

  const hasActiveFilters = 
    search || 
    countryFilter !== "all" || 
    locationSearch || 
    typeFilter || 
    expFilter;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Finding your best matches...</p>
        </div>
      </div>
    );
  }

  const totalCount = viewMode === "matched" ? matches.length : allJobs.length;
  const filteredCount = sidebarItems.length;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Job Opportunities</h1>
          <p className="text-sm text-muted-foreground">
            {viewMode === "matched"
              ? `${matches.length} matched to your profile`
              : viewMode === "applied"
                ? `${appliedJobIds.size} applied`
                : `${allJobs.length} available`}
            {hasActiveFilters && filteredCount !== totalCount && (
              <span className="ml-2 text-primary">
                ({filteredCount} matching filters)
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Filters row */}
      <div className="space-y-3">
        {/* Primary filters row */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode: Matched | All | Applied */}
          <div className="flex bg-muted rounded-lg p-0.5">
            {([
              { key: "matched" as const, label: `Matched (${matches.length})` },
              { key: "all" as const, label: `All Jobs (${allJobs.length})` },
              { key: "applied" as const, label: `Applied (${appliedJobIds.size})` },
            ]).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => {
                  setViewMode(key);
                  setSelectedJobId(null);
                }}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  viewMode === key
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search jobs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 w-48"
            />
          </div>
        </div>

        {/* Secondary filters row */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Country Filter */}
          <Select
            value={countryFilter}
            onChange={(e) => setCountryFilter(e.target.value)}
            className="h-9 w-40"
          >
            <SelectOption value="all">
              <span className="flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5" />
                All Countries
              </span>
            </SelectOption>
            {filterOptions.countries.map((country) => (
              <SelectOption key={country} value={country}>{country}</SelectOption>
            ))}
          </Select>

          {/* Location/City Search */}
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="City/Location..."
              value={locationSearch}
              onChange={(e) => setLocationSearch(e.target.value)}
              className="pl-8 h-9 w-36"
            />
          </div>

          {/* Employment Type Filter */}
          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-9 w-32"
          >
            <SelectOption value="">All Types</SelectOption>
            {filterOptions.types.map((type) => (
              <SelectOption key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1).replace("-", " ")}
              </SelectOption>
            ))}
          </Select>

          {/* Experience Level Filter */}
          <Select
            value={expFilter}
            onChange={(e) => setExpFilter(e.target.value)}
            className="h-9 w-36"
          >
            <SelectOption value="">Any Experience</SelectOption>
            <SelectOption value="1">Entry (0-1 yrs)</SelectOption>
            <SelectOption value="3">Mid (2-3 yrs)</SelectOption>
            <SelectOption value="5">Senior (4-5 yrs)</SelectOption>
            <SelectOption value="100">Expert (5+ yrs)</SelectOption>
          </Select>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary px-2 py-1.5 rounded-md hover:bg-muted transition-colors"
            >
              <X className="h-3 w-3" />
              Clear all
            </button>
          )}
        </div>

        {/* Active filters display */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Filter className="h-3 w-3" />
              Active:
            </span>
            {search && (
              <Badge variant="secondary" className="text-xs gap-1">
                Search: &quot;{search}&quot;
                <button onClick={() => setSearch("")} className="ml-0.5 hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {countryFilter !== "all" && (
              <Badge variant="secondary" className="text-xs gap-1">
                Country: {countryFilter}
                <button onClick={() => setCountryFilter("all")} className="ml-0.5 hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {locationSearch && (
              <Badge variant="secondary" className="text-xs gap-1">
                Location: {locationSearch}
                <button onClick={() => setLocationSearch("")} className="ml-0.5 hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {typeFilter && (
              <Badge variant="secondary" className="text-xs gap-1">
                Type: {typeFilter}
                <button onClick={() => setTypeFilter("")} className="ml-0.5 hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {expFilter && (
              <Badge variant="secondary" className="text-xs gap-1">
                Exp: ≤{expFilter} yrs
                <button onClick={() => setExpFilter("")} className="ml-0.5 hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Desktop: Sidebar + Detail Panel */}
      <div className="hidden md:flex gap-4">
        <div className="w-[350px] flex-shrink-0 space-y-3">
          <JobSidebar
            items={paginatedItems}
            selectedJobId={selectedJobId}
            onSelectJob={setSelectedJobId}
            appliedJobIds={appliedJobIds}
            showMatchScore={viewMode === "matched"}
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
        {/* Wrapper stretches to sidebar height; sticky child sticks within it */}
        <div className="flex-1 min-w-0">
          <JobDetailPanel
            jobMatch={selectedJobMatch}
            isApplied={appliedJobIds.has(selectedJobId || "")}
            onApply={handleApply}
            applyLoading={applyLoading}
          />
        </div>
      </div>

      {/* Mobile: Card list linking to detail pages */}
      <div className="md:hidden flex flex-col gap-4 mb-12">
        {sidebarItems.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="py-16 text-center">
              <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                <Briefcase className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground font-medium mb-1">
                {totalCount === 0 ? "No jobs available" : "No jobs match your filters"}
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                {totalCount === 0
                  ? "Check back later for new opportunities."
                  : "Try adjusting your search criteria."}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-primary hover:underline"
                >
                  Clear all filters
                </button>
              )}
            </CardContent>
          </Card>
        ) : (
          sidebarItems.map((match) => (
            <Link key={match.job.id} href={`/jobs/${match.job.id}`}>
              <Card className="border shadow-sm rounded-2xl hover:border-primary/30 group cursor-pointer transition-all">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 space-y-2 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-semibold group-hover:text-primary transition-colors">
                          {match.job.title}
                        </h3>
                        {match.match_score >= 80 && (
                          <Badge className="gradient-primary border-0 text-white text-xs">
                            Top Match
                          </Badge>
                        )}
                        {appliedJobIds.has(match.job.id) && (
                          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">
                            Applied
                          </Badge>
                        )}
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
                    {viewMode === "matched" && match.match_score > 0 && (
                      <MatchScoreCircle score={match.match_score} size="sm" />
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
