"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api-client";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  UserPlus,
  Briefcase,
  ClipboardCheck,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Award,
  Sparkles,
  TrendingUp,
  ChevronRight,
  BarChart2,
  Clock,
  ThumbsUp,
  ThumbsDown,
  ShieldCheck,
} from "lucide-react";
import { HeroBackground } from "@/components/shared/HeroBackground";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import type { Job } from "@/types";

interface NurseWithRelations {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  date_of_birth: string | null;
  graduation_year: number | null;
  years_of_experience: number | null;
  bio: string | null;
  profile_complete: boolean;
  updated_at: string;
  user: { email: string; role: string; created_at: string };
  certifications: { id: string; cert_type: string }[];
  skills: { id: string; skill_name: string }[];
}

interface JobWithApplicationCount extends Job {
  application_count?: number;
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

function NurseInitials({ first, last }: { first: string; last: string }) {
  const initials = `${(first || "?")[0]}${(last || "?")[0]}`.toUpperCase();
  return (
    <div
      className="h-10 w-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
      style={{ background: "var(--primary-lighter)", color: "var(--primary)" }}
    >
      {initials}
    </div>
  );
}

// ── Custom Tooltip for the area chart ─────────────────────────────────────────
interface RegistrationTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}

function RegistrationTooltip({ active, payload, label }: RegistrationTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-lg px-3 py-2 text-xs shadow-md"
      style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--foreground)" }}
    >
      <p className="font-semibold mb-0.5">{label}</p>
      <p style={{ color: "var(--primary)" }}>
        {payload[0].value} registration{payload[0].value !== 1 ? "s" : ""}
      </p>
    </div>
  );
}

// ── Custom Tooltip for the donut chart ────────────────────────────────────────
interface JobTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { fill: string } }>;
}

function JobTooltip({ active, payload }: JobTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-lg px-3 py-2 text-xs shadow-md"
      style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--foreground)" }}
    >
      <p className="font-semibold">{payload[0].name}</p>
      <p style={{ color: payload[0].payload.fill }}>{payload[0].value} jobs</p>
    </div>
  );
}

interface NurseStats {
  totalNurses: number;
  completeProfiles: number;
  incompleteProfiles: number;
  nursesWithCertifications: number;
  nursesWithSkills: number;
  nursesWithExperience: number;
  registrationsPerDay: { date: string; count: number }[];
}

interface JobStats {
  totalJobs: number;
  activeJobs: number;
  inactiveJobs: number;
  topJobsByApplications?: { id: string; title: string; application_count: number; is_active: boolean }[];
}

interface ApplicationStats {
  totalApplications: number;
  pending: number;
  accepted: number;
  rejected: number;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [nurses, setNurses] = useState<NurseWithRelations[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [nurseStats, setNurseStats] = useState<NurseStats | null>(null);
  const [jobStats, setJobStats] = useState<JobStats | null>(null);
  const [appStats, setAppStats] = useState<ApplicationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setError(null);
        const [nursesData, jobsData, nursesStatsData, jobsStatsData, appStatsData] = await Promise.all([
          api.get<NurseWithRelations[]>("/nurses?limit=10&sort=desc"),
          api.get<Job[]>("/jobs?include_inactive=true&limit=5000"),
          api.get<NurseStats>("/nurses/stats"),
          api.get<JobStats>("/jobs/stats"),
          api.get<ApplicationStats>("/applications/stats"),
        ]);
        setNurses(nursesData || []);
        setJobs(jobsData || []);
        setNurseStats(nursesStatsData || null);
        setJobStats(jobsStatsData || null);
        setAppStats(appStatsData || null);
      } catch (err) {
        console.error("Admin dashboard fetch error:", err);
        setError(err instanceof Error ? err.message : "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    }
    if (user) fetchData();
  }, [user]);

  const registrationChartData = useMemo(() => {
    if (nurseStats?.registrationsPerDay) {
      return nurseStats.registrationsPerDay.map(({ date, count }) => ({
        label: new Date(date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
        count,
      }));
    }
    const days: { date: string; label: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push({
        date: d.toISOString().slice(0, 10),
        label: d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
        count: 0,
      });
    }
    nurses.forEach((n) => {
      const userCreatedAt = n.user?.created_at;
      if (!userCreatedAt) return;
      const day = new Date(userCreatedAt).toISOString().slice(0, 10);
      const slot = days.find((d) => d.date === day);
      if (slot) slot.count++;
    });
    return days.map(({ label, count }) => ({ label, count }));
  }, [nurses, nurseStats]);

  const jobStatusData = useMemo(() => {
    if (jobStats) {
      const data = [];
      if (jobStats.activeJobs > 0)
        data.push({ name: "Active", value: jobStats.activeJobs, fill: "var(--success)" });
      if (jobStats.inactiveJobs > 0)
        data.push({ name: "Inactive", value: jobStats.inactiveJobs, fill: "var(--border)" });
      return data;
    }
    const active = jobs.filter((j) => j.is_active).length;
    const inactive = jobs.length - active;
    return [
      { name: "Active", value: active, fill: "var(--success)" },
      { name: "Inactive", value: inactive, fill: "var(--border)" },
    ].filter((d) => d.value > 0);
  }, [jobs, jobStats]);

  const platformSnapshot = useMemo(() => {
    const total = nurseStats?.totalNurses ?? 0;
    const withCerts =
      nurseStats?.nursesWithCertifications ??
      nurses.filter((n) => n.certifications?.length > 0).length;
    const withSkills =
      nurseStats?.nursesWithSkills ??
      nurses.filter((n) => n.skills?.length > 0).length;
    const withExp =
      nurseStats?.nursesWithExperience ??
      nurses.filter((n) => (n.years_of_experience ?? 0) > 0).length;

    return [
      { label: "Nurses with certifications", value: withCerts, total, color: "var(--success)" },
      { label: "Nurses with skills listed", value: withSkills, total, color: "var(--primary)" },
      { label: "Nurses with experience", value: withExp, total, color: "var(--highlight)" },
    ];
  }, [nurses, nurseStats]);

  const topJobs = useMemo<{ id: string; title: string; application_count: number; is_active: boolean }[]>(() => {
    if (jobStats?.topJobsByApplications?.length) {
      return jobStats.topJobsByApplications.slice(0, 5);
    }
    return (jobs as JobWithApplicationCount[])
      .filter((j) => (j.application_count ?? 0) > 0)
      .sort((a, b) => (b.application_count ?? 0) - (a.application_count ?? 0))
      .slice(0, 5)
      .map((j) => ({
        id: j.id,
        title: j.title,
        application_count: j.application_count ?? 0,
        is_active: j.is_active,
      }));
  }, [jobs, jobStats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="relative mx-auto h-12 w-12">
            <div className="absolute inset-0 rounded-full border-4 border-muted" />
            <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          </div>
          <p className="text-sm text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full section-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-3" style={{ color: "var(--destructive)" }}>
              <AlertCircle className="h-5 w-5" />
              <p className="font-medium">Error loading dashboard</p>
            </div>
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>{error}</p>
            {/* ✅ Secondary action — outline is correct here */}
            <Button className="mt-4" variant="outline" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalNurses = nurseStats?.totalNurses ?? 0;
  const recentRegistrations =
    nurseStats?.registrationsPerDay?.reduce((sum, day) => sum + day.count, 0) ?? 0;
  const activeJobs = jobStats?.activeJobs ?? 0;
  const pendingReviews = nurseStats?.incompleteProfiles ?? 0;
  const completeProfiles = nurseStats?.completeProfiles ?? 0;
  const recentNurses = nurses.slice(0, 10);

  const totalApps = appStats?.totalApplications ?? 0;
  const funnelSteps = [
    {
      label: "Pending",
      value: appStats?.pending ?? 0,
      icon: <Clock className="h-4 w-4" />,
      color: "var(--warning)",
      bg: "var(--highlight-muted)",
    },
    {
      label: "Accepted",
      value: appStats?.accepted ?? 0,
      icon: <ThumbsUp className="h-4 w-4" />,
      color: "var(--success)",
      bg: "var(--secondary)",
    },
    {
      label: "Rejected",
      value: appStats?.rejected ?? 0,
      icon: <ThumbsDown className="h-4 w-4" />,
      color: "var(--destructive)",
      bg: "var(--muted)",
    },
  ];

  return (
    <div className="space-y-6 pb-12">

      {/* ── Hero ── */}
      <HeroBackground showWave>
        <div className="admin-hero-container">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <div className="p-2 rounded-xl" style={{ background: "var(--glass-bg)", backdropFilter: "blur(4px)" }}>
                  <ClipboardCheck className="h-5 w-5 text-white" />
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">Admin Dashboard</h1>
              </div>
              <p className="text-sm ml-11" style={{ color: "rgba(255,255,255,0.6)" }}>
                {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                {" · "}Overview of the nurse staffing platform
              </p>
            </div>

            <div className="flex gap-2 ml-11 sm:ml-0">
              <Button asChild size="sm" className="btn-primary-green">
                <Link href="/admin/nurses">
                  <Users className="h-4 w-4 mr-1.5" />
                  Nurses
                </Link>
              </Button>
              <Button asChild size="sm" className="admin-hero-btn-ghost">
                <Link href="/admin/jobs">
                  <Briefcase className="h-4 w-4 mr-1.5" />
                  Jobs
                </Link>
              </Button>
              {user?.role === "superadmin" && (
                <Button asChild size="sm" className="admin-hero-btn-ghost">
                  <Link href="/admin/staff">
                    <ShieldCheck className="h-4 w-4 mr-1.5" />
                    Staff
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </HeroBackground>

      {/* ── Profile Health Summary ── */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="stats-card">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="stats-icon-green">
                  <CheckCircle2 className="h-6 w-6" style={{ color: "var(--success)" }} />
                </div>
                <div>
                  <p className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>{completeProfiles}</p>
                  <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Complete Profiles</p>
                </div>
              </div>
              {totalNurses > 0 && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>
                    <span>Completion rate</span>
                    <span className="font-semibold">{Math.round((completeProfiles / totalNurses) * 100)}%</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.round((completeProfiles / totalNurses) * 100)}%`, background: "var(--success)" }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="stats-card">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="stats-icon-orange">
                  <XCircle className="h-6 w-6" style={{ color: "var(--highlight)" }} />
                </div>
                <div>
                  <p className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>{pendingReviews}</p>
                  <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Incomplete Profiles</p>
                </div>
              </div>
              {totalNurses > 0 && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>
                    <span>Incomplete rate</span>
                    <span className="font-semibold">{Math.round((pendingReviews / totalNurses) * 100)}%</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.round((pendingReviews / totalNurses) * 100)}%`, background: "var(--highlight)" }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Charts Row ── */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="section-card lg:col-span-2">
          <CardHeader
            className="border-b flex flex-row items-center justify-between space-y-0 rounded-t-lg overflow-hidden"
            style={{ background: "linear-gradient(to right, var(--muted), var(--secondary))", borderColor: "var(--border)" }}
          >
            <CardTitle className="flex items-center gap-3 text-base">
              <div className="section-icon">
                <TrendingUp className="h-5 w-5" style={{ color: "var(--primary)" }} />
              </div>
              Nurse Registrations — Last 7 Days
            </CardTitle>
            <span className="text-xs px-2.5 py-1 rounded-full font-medium"
              style={{ background: "var(--primary-lighter)", color: "var(--primary)" }}>
              {recentRegistrations} total
            </span>
          </CardHeader>
          <CardContent className="p-4 pt-5">
            {totalNurses === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 gap-2" style={{ color: "var(--muted-foreground)" }}>
                <BarChart2 className="h-8 w-8 opacity-30" />
                <p className="text-sm">No registration data yet.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={registrationChartData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                  <defs>
                    <linearGradient id="regGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: string) => v.split(",")[0]}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<RegistrationTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="var(--primary)"
                    strokeWidth={2}
                    fill="url(#regGradient)"
                    dot={{ r: 3, fill: "var(--primary)", strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: "var(--primary)", strokeWidth: 2, stroke: "var(--background)" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="section-card">
          <CardHeader
            className="border-b flex flex-row items-center justify-between space-y-0 rounded-t-lg overflow-hidden"
            style={{ background: "linear-gradient(to right, var(--muted), var(--secondary))", borderColor: "var(--border)" }}
          >
            <CardTitle className="flex items-center gap-3 text-base">
              <div className="section-icon">
                <Briefcase className="h-5 w-5" style={{ color: "var(--primary)" }} />
              </div>
              Job Status
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 flex flex-col items-center justify-center">
            {jobStats?.totalJobs === undefined || jobStats.totalJobs === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 gap-2" style={{ color: "var(--muted-foreground)" }}>
                <Briefcase className="h-8 w-8 opacity-30" />
                <p className="text-sm">No jobs yet.</p>
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={jobStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {jobStatusData.map((entry, index) => (
                        <Cell key={index} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip content={<JobTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex gap-5 mt-1">
                  {jobStatusData.map((entry) => (
                    <div key={entry.name} className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ background: entry.fill }} />
                      <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                        {entry.name}
                        <span className="font-semibold ml-1" style={{ color: "var(--foreground)" }}>{entry.value}</span>
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-xs mt-2" style={{ color: "var(--muted-foreground)" }}>
                  {jobStats?.totalJobs ?? 0} total job{(jobStats?.totalJobs ?? 0) !== 1 ? "s" : ""}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Application Funnel + Platform Snapshot ── */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="section-card">
          <CardHeader
            className="border-b space-y-0 rounded-t-lg overflow-hidden"
            style={{ background: "linear-gradient(to right, var(--muted), var(--secondary))", borderColor: "var(--border)" }}
          >
            <CardTitle className="flex items-center gap-3 text-base">
              <div className="section-icon">
                <ClipboardCheck className="h-5 w-5" style={{ color: "var(--highlight)" }} />
              </div>
              Application Funnel
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            {totalApps === 0 ? (
              <div className="flex flex-col items-center justify-center h-24 gap-2" style={{ color: "var(--muted-foreground)" }}>
                <ClipboardCheck className="h-7 w-7 opacity-30" />
                <p className="text-sm">No applications yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {funnelSteps.map((step) => {
                  const pct = totalApps > 0 ? Math.round((step.value / totalApps) * 100) : 0;
                  return (
                    <div key={step.label}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-7 w-7 rounded-md flex items-center justify-center flex-shrink-0"
                            style={{ background: step.bg, color: step.color }}
                          >
                            {step.icon}
                          </span>
                          <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                            {step.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold" style={{ color: "var(--foreground)" }}>
                            {step.value}
                          </span>
                          <span
                            className="text-xs px-1.5 py-0.5 rounded-full font-semibold min-w-[36px] text-center"
                            style={{ background: step.bg, color: step.color }}
                          >
                            {pct}%
                          </span>
                        </div>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${pct}%`, background: step.color }}
                        />
                      </div>
                    </div>
                  );
                })}
                <p className="text-xs pt-1" style={{ color: "var(--muted-foreground)" }}>
                  {totalApps} total application{totalApps !== 1 ? "s" : ""}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="section-card">
          <CardHeader
            className="border-b space-y-0 rounded-t-lg overflow-hidden"
            style={{ background: "linear-gradient(to right, var(--muted), var(--secondary))", borderColor: "var(--border)" }}
          >
            <CardTitle className="flex items-center gap-3 text-base">
              <div className="section-icon">
                <Sparkles className="h-5 w-5" style={{ color: "var(--accent-foreground)" }} />
              </div>
              Platform Snapshot
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            {platformSnapshot.map((item, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span style={{ color: "var(--muted-foreground)" }}>{item.label}</span>
                  <span className="font-semibold" style={{ color: "var(--foreground)" }}>
                    {item.value}
                    <span style={{ color: "var(--muted-foreground)" }}> / {item.total}</span>
                  </span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: item.total > 0 ? `${Math.round((item.value / item.total) * 100)}%` : "0%",
                      background: item.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* ── Main Grid: Recent Registrations + Top Jobs | Quick Actions ── */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div className="lg:col-span-2 space-y-6">

          {/* Recent Registrations */}
          <Card className="section-card">
            <CardHeader
              className="border-b flex flex-row items-center justify-between space-y-0 rounded-t-lg overflow-hidden"
              style={{ background: "linear-gradient(to right, var(--muted), var(--secondary))", borderColor: "var(--border)" }}
            >
              <CardTitle className="flex items-center gap-3 text-lg">
                <div className="section-icon">
                  <Users className="h-5 w-5" style={{ color: "var(--success)" }} />
                </div>
                Recent Registrations
              </CardTitle>
              {/* ✅ Secondary nav action — outline is correct */}
              <Button asChild variant="outline" size="sm" className="gap-1">
                <Link href="/admin/nurses">
                  View All
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {recentNurses.length === 0 ? (
                <div className="text-center py-12" style={{ color: "var(--muted-foreground)" }}>
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No nurse registrations yet.</p>
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                  {recentNurses.map((nurse) => (
                    <div
                      key={nurse.id}
                      className="flex items-center gap-4 px-5 py-3.5 transition-colors group"
                      style={{ color: "inherit" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--muted)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                    >
                      <NurseInitials first={nurse.first_name} last={nurse.last_name} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-sm truncate" style={{ color: "var(--foreground)" }}>
                            {nurse.first_name} {nurse.last_name}
                          </p>
                          {nurse.profile_complete ? (
                            <span
                              className="inline-flex items-center gap-1 text-[10px] font-semibold rounded-full px-2 py-0.5 border"
                              style={{ background: "var(--secondary)", color: "var(--success)", borderColor: "var(--border)" }}
                            >
                              <CheckCircle2 className="h-2.5 w-2.5" />Complete
                            </span>
                          ) : (
                            <span
                              className="inline-flex items-center gap-1 text-[10px] font-semibold rounded-full px-2 py-0.5 border"
                              style={{ background: "var(--highlight-muted)", color: "var(--warning)", borderColor: "var(--border)" }}
                            >
                              <XCircle className="h-2.5 w-2.5" />Incomplete
                            </span>
                          )}
                        </div>
                        <p className="text-xs truncate mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                          {nurse.user?.email}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-xs" style={{ color: "var(--muted-foreground)" }}>
                          <span className="flex items-center gap-1">
                            <Briefcase className="h-3 w-3" />
                            {nurse.years_of_experience ?? 0} yrs
                          </span>
                          <span className="flex items-center gap-1">
                            <Award className="h-3 w-3" />
                            {nurse.certifications?.length ?? 0} certs
                          </span>
                          <span className="flex items-center gap-1">
                            <Sparkles className="h-3 w-3" />
                            {nurse.skills?.length ?? 0} skills
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="text-xs hidden sm:block" style={{ color: "var(--muted-foreground)" }}>
                          {timeAgo(nurse.updated_at)}
                        </span>
                        <Link href={`/admin/nurses/${nurse.id}`}>
                          <button
                            className="h-8 w-8 rounded-lg flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                            style={{ background: "var(--secondary)", color: "var(--primary)" }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--primary-lighter)")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "var(--secondary)")}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Jobs by Applications */}
          <Card className="section-card">
            <CardHeader
              className="border-b flex flex-row items-center justify-between space-y-0 rounded-t-lg overflow-hidden"
              style={{ background: "linear-gradient(to right, var(--muted), var(--secondary))", borderColor: "var(--border)" }}
            >
              <CardTitle className="flex items-center gap-3 text-base">
                <div className="section-icon">
                  <Briefcase className="h-5 w-5" style={{ color: "var(--primary)" }} />
                </div>
                Top Jobs by Applications
              </CardTitle>
              {/* ✅ Secondary nav action — outline is correct */}
              <Button asChild variant="outline" size="sm" className="gap-1">
                <Link href="/admin/jobs">
                  All Jobs
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {topJobs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2" style={{ color: "var(--muted-foreground)" }}>
                  <Briefcase className="h-7 w-7 opacity-30" />
                  <p className="text-sm">No application data yet.</p>
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                  {topJobs.map((job, idx) => (
                    <Link
                      key={job.id}
                      href={`/admin/jobs/${job.id}`}
                      className="flex items-center gap-4 px-5 py-3.5 transition-colors group"
                      style={{ color: "inherit", display: "flex" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--muted)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                    >
                      <span
                        className="h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{
                          background: idx === 0 ? "var(--primary-lighter)" : "var(--secondary)",
                          color: idx === 0 ? "var(--primary)" : "var(--muted-foreground)",
                        }}
                      >
                        {idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: "var(--foreground)" }}>
                          {job.title}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span
                            className="h-1.5 w-1.5 rounded-full flex-shrink-0"
                            style={{ background: job.is_active ? "var(--success)" : "var(--border)" }}
                          />
                          <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                            {job.is_active ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </div>
                      <span className="text-sm font-bold flex-shrink-0" style={{ color: "var(--primary)" }}>
                        {job.application_count}
                        <span className="text-[10px] font-normal ml-0.5" style={{ color: "var(--muted-foreground)" }}>apps</span>
                      </span>
                      <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" style={{ color: "var(--primary)" }} />
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          <Card className="section-card">
            <CardHeader
              className="border-b space-y-0 rounded-t-lg overflow-hidden"
              style={{ background: "linear-gradient(to right, var(--muted), var(--secondary))", borderColor: "var(--border)" }}
            >
              <CardTitle className="flex items-center gap-3 text-base">
                <div className="section-icon">
                  <TrendingUp className="h-5 w-5" style={{ color: "var(--success)" }} />
                </div>
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2">
              {[
                {
                  href: "/admin/nurses",
                  bg: "var(--secondary)",
                  icon: <Users className="h-5 w-5" style={{ color: "var(--primary)" }} />,
                  label: "All Nurses",
                  sub: "Search & filter nurses",
                },
                {
                  href: "/admin/jobs",
                  bg: "var(--primary-lighter)",
                  icon: <Briefcase className="h-5 w-5" style={{ color: "var(--primary)" }} />,
                  label: "Manage Jobs",
                  sub: "Create & edit postings",
                },
                {
                  href: "/admin/jobs",
                  bg: "var(--highlight-muted)",
                  icon: <ClipboardCheck className="h-5 w-5" style={{ color: "var(--highlight)" }} />,
                  label: "Applications",
                  sub: "Review & update status",
                },
              ].map((action) => (
                <Link
                  key={action.label}
                  href={action.href}
                  className="flex items-center gap-3 p-3.5 rounded-xl transition-all"
                  style={{ color: "inherit" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--muted)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                >
                  <div
                    className="h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: action.bg }}
                  >
                    {action.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{action.label}</p>
                    <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{action.sub}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 flex-shrink-0" style={{ color: "var(--muted-foreground)" }} />
                </Link>
              ))}
            </CardContent>
          </Card>

          {/* Platform Overview */}
          <Card className="section-card">
            <CardHeader
              className="border-b space-y-0 rounded-t-lg overflow-hidden"
              style={{ background: "linear-gradient(to right, var(--muted), var(--secondary))", borderColor: "var(--border)" }}
            >
              <CardTitle className="flex items-center gap-3 text-base">
                <div className="section-icon">
                  <BarChart2 className="h-5 w-5" style={{ color: "var(--primary)" }} />
                </div>
                Platform Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    label: "Total Nurses",
                    value: totalNurses,
                    icon: <Users className="h-4 w-4" />,
                    color: "var(--primary)",
                    bg: "var(--primary-lighter)",
                  },
                  {
                    label: "New (7 days)",
                    value: recentRegistrations,
                    icon: <UserPlus className="h-4 w-4" />,
                    color: "var(--success)",
                    bg: "var(--secondary)",
                  },
                  {
                    label: "Active Jobs",
                    value: activeJobs,
                    icon: <Briefcase className="h-4 w-4" />,
                    color: "var(--highlight)",
                    bg: "var(--highlight-muted)",
                  },
                  {
                    label: "Applications",
                    value: appStats?.totalApplications ?? 0,
                    icon: <ClipboardCheck className="h-4 w-4" />,
                    color: "var(--muted-foreground)",
                    bg: "var(--muted)",
                  },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="rounded-xl p-3 flex items-center gap-2.5"
                    style={{ background: s.bg }}
                  >
                    <span
                      className="h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: "white", color: s.color, opacity: 0.9 }}
                    >
                      {s.icon}
                    </span>
                    <div>
                      <p className="text-xl font-bold leading-none" style={{ color: s.color }}>{s.value}</p>
                      <p className="text-[11px] mt-0.5" style={{ color: "var(--muted-foreground)" }}>{s.label}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t" style={{ borderColor: "var(--border)" }} />

              {(jobStats?.totalJobs ?? 0) > 0 && (
                <div>
                  <div className="flex justify-between text-xs mb-1.5" style={{ color: "var(--muted-foreground)" }}>
                    <span>Jobs active ratio</span>
                    <span className="font-semibold" style={{ color: "var(--foreground)" }}>
                      {activeJobs} / {jobStats?.totalJobs ?? 0}
                      <span className="ml-1 font-normal" style={{ color: "var(--muted-foreground)" }}>
                        ({Math.round((activeJobs / (jobStats?.totalJobs ?? 1)) * 100)}%)
                      </span>
                    </span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.round((activeJobs / (jobStats?.totalJobs ?? 1)) * 100)}%`,
                        background: "var(--success)",
                      }}
                    />
                  </div>
                </div>
              )}

              {/* ✅ Primary CTA — uses btn-primary-green, no inline style override */}
              <Button asChild size="sm" className="w-full gap-2 btn-primary-green">
                <Link href="/admin/jobs/new">
                  <Briefcase className="h-4 w-4" />
                  Post New Job
                </Link>
              </Button>

            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}