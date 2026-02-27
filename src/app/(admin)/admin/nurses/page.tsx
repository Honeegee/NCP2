"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@/lib/auth-context";
import { api, fetchPaginated } from "@/lib/api-client";
import Link from "next/link";
import { CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectOption } from "@/components/ui/select";
import {
  Search,
  Users,
  X,
  CheckCircle2,
  Clock,
  MapPin,
  GraduationCap,
  Briefcase,
  Target,
  ChevronRight,
  Award,
  AlertCircle,
  FileText,
  Eye,
  Download,
  ChevronsUpDown,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { HeroBackground } from "@/components/shared/HeroBackground";
import { toast } from "sonner";
import { formatNurseName } from "@/lib/utils";

interface NurseListItem {
  id: string;
  first_name: string;
  last_name: string;
  years_of_experience: number | null;
  profile_complete: boolean;
  updated_at: string;
  professional_status: "registered_nurse" | "nursing_student" | null;
  location_type: "philippines" | "overseas" | null;
  employment_status: string | null;
  specialization: string | null;
  school_name: string | null;
  resume_url: string | null;
  user: { email: string; role: string };
  certifications: { id: string; cert_type: string; nurse_id: string }[];
  skills: { id: string; skill_name: string; nurse_id: string }[];
  resumes?: { id: string; original_filename: string; uploaded_at: string }[];
}

type SortKey = "name" | "status" | "location" | "experience" | "certs";
type SortDir = "asc" | "desc";

function sortNurses(nurses: NurseListItem[], key: SortKey, dir: SortDir): NurseListItem[] {
  const sorted = [...nurses].sort((a, b) => {
    let cmp = 0;
    switch (key) {
      case "name":
        cmp = `${a.last_name} ${a.first_name}`.localeCompare(`${b.last_name} ${b.first_name}`);
        break;
      case "status": {
        const order = { registered_nurse: 0, nursing_student: 1, null: 2 };
        cmp = (order[a.professional_status as keyof typeof order] ?? 2) -
              (order[b.professional_status as keyof typeof order] ?? 2);
        break;
      }
      case "location": {
        const lo = { philippines: 0, overseas: 1, null: 2 };
        cmp = (lo[a.location_type as keyof typeof lo] ?? 2) -
              (lo[b.location_type as keyof typeof lo] ?? 2);
        break;
      }
      case "experience":
        if (a.professional_status === "nursing_student" && b.professional_status !== "nursing_student") return 1;
        if (b.professional_status === "nursing_student" && a.professional_status !== "nursing_student") return -1;
        cmp = (a.years_of_experience ?? -1) - (b.years_of_experience ?? -1);
        break;
      case "certs":
        cmp = (a.certifications?.length ?? 0) - (b.certifications?.length ?? 0);
        break;
    }
    return dir === "asc" ? cmp : -cmp;
  });
  return sorted;
}

function CertOverflowBadge({ certs }: { certs: { id: string; cert_type: string }[] }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, above: true });
  const btnRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleClose = () => { closeTimer.current = setTimeout(() => setOpen(false), 100); };
  const cancelClose = () => { if (closeTimer.current) clearTimeout(closeTimer.current); };

  const calcPos = useCallback(() => {
    if (!btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    const above = r.top > 160;
    setPos({
      top: above ? r.top + window.scrollY - 8 : r.bottom + window.scrollY + 8,
      left: r.left + window.scrollX,
      above,
    });
  }, []);

  const handleOpen = () => { cancelClose(); calcPos(); setOpen(true); };

  useEffect(() => {
    if (!open) return;
    const outsideClick = (e: MouseEvent) => {
      if (!btnRef.current?.contains(e.target as Node) && !tooltipRef.current?.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", outsideClick);
    window.addEventListener("scroll", calcPos, true);
    window.addEventListener("resize", calcPos);
    return () => {
      document.removeEventListener("mousedown", outsideClick);
      window.removeEventListener("scroll", calcPos, true);
      window.removeEventListener("resize", calcPos);
    };
  }, [open, calcPos]);

  return (
    <>
      <Button
        ref={btnRef}
        variant={open ? "secondary" : "muted"}
        size="sm"
        onMouseEnter={handleOpen}
        onMouseLeave={scheduleClose}
        onClick={() => (open ? setOpen(false) : handleOpen())}
        className="text-[11px] h-auto px-2 py-0.5"
      >
        +{certs.length}
      </Button>
      {open && typeof document !== "undefined" && createPortal(
        <div
          ref={tooltipRef}
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
          className="absolute z-[9999] bg-card border border-border rounded-xl p-2 min-w-[152px] shadow-lg"
          style={{
            top: pos.above ? undefined : pos.top,
            bottom: pos.above ? `calc(100vh - ${pos.top}px)` : undefined,
            left: pos.left,
          }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 pl-1">
            More Certifications
          </p>
          <div className="flex flex-col gap-1">
            {certs.map((cert) => (
              <span key={cert.id} className="inline-flex items-center gap-1 text-[11px] rounded-md px-2 py-0.5 bg-secondary text-primary border border-border whitespace-nowrap">
                <Award className="w-2.5 h-2.5 flex-shrink-0" />
                {cert.cert_type}
              </span>
            ))}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

function SortableHeader({ label, sortKey, currentKey, currentDir, onSort, className = "px-5" }: {
  label: string; sortKey: SortKey; currentKey: SortKey | null; currentDir: SortDir;
  onSort: (key: SortKey) => void; className?: string;
}) {
  const active = currentKey === sortKey;
  return (
    <th className={`py-3 text-left ${className} ${active ? "text-primary" : "text-muted-foreground"}`}>
      <Button variant="ghost" size="sm" onClick={() => onSort(sortKey)}
        className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider select-none h-auto px-0 py-0 hover:bg-transparent">
        {label}
        {active
          ? currentDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
          : <ChevronsUpDown className="h-3 w-3 opacity-30" />}
      </Button>
    </th>
  );
}

function NurseAvatar({ first, last }: { first: string; last: string }) {
  return (
    <div className="h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
      style={{ background: "var(--primary-lighter)", color: "var(--primary)" }}>
      {`${(first || "?")[0]}${(last || "?")[0]}`.toUpperCase()}
    </div>
  );
}

function ExperienceCell({ nurse }: { nurse: NurseListItem }) {
  if (nurse.professional_status === "nursing_student") {
    return (
      <span className="inline-flex items-center gap-1 text-xs rounded-md px-2.5 py-1"
        style={{ background: "var(--highlight-muted)", color: "var(--highlight)", border: "1px solid transparent" }}>
        <GraduationCap className="h-3 w-3" /> Student
      </span>
    );
  }
  if (nurse.professional_status === "registered_nurse") {
    if (nurse.years_of_experience != null) {
      return <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{nurse.years_of_experience} yr{nurse.years_of_experience !== 1 ? "s" : ""}</p>;
    }
    return <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>N/A</span>;
  }
  return <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>N/A</span>;
}

export default function AdminNurseList() {
  const { user } = useAuth();
  const [nurses, setNurses] = useState<NurseListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nurseStats, setNurseStats] = useState<{ totalNurses: number } | null>(null);

  const [searchName, setSearchName] = useState("");
  const [certFilter, setCertFilter] = useState("");
  const [minExpFilter, setMinExpFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  // Pagination state
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const ITEMS_PER_PAGE = 30;

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchName), 400);
    return () => clearTimeout(t);
  }, [searchName]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, certFilter, minExpFilter, statusFilter, locationFilter]);

  const fetchNurses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch stats and paginated nurses in parallel
      const [statsData, response] = await Promise.all([
        api.get<{ totalNurses: number }>("/nurses/stats").catch(() => null),
        fetchPaginated<NurseListItem>(`/nurses?page=${page}&limit=${ITEMS_PER_PAGE}`),
      ]);
      
      setNurseStats(statsData);
      
      let result = response.data || [];
      // Client-side filtering for filters not supported by backend
      if (statusFilter) result = result.filter((n) => n.professional_status === statusFilter);
      if (locationFilter) result = result.filter((n) => n.location_type === locationFilter);
      setNurses(result);
      setTotalCount(response.meta?.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load nurses");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, certFilter, minExpFilter, statusFilter, locationFilter]);

  useEffect(() => { if (user) fetchNurses(); }, [user, fetchNurses]);

  const totalPages = Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE));

  const clearFilters = () => {
    setSearchName(""); setCertFilter(""); setMinExpFilter("");
    setStatusFilter(""); setLocationFilter(""); setDebouncedSearch("");
  };

  const handleViewResume = async (resumeId: string) => {
    try {
      const { url } = await api.get<{ url: string }>("/resumes/" + resumeId);
      window.open(url, "_blank");
    } catch { toast.error("Could not open resume."); }
  };

  const handleDownloadResume = async (resumeId: string, filename: string) => {
    try {
      const { url } = await api.get<{ url: string }>("/resumes/" + resumeId);
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl; a.download = filename; a.click();
      URL.revokeObjectURL(blobUrl);
    } catch { toast.error("Could not download resume."); }
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  const hasActiveFilters = !!(searchName.trim() || certFilter || minExpFilter || statusFilter || locationFilter);
  const displayedNurses = sortKey ? sortNurses(nurses, sortKey, sortDir) : nurses;
  const totalFilteredCount = totalCount;

  return (
    <div className="pb-16">

      {/* ── Hero ── */}
      <HeroBackground style={{ overflow: "visible" }}>
        <div className="admin-hero-container">
          <div className="flex flex-col sm:flex-row sm:items-start gap-3 mb-5">
            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <div className="p-2 rounded-xl" style={{ background: "rgba(255,255,255,0.12)" }}>
                  <Users className="h-5 w-5 text-white" />
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">Nurse Directory</h1>
              </div>
              <p className="text-sm ml-11" style={{ color: "rgba(255,255,255,0.6)" }}>
                Manage and view all registered nurses
              </p>
            </div>

            <div className="sm:ml-auto">
              <Button asChild size="sm" className="admin-hero-btn-ghost">
                <Link href="/admin">Back to Dashboard</Link>
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div
            className="flex flex-wrap items-center gap-2 p-3 rounded-xl shadow-md"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            {/* Search */}
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
                style={{ color: "var(--muted-foreground)" }} />
              <Input
                placeholder="Search by name..."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                className="pl-9 h-10"
              />
              {searchName && (
                <Button variant="ghost" size="icon" onClick={() => setSearchName("")}
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7">
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Status */}
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-10 w-36">
              <SelectOption value="">All Status</SelectOption>
              <SelectOption value="registered_nurse">RN</SelectOption>
              <SelectOption value="nursing_student">Student</SelectOption>
            </Select>

            {/* Location */}
            <Select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} className="h-10 w-40">
              <SelectOption value="">All Locations</SelectOption>
              <SelectOption value="philippines">Philippines</SelectOption>
              <SelectOption value="overseas">Overseas</SelectOption>
            </Select>

            {/* Certs */}
            <Select value={certFilter} onChange={(e) => setCertFilter(e.target.value)} className="h-10 w-36">
              <SelectOption value="">All Certs</SelectOption>
              <SelectOption value="PRC License">PRC</SelectOption>
              <SelectOption value="NCLEX">NCLEX</SelectOption>
              <SelectOption value="IELTS">IELTS</SelectOption>
              <SelectOption value="OET">OET</SelectOption>
              <SelectOption value="BLS">BLS</SelectOption>
              <SelectOption value="ACLS">ACLS</SelectOption>
            </Select>

            {/* Min exp */}
            <Input
              type="number" min="0" placeholder="Min exp (yrs)"
              value={minExpFilter} onChange={(e) => setMinExpFilter(e.target.value)}
              className="h-10 w-32"
            />
          </div>
        </div>
      </HeroBackground>

      {/* ── Table ── */}
      <div className="max-w-7xl mt-6">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3">
                <div className="relative h-10 w-10">
                  <div className="absolute inset-0 rounded-full border-4 border-muted" />
                  <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                </div>
                <p className="text-sm text-muted-foreground">Loading nurses...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-24 gap-2">
                <AlertCircle className="h-6 w-6" style={{ color: "var(--destructive)" }} />
                <p className="text-sm" style={{ color: "var(--destructive)" }}>{error}</p>
                <Button variant="outline" size="sm" className="mt-1" onClick={fetchNurses}>
                  Retry
                </Button>
              </div>
            ) : totalCount === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 gap-2">
                <Users className="h-8 w-8 opacity-20" />
                <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                  {hasActiveFilters ? "No nurses match your filters" : "No nurses registered yet"}
                </p>
                {hasActiveFilters && (
                  <Button variant="link" size="sm" onClick={clearFilters} className="mt-1">
                    Clear filters
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--muted)" }}>
                      <SortableHeader label="Nurse" sortKey="name" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} className="pl-4" />
                      <SortableHeader label="Status" sortKey="status" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} className="px-5 hidden sm:table-cell" />
                      <SortableHeader label="Location" sortKey="location" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} className="px-5 hidden md:table-cell" />
                      <SortableHeader label="Experience" sortKey="experience" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} className="px-5 hidden lg:table-cell" />
                      <SortableHeader label="Certifications" sortKey="certs" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} className="px-5 hidden lg:table-cell" />
                      <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider hidden xl:table-cell"
                        style={{ color: "var(--muted-foreground)" }}>Resume</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {displayedNurses.map((nurse) => (
                      <tr key={nurse.id} className="group transition-colors"
                        style={{ borderBottom: "1px solid var(--border)" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--muted)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "")}>

                        {/* Nurse */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <NurseAvatar first={nurse.first_name} last={nurse.last_name} />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-medium text-sm" style={{ color: "var(--foreground)" }}>
                                  {formatNurseName(nurse.first_name, nurse.last_name, nurse.professional_status)}
                                </span>
                                {nurse.profile_complete
                                  ? <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "var(--success)" }} />
                                  : <Clock className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "var(--warning)" }} />}
                              </div>
                              <p className="text-xs truncate max-w-[180px]" style={{ color: "var(--muted-foreground)" }}>
                                {nurse.user?.email}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-5 py-3.5 hidden sm:table-cell">
                          {nurse.professional_status === "registered_nurse" ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium rounded-md px-2.5 py-1"
                              style={{ background: "var(--secondary)", color: "var(--primary)" }}>
                              <Briefcase className="h-3 w-3" /> RN
                            </span>
                          ) : nurse.professional_status === "nursing_student" ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium rounded-md px-2.5 py-1"
                              style={{ background: "var(--highlight-muted)", color: "var(--highlight)" }}>
                              <GraduationCap className="h-3 w-3" /> Student
                            </span>
                          ) : (
                            <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>—</span>
                          )}
                        </td>

                        {/* Location */}
                        <td className="px-5 py-3.5 hidden md:table-cell">
                          {nurse.location_type ? (
                            <span className="inline-flex items-center gap-1 text-xs rounded-md px-2.5 py-1"
                              style={{ background: "var(--muted)", color: "var(--muted-foreground)", border: "1px solid var(--border)" }}>
                              <MapPin className="h-3 w-3" />
                              {nurse.location_type === "philippines" ? "Philippines" : "Overseas"}
                            </span>
                          ) : (
                            <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>—</span>
                          )}
                        </td>

                        {/* Experience */}
                        <td className="px-5 py-3.5 hidden lg:table-cell">
                          <ExperienceCell nurse={nurse} />
                        </td>

                        {/* Certifications */}
                        <td className="px-5 py-3.5 hidden lg:table-cell">
                          {nurse.certifications?.length > 0 ? (
                            <div className="flex flex-wrap gap-1 items-center">
                              {nurse.certifications.slice(0, 2).map((cert) => (
                                <span key={cert.id}
                                  className="inline-flex items-center gap-1 text-[11px] rounded-md px-2 py-0.5"
                                  style={{ background: "var(--secondary)", color: "var(--primary)", border: "1px solid var(--border)" }}>
                                  <Award className="h-2.5 w-2.5" />
                                  {cert.cert_type}
                                </span>
                              ))}
                              {nurse.certifications.length > 2 && (
                                <CertOverflowBadge certs={nurse.certifications.slice(2)} />
                              )}
                            </div>
                          ) : (
                            <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>—</span>
                          )}
                        </td>

                        {/* Resume */}
                        <td className="px-5 py-3.5 hidden xl:table-cell">
                          {nurse.resumes && nurse.resumes.length > 0 ? (
                            <div className="flex items-center gap-1">
                              <button onClick={() => handleViewResume(nurse.resumes![0].id)}
                                className="inline-flex items-center gap-1.5 text-xs font-medium rounded-md px-2.5 py-1 transition-colors"
                                style={{ background: "var(--secondary)", color: "var(--primary)", border: "1px solid var(--border)" }}
                                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--primary-lighter)")}
                                onMouseLeave={(e) => (e.currentTarget.style.background = "var(--secondary)")}
                                title="View resume">
                                <Eye className="h-3 w-3" />
                              </button>
                              <button onClick={() => handleDownloadResume(nurse.resumes![0].id, nurse.resumes![0].original_filename)}
                                className="h-7 w-7 rounded-md flex items-center justify-center transition-colors"
                                style={{ background: "var(--muted)", color: "var(--muted-foreground)", border: "1px solid var(--border)" }}
                                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--secondary)")}
                                onMouseLeave={(e) => (e.currentTarget.style.background = "var(--muted)")}
                                title="Download resume">
                                <Download className="h-3 w-3" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>—</span>
                          )}
                        </td>

                        {/* Row actions */}
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            {nurse.resumes && nurse.resumes.length > 0 && (
                              <Button variant="muted" size="sm" onClick={() => handleViewResume(nurse.resumes![0].id)} title="View Resume" className="xl:hidden">
                                <FileText className="h-3.5 w-3.5" />
                                <span>Resume</span>
                              </Button>
                            )}
                            <Link href={`/admin/nurses/${nurse.id}/matches`}>
                              <Button variant="success" size="sm">
                                <Target className="h-3.5 w-3.5" />
                                <span>Matches</span>
                              </Button>
                            </Link>
                            <Link href={`/admin/nurses/${nurse.id}`}>
                              <Button variant="secondary" size="sm">
                                <span>View</span>
                                <ChevronRight className="h-3.5 w-3.5" />
                              </Button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Pagination Controls */}
            {!loading && !error && totalCount > 0 && (
              <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: "var(--border)" }}>
                <div className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                  Showing {((page - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(page * ITEMS_PER_PAGE, totalCount)} of {totalCount} nurses
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => p - 1)}
                    disabled={page === 1}
                    className="h-8"
                  >
                    <ChevronRight className="h-4 w-4 rotate-180" />
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {/* Page number buttons */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum: number;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (page <= 3) {
                        pageNum = i + 1;
                      } else if (page >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = page - 2 + i;
                      }
                      return (
                        <Button
                          key={pageNum}
                          variant={page === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setPage(pageNum)}
                          className="h-8 w-8 p-0"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => p + 1)}
                    disabled={page === totalPages}
                    className="h-8"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
      </div>
    </div>
  );
}