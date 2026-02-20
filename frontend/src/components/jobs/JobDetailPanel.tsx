import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  MapPin,
  Building,
  Clock,
  DollarSign,
  CheckCircle,
  XCircle,
  Briefcase,
  CalendarDays,
  Target,
  Send,
  Pencil,
  Power,
  PowerOff,
  Trash2,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MatchScoreCircle } from "./MatchScoreCircle";
import type { Job, JobMatch } from "@/types";

interface JobDetailPanelProps {
  jobMatch: JobMatch | null;
  isApplied: boolean;
  onApply: () => void;
  applyLoading: boolean;
  mode?: "nurse" | "admin";
  onEdit?: (job: Job) => void;
  onToggleActive?: (job: Job) => void;
  onDelete?: (job: Job) => void;
  actionLoading?: boolean;
  applicationCount?: number;
  onViewApplicants?: (jobId: string) => void;
}

export function JobDetailPanel({
  jobMatch,
  isApplied,
  onApply,
  applyLoading,
  mode = "nurse",
  onEdit,
  onToggleActive,
  onDelete,
  actionLoading,
  applicationCount,
  onViewApplicants,
}: JobDetailPanelProps) {
  const isAdmin = mode === "admin";

  if (!jobMatch) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="text-center">
          <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3">
            <Briefcase className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground text-sm">Select a job to view details</p>
        </div>
      </div>
    );
  }

  const { job } = jobMatch;
  const score = jobMatch.match_score;

  return (
    <div className="sticky top-20">
      <Card className="border shadow-sm max-h-[calc(100vh-3rem)] overflow-y-auto">
        <CardContent className="py-5 space-y-5">

          {/* ── Header ── */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">

              {/* Title + badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold leading-tight">{job.title}</h2>

                {isAdmin ? (
                  <>
                    {/* Active/Inactive dot badge */}
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 text-xs font-medium rounded-full px-2 py-0.5 border",
                        job.is_active
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-gray-100 text-gray-500 border-gray-200"
                      )}
                    >
                      <span
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          job.is_active ? "bg-green-500" : "bg-gray-400"
                        )}
                      />
                      {job.is_active ? "Active" : "Inactive"}
                    </span>

                    {/* Applicant count — clickable if > 0 */}
                    {applicationCount !== undefined && (
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs gap-1 font-medium",
                          applicationCount > 0 && onViewApplicants
                            ? "cursor-pointer hover:bg-primary/10 hover:border-primary/30 transition-colors"
                            : "text-muted-foreground"
                        )}
                        onClick={() =>
                          applicationCount > 0 && onViewApplicants?.(job.id)
                        }
                      >
                        <Users className="h-3 w-3" />
                        {applicationCount}{" "}
                        {applicationCount === 1 ? "applicant" : "applicants"}
                      </Badge>
                    )}
                  </>
                ) : (
                  score >= 80 && (
                    <Badge className="gradient-primary border-0 text-white text-xs">
                      Top Match
                    </Badge>
                  )
                )}
              </div>

              {/* Meta row — now as pill chips instead of raw text */}
              <div className="flex flex-wrap gap-2">
                <MetaChip icon={<Building className="h-3.5 w-3.5" />} label={job.facility_name} strong />
                <MetaChip icon={<MapPin className="h-3.5 w-3.5" />} label={job.location} />
                <MetaChip icon={<Clock className="h-3.5 w-3.5" />} label={job.employment_type} capitalize />
                {(job.salary_min || job.salary_max) && (
                  <MetaChip
                    icon={<DollarSign className="h-3.5 w-3.5" />}
                    label={`${job.salary_currency} ${job.salary_min?.toLocaleString()}${job.salary_max ? `–${job.salary_max.toLocaleString()}` : ""}`}
                  />
                )}
                <MetaChip
                  icon={<CalendarDays className="h-3.5 w-3.5" />}
                  label={`Posted ${new Date(job.created_at).toLocaleDateString()}`}
                />
              </div>
            </div>

            {/* Right-side actions */}
            {isAdmin ? (
              <div className="flex items-center gap-1 flex-shrink-0">
                {onViewApplicants && (
                  <ActionButton
                    onClick={() => onViewApplicants(job.id)}
                    title="View applicants"
                    className="text-primary hover:bg-primary/10 hover:border-primary/30"
                  >
                    <Users className="h-4 w-4" />
                  </ActionButton>
                )}
                <ActionButton
                  onClick={() => onEdit?.(job)}
                  title="Edit job"
                >
                  <Pencil className="h-4 w-4" />
                </ActionButton>
                <ActionButton
                  onClick={() => onToggleActive?.(job)}
                  disabled={actionLoading}
                  title={job.is_active ? "Deactivate job" : "Activate job"}
                  className={
                    job.is_active
                      ? "text-orange-600 hover:bg-orange-50 hover:border-orange-200"
                      : "text-green-600 hover:bg-green-50 hover:border-green-200"
                  }
                >
                  {actionLoading ? (
                    <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                  ) : job.is_active ? (
                    <PowerOff className="h-4 w-4" />
                  ) : (
                    <Power className="h-4 w-4" />
                  )}
                </ActionButton>
                <ActionButton
                  onClick={() => onDelete?.(job)}
                  disabled={actionLoading}
                  title="Delete job permanently"
                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 hover:border-destructive/20"
                >
                  <Trash2 className="h-4 w-4" />
                </ActionButton>
              </div>
            ) : score > 0 ? (
              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                <MatchScoreCircle score={score} size="lg" />
                <span className="text-xs text-muted-foreground">Match</span>
              </div>
            ) : null}
          </div>

          {/* ── Apply button (nurse mode) ── */}
          {!isAdmin && (
            <div className="flex items-center gap-3">
              <Button
                onClick={onApply}
                disabled={isApplied || applyLoading}
                size="lg"
                className={
                  isApplied
                    ? "bg-emerald-600 hover:bg-emerald-600 cursor-default"
                    : "btn-primary-green border-0"
                }
              >
                {applyLoading ? (
                  <>
                    <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    Applying...
                  </>
                ) : isApplied ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-1.5" />
                    Applied
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-1.5" />
                    Apply Now
                  </>
                )}
              </Button>
              {isApplied && (
                <span className="text-xs text-muted-foreground">
                  You&apos;ve already applied to this position
                </span>
              )}
            </div>
          )}

          <Separator />

          {/* ── Job Description ── */}
          <div>
            <SectionHeading>Job Description</SectionHeading>
            <div className="mt-2 rounded-lg bg-muted/50 border border-border px-4 py-3">
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {job.description}
              </p>
            </div>
          </div>

          <Separator />

          {/* ── Requirements ── */}
          <div className="space-y-4">
            <SectionHeading>Requirements</SectionHeading>

            {/* Experience */}
            <div>
              <SubLabel>Experience</SubLabel>
              {isAdmin ? (
                <p className="text-sm mt-1">
                  Minimum {job.min_experience_years} year
                  {job.min_experience_years !== 1 ? "s" : ""} of experience
                </p>
              ) : (
                <div className="flex items-center gap-2 mt-1">
                  {jobMatch.experience_match ? (
                    <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  )}
                  <span className="text-sm">
                    Minimum {job.min_experience_years} year
                    {job.min_experience_years !== 1 ? "s" : ""} of experience
                  </span>
                </div>
              )}
            </div>

            {/* Certifications */}
            {job.required_certifications.length > 0 && (
              <div>
                <SubLabel>Certifications</SubLabel>
                <div className="flex flex-wrap gap-2 mt-2">
                  {job.required_certifications.map((cert) => {
                    if (isAdmin) {
                      return (
                        <Badge key={cert} variant="secondary" className="text-xs">
                          {cert}
                        </Badge>
                      );
                    }
                    const matched = jobMatch.matched_certifications.includes(
                      cert.toLowerCase()
                    );
                    return (
                      <Badge
                        key={cert}
                        variant={matched ? "default" : "outline"}
                        className={cn(
                          "text-xs gap-1",
                          matched
                            ? "bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                            : "text-muted-foreground"
                        )}
                      >
                        {matched ? (
                          <CheckCircle className="h-3 w-3" />
                        ) : (
                          <XCircle className="h-3 w-3" />
                        )}
                        {cert}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Skills */}
            {job.required_skills.length > 0 && (
              <div>
                <SubLabel>Skills</SubLabel>
                <div className="flex flex-wrap gap-2 mt-2">
                  {job.required_skills.map((skill) => {
                    if (isAdmin) {
                      return (
                        <Badge key={skill} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      );
                    }
                    const matched = jobMatch.matched_skills.includes(
                      skill.toLowerCase()
                    );
                    return (
                      <Badge
                        key={skill}
                        variant="outline"
                        className={cn(
                          "text-xs gap-1",
                          matched
                            ? "border-primary/30 text-primary bg-primary/5"
                            : "text-muted-foreground"
                        )}
                      >
                        {matched ? (
                          <CheckCircle className="h-3 w-3" />
                        ) : (
                          <XCircle className="h-3 w-3" />
                        )}
                        {skill}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* ── Job Details grid ── */}
          <div>
            <SectionHeading>Job Details</SectionHeading>
            <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
              <DetailCell icon={<Briefcase className="h-4 w-4 text-muted-foreground" />} label="Type">
                <span className="capitalize">{job.employment_type}</span>
              </DetailCell>
              <DetailCell icon={<MapPin className="h-4 w-4 text-muted-foreground" />} label="Location">
                {job.location}
              </DetailCell>
              {(job.salary_min || job.salary_max) && (
                <DetailCell icon={<DollarSign className="h-4 w-4 text-muted-foreground" />} label="Salary">
                  {job.salary_currency} {job.salary_min?.toLocaleString()}
                  {job.salary_max && `–${job.salary_max.toLocaleString()}`}
                </DetailCell>
              )}
              <DetailCell icon={<Target className="h-4 w-4 text-muted-foreground" />} label="Min. Experience">
                {job.min_experience_years} yr{job.min_experience_years !== 1 ? "s" : ""}
              </DetailCell>
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}

/* ── Small helper components ── */

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h3 className="font-semibold text-base">{children}</h3>;
}

function SubLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
      {children}
    </p>
  );
}

function MetaChip({
  icon,
  label,
  strong,
  capitalize,
}: {
  icon: React.ReactNode;
  label: string;
  strong?: boolean;
  capitalize?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs rounded-md px-2 py-1 border border-border bg-muted/50",
        strong ? "font-medium text-foreground" : "text-muted-foreground",
        capitalize && "capitalize"
      )}
    >
      {icon}
      {label}
    </span>
  );
}

function ActionButton({
  children,
  onClick,
  title,
  disabled,
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  title?: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "h-8 w-8 rounded-md border border-border flex items-center justify-center",
        "text-muted-foreground transition-all duration-150",
        "hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
    >
      {children}
    </button>
  );
}

function DetailCell({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <p className="font-medium text-sm">{children}</p>
      </div>
    </div>
  );
}