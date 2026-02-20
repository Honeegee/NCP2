import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Building, Sparkles, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { MatchScoreCircle } from "./MatchScoreCircle";
import type { JobMatch } from "@/types";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function isNewJob(createdAt: string): boolean {
  return Date.now() - new Date(createdAt).getTime() < SEVEN_DAYS_MS;
}

interface JobSidebarCardProps {
  match: JobMatch;
  isSelected: boolean;
  isApplied: boolean;
  onClick: () => void;
  showMatchScore: boolean;
  showStatusBadge?: boolean;
  applicationCount?: number;
}

export function JobSidebarCard({
  match,
  isSelected,
  isApplied,
  onClick,
  showMatchScore,
  showStatusBadge,
  applicationCount,
}: JobSidebarCardProps) {
  const isNew = isNewJob(match.job.created_at);

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all duration-200 hover:shadow-md group",
        "border hover:border-primary/40",
        isSelected
          ? "border-primary bg-primary/5 shadow-md ring-1 ring-primary/20"
          : "border-border shadow-sm hover:bg-secondary/40"
      )}
      onClick={onClick}
    >
      <CardContent className="py-3.5 px-4">
        <div className="flex items-start justify-between gap-3">
          {/* Left: content */}
          <div className="min-w-0 flex-1 space-y-1">
            {/* Title + status indicator */}
            <div className="flex items-start gap-1.5">
              {showStatusBadge && (
                <span
                  className={cn(
                    "mt-1.5 h-1.5 w-1.5 rounded-full flex-shrink-0",
                    match.job.is_active ? "bg-green-500" : "bg-gray-300"
                  )}
                />
              )}
              <h3
                className={cn(
                  "font-semibold text-sm leading-snug",
                  isSelected ? "text-primary" : "text-foreground group-hover:text-primary transition-colors"
                )}
              >
                {match.job.title}
              </h3>
            </div>

            {/* Facility */}
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Building className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{match.job.facility_name}</span>
            </p>

            {/* Location */}
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{match.job.location}</span>
            </p>

            {/* Tags row */}
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              <Badge
                variant="secondary"
                className="text-[10px] capitalize px-1.5 py-0 h-4 font-medium"
              >
                {match.job.employment_type}
              </Badge>

              {isNew && (
                <Badge className="bg-blue-50 text-blue-600 border border-blue-200 text-[10px] px-1.5 py-0 h-4 gap-0.5 font-medium">
                  <Sparkles className="h-2.5 w-2.5" />
                  New
                </Badge>
              )}

              {match.job.salary_min && (
                <span className="text-[10px] text-muted-foreground font-medium">
                  {match.job.salary_currency}{" "}
                  {match.job.salary_min.toLocaleString()}
                  {match.job.salary_max &&
                    `–${match.job.salary_max.toLocaleString()}`}
                </span>
              )}
            </div>
          </div>

          {/* Right: score / badges */}
          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
            {showMatchScore && match.match_score > 0 && (
              <MatchScoreCircle score={match.match_score} size="sm" />
            )}

            {showStatusBadge ? (
              // Admin mode: applicant count pill
              applicationCount !== undefined ? (
                <span
                  className={cn(
                    "inline-flex items-center gap-0.5 text-[10px] font-medium",
                    "rounded-full px-1.5 py-0 h-4",
                    applicationCount > 0
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  <Users className="h-2.5 w-2.5" />
                  {applicationCount}
                </span>
              ) : null
            ) : isApplied ? (
              <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px] px-1.5 py-0 h-4">
                Applied
              </Badge>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}