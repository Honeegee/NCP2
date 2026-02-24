"use client";

import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Upload,
  FileText,
  User,
  Briefcase,
  Award,
  GraduationCap,
  CheckCircle,
  Mail,
  MapPin,
  Phone,
  Sparkles,
  FileCheck,
  Edit2,
  Building2,
  Plus,
  Trash2,
  Activity,
  MoreVertical,
  Eye,
  Download,
  Stethoscope,
  HeartHandshake,
  Target,
  ShieldCheck,
} from "lucide-react";
import { HeroBackground } from "@/components/shared/HeroBackground";
import type { ExperienceType } from "@/types";
import type {
  NurseFullProfile,
  NurseExperience,
  NurseEducation,
  NurseSkill,
  NurseCertification,
} from "@/types";
import { formatNurseName } from "@/lib/utils";
import React, { useState } from "react";
import { ChangePasswordModal } from "./modals/ChangePasswordModal";

interface ProfileViewProps {
  profile: NurseFullProfile;
  showAdminControls?: boolean;
  nurseId?: string;
  // Edit mode callbacks — presence means editable
  onEditProfile?: () => void;
  onProfilePictureUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDeleteProfilePicture?: () => void;
  uploadingPicture?: boolean;
  // Experience
  onAddExperience?: () => void;
  onEditExperience?: (exp: NurseExperience) => void;
  onDeleteExperience?: (id: string) => void;
  onClearAllExperience?: () => void;
  // Education
  onAddEducation?: () => void;
  onEditEducation?: (edu: NurseEducation) => void;
  onDeleteEducation?: (id: string) => void;
  onClearAllEducation?: () => void;
  // Skills
  onAddSkill?: () => void;
  onEditSkill?: (skill: NurseSkill) => void;
  onDeleteSkill?: (id: string) => void;
  onClearAllSkills?: () => void;
  // Certifications
  onAddCertification?: () => void;
  onEditCertification?: (cert: NurseCertification) => void;
  onDeleteCertification?: (id: string) => void;
  onClearAllCertifications?: () => void;
  // Resume
  onResumeUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploading?: boolean;
  onViewResume?: (id: string) => void;
  onDownloadResume?: (id: string, filename: string) => void;
  onDeleteResume?: (id: string) => void;
}

export function ProfileView({
  profile,
  showAdminControls = false,
  nurseId,
  onEditProfile,
  onProfilePictureUpload,
  onDeleteProfilePicture,
  uploadingPicture = false,
  onAddExperience,
  onEditExperience,
  onDeleteExperience,
  onClearAllExperience,
  onAddEducation,
  onEditEducation,
  onDeleteEducation,
  onClearAllEducation,
  onAddSkill,
  onEditSkill,
  onDeleteSkill,
  onClearAllSkills,
  onAddCertification,
  onEditCertification,
  onDeleteCertification,
  onClearAllCertifications,
  onResumeUpload,
  uploading = false,
  onViewResume,
  onDownloadResume,
  onDeleteResume,
}: ProfileViewProps) {
  const editable = !!onEditProfile;
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);

  const initials = `${(profile.first_name || "N")[0]}${(profile.last_name || "P")[0]}`.toUpperCase();

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    if (isNaN(d.getTime())) return dateStr;
    if (d.getFullYear() < 1950) return "";
    return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  };

  // Profile completeness
  const fields = [
    profile.first_name,
    profile.last_name,
    profile.phone,
    profile.city,
    profile.country,
    profile.bio,
  ];
  const filledFields = fields.filter(Boolean).length;
  const completionPercent = Math.round((filledFields / fields.length) * 100);

  // ─── Experience section definitions ──────────────────────────────────
  type ExperienceSection = {
    type: ExperienceType;
    label: string;
    icon: React.ReactNode;
    rowIcon: React.ReactNode;
    emptyIcon: React.ReactNode;
    iconWrapStyle: React.CSSProperties;
    rowIconStyle: React.CSSProperties;
    labelStyle: React.CSSProperties;
    badgeStyle: React.CSSProperties;
    headerStyle: React.CSSProperties;
  };

  const experienceSections: ExperienceSection[] = [
    {
      type: "employment",
      label: "Work Experience",
      icon: <Briefcase className="h-5 w-5" style={{ color: "var(--success)" }} />,
      rowIcon: <Building2 className="h-4 w-4" style={{ color: "var(--success)" }} />,
      emptyIcon: <Briefcase className="h-8 w-8 mx-auto mb-2 opacity-30" />,
      iconWrapStyle: { background: "var(--secondary)" },
      rowIconStyle: { background: "var(--muted)" },
      labelStyle: { color: "var(--success)" },
      badgeStyle: { background: "var(--secondary)", color: "var(--success)", borderColor: "var(--border)" },
      headerStyle: { background: "linear-gradient(to right, var(--muted), var(--secondary))", borderColor: "var(--border)" },
    },
    {
      type: "clinical_placement",
      label: "Clinical Placements",
      icon: <Stethoscope className="h-5 w-5" style={{ color: "var(--primary)" }} />,
      rowIcon: <Building2 className="h-4 w-4" style={{ color: "var(--primary)" }} />,
      emptyIcon: <Stethoscope className="h-8 w-8 mx-auto mb-2 opacity-30" />,
      iconWrapStyle: { background: "var(--primary-lighter)" },
      rowIconStyle: { background: "var(--secondary)" },
      labelStyle: { color: "var(--primary)" },
      badgeStyle: { background: "var(--secondary)", color: "var(--primary)", borderColor: "var(--border)" },
      headerStyle: { background: "linear-gradient(to right, var(--secondary), var(--primary-lighter))", borderColor: "var(--border)" },
    },
    {
      type: "ojt",
      label: "OJT / Training",
      icon: <Activity className="h-5 w-5" style={{ color: "var(--warning)" }} />,
      rowIcon: <Building2 className="h-4 w-4" style={{ color: "var(--warning)" }} />,
      emptyIcon: <Activity className="h-8 w-8 mx-auto mb-2 opacity-30" />,
      iconWrapStyle: { background: "var(--highlight-muted)" },
      rowIconStyle: { background: "var(--highlight-muted)" },
      labelStyle: { color: "var(--warning)" },
      badgeStyle: { background: "var(--highlight-muted)", color: "var(--warning)", borderColor: "var(--border)" },
      headerStyle: { background: "linear-gradient(to right, var(--highlight-muted), #fff5f0)", borderColor: "var(--border)" },
    },
    {
      type: "volunteer",
      label: "Volunteering",
      icon: <HeartHandshake className="h-5 w-5" style={{ color: "var(--highlight)" }} />,
      rowIcon: <Building2 className="h-4 w-4" style={{ color: "var(--highlight)" }} />,
      emptyIcon: <HeartHandshake className="h-8 w-8 mx-auto mb-2 opacity-30" />,
      iconWrapStyle: { background: "var(--highlight-muted)" },
      rowIconStyle: { background: "var(--highlight-muted)" },
      labelStyle: { color: "var(--highlight)" },
      badgeStyle: { background: "var(--highlight-muted)", color: "var(--highlight)", borderColor: "var(--border)" },
      headerStyle: { background: "linear-gradient(to right, var(--highlight-muted), #fff0f0)", borderColor: "var(--border)" },
    },
  ];

  const allExperience = profile.experience || [];
  const hasAnyExperience = allExperience.length > 0;

  return (
    <div>
      {/* ── Hero Header ─────────────────────────────────────────────────── */}
      <HeroBackground style={{ paddingBottom: "10rem", minHeight: "14rem" }} showWave />

      {/* ── Profile Info (overlapping hero) ─────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 -mt-26 relative z-10">
        {/* Admin controls */}
        {showAdminControls && (
          <div className="flex justify-end mb-3">
            {nurseId && (
              <Link href={`/admin/nurses/${nurseId}/matches`}>
                <Button variant="outline" size="sm">
                  <Target className="h-3.5 w-3.5 mr-1" />
                  View Matches
                </Button>
              </Link>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 mb-8">
          {/* Avatar */}
          <div className={`relative flex-shrink-0${editable ? " group" : ""}`}>
            {profile.profile_picture_url ? (
              <div className="profile-picture relative" style={{ height: "12rem", width: "12rem" }}>
                <Image
                  src={profile.profile_picture_url}
                  alt={formatNurseName(profile.first_name, profile.last_name, profile.professional_status)}
                  fill
                  sizes="192px"
                  className="object-cover"
                  priority
                />
              </div>
            ) : (
              <div
                className="profile-picture flex items-center justify-center text-3xl sm:text-5xl font-bold"
                style={{ height: "12rem", width: "12rem", color: "var(--primary)" }}
              >
                {initials}
              </div>
            )}
            <div className="profile-picture-verified">
              <CheckCircle className="h-5 w-5 text-white" />
            </div>

            {/* Profile Picture Actions — editable only */}
            {editable && onProfilePictureUpload && (
              <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 bg-black/40">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={onProfilePictureUpload}
                    className="hidden"
                    disabled={uploadingPicture}
                  />
                  <div className="h-10 w-10 rounded-lg bg-card flex items-center justify-center hover:bg-muted transition-colors shadow-md">
                    {uploadingPicture ? (
                      <div className="h-4 w-4 border-2 border-t-transparent rounded-full animate-spin border-primary" />
                    ) : (
                      <Upload className="h-5 w-5 text-primary" />
                    )}
                  </div>
                </label>
                {profile.profile_picture_url && onDeleteProfilePicture && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onDeleteProfilePicture}
                    disabled={uploadingPicture}
                    className="h-10 w-10 rounded-lg bg-card hover:bg-muted shadow-md"
                  >
                    <Trash2 className="h-5 w-5 text-destructive" />
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Name / contact info */}
          <div className="flex-1 flex items-center w-full">
            <div className="w-full">
              <div className="flex justify-between items-start mb-3 group">
                <div className="flex-1">
                  <h2 className="text-xl sm:text-3xl font-bold mb-2 text-center sm:text-left" style={{ color: "white" }}>
                    {formatNurseName(profile.first_name, profile.last_name, profile.professional_status)}
                  </h2>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-3 text-xs sm:text-sm mb-3">
                    {(profile.city || profile.country) && (
                      <span className="flex items-center gap-1.5" style={{ color: "var(--primary-light)" }}>
                        <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4" style={{ color: "var(--primary-light)" }} />
                        <span>{profile.city}{profile.city && profile.country ? ", " : ""}{profile.country}</span>
                      </span>
                    )}
                    {profile.user?.email && (
                      <span className="flex items-center gap-2" style={{ color: "var(--primary-light)" }}>
                        <Mail className="h-4 w-4" style={{ color: "var(--primary-light)" }} />
                        <span>{profile.user.email}</span>
                      </span>
                    )}
                    {profile.phone && (
                      <span className="flex items-center gap-2" style={{ color: "var(--primary-light)" }}>
                        <Phone className="h-4 w-4" style={{ color: "var(--primary-light)" }} />
                        <span>{profile.phone}</span>
                      </span>
                    )}
                  </div>
                </div>
                {editable && (
                  <Button id="edit-profile-btn" variant="outline" size="sm" onClick={onEditProfile}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div>
                {profile.bio ? (
                  <p className="text-sm leading-relaxed line-clamp-3 sm:line-clamp-none" style={{ color: "var(--card-foreground)" }}>
                    {profile.bio}
                  </p>
                ) : (
                  <p className="text-sm italic" style={{ color: "var(--muted-foreground)" }}>
                    {editable ? "No professional summary added yet. Click edit to add one." : "No professional summary added."}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats Cards ──────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Experience */}
          <Card className="stats-card">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="stats-icon-green">
                  <Briefcase className="h-6 w-6" style={{ color: "var(--success)" }} />
                </div>
                <div>
                  <p className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>{profile.experience?.length || 0}</p>
                  <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Experience</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Certifications */}
          <Card className="stats-card">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="stats-icon-orange">
                  <Award className="h-6 w-6" style={{ color: "var(--highlight)" }} />
                </div>
                <div>
                  <p className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>{profile.certifications?.length || 0}</p>
                  <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Certifications</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Skills */}
          <Card className="stats-card">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="stats-icon-green" style={{ background: "linear-gradient(135deg, var(--secondary) 0%, var(--primary-lighter) 100%)" }}>
                  <Sparkles className="h-6 w-6" style={{ color: "var(--primary)" }} />
                </div>
                <div>
                  <p className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>{profile.skills?.length || 0}</p>
                  <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Skills</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Completion */}
          <Card className="stats-card">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="stats-icon-green">
                  <User className="h-6 w-6" style={{ color: "var(--success)" }} />
                </div>
                <div>
                  <p className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>{completionPercent}%</p>
                  <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Complete</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Main Grid ────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">

            {/* ── Experience Sections ─────────────────────────────────────── */}
            {!hasAnyExperience ? (
              <Card className="section-card">
                <CardHeader className="border-b flex flex-row items-center justify-between space-y-0 group rounded-t-lg overflow-hidden"
                  style={{ background: "linear-gradient(to right, var(--muted), var(--secondary))", borderColor: "var(--border)" }}>
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <div className="section-icon">
                      <Briefcase className="h-5 w-5" style={{ color: "var(--success)" }} />
                    </div>
                    <div>
                      <span>Experience</span>
                      <p className="text-sm font-normal mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                        {profile.years_of_experience ?? 0} years total experience
                      </p>
                    </div>
                  </CardTitle>
                  {onAddExperience && (
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="sm" onClick={onAddExperience}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="p-6">
                  <div className="text-center py-8" style={{ color: "var(--muted-foreground)" }}>
                    <Briefcase className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No experience added</p>
                    {editable && <p className="text-xs opacity-70 mt-0.5">Upload your resume to auto-populate</p>}
                  </div>
                </CardContent>
              </Card>
            ) : (
              experienceSections
                .filter((s) => s.type === "employment" || allExperience.some((e) => (e.type || "employment") === s.type))
                .map((section) => {
                  const sectionExperience = allExperience
                    .filter((e) => (e.type || "employment") === section.type)
                    .sort((a, b) => new Date(b.start_date || "1900-01-01").getTime() - new Date(a.start_date || "1900-01-01").getTime());

                  return (
                    <Card key={section.type} className="section-card">
                      <CardHeader
                        className="border-b flex flex-row items-center justify-between space-y-0 group rounded-t-lg overflow-hidden"
                        style={section.headerStyle}
                      >
                        <CardTitle className="flex items-center gap-3 text-lg">
                          <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={section.iconWrapStyle}>
                            {section.icon}
                          </div>
                          <div>
                            <span>{section.label}</span>
                            <p className="text-sm font-normal mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                              {section.type === "employment"
                                ? `${profile.years_of_experience ?? 0} years total experience`
                                : `${sectionExperience.length} ${sectionExperience.length === 1 ? "record" : "records"}`}
                            </p>
                          </div>
                        </CardTitle>
                        {(onAddExperience || onClearAllExperience) && (
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {onClearAllExperience && sectionExperience.length > 0 && (
                              <Button variant="ghost" size="sm" onClick={onClearAllExperience}
                                className="hover:bg-red-50"
                                style={{ color: "var(--destructive)" }}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                            {onAddExperience && (
                              <Button variant="ghost" size="sm" onClick={onAddExperience}>
                                <Plus className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        )}
                      </CardHeader>
                      <CardContent className="p-6">
                        {sectionExperience.length > 0 ? (
                          <div className="space-y-0">
                            {sectionExperience.map((exp, index) => (
                              <div key={exp.id} className={`group flex items-start gap-3 py-4 ${index !== 0 ? "border-t border-border/50" : ""}`}>
                                <div className="h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={section.rowIconStyle}>
                                  {section.rowIcon}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                      <p className="font-semibold" style={{ color: "var(--foreground)" }}>{exp.position}</p>
                                      <p className="text-sm font-medium mt-0.5" style={section.labelStyle}>{exp.employer}</p>
                                      <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                                        {exp.department && exp.department}
                                        {exp.department && exp.location && " · "}
                                        {exp.location && exp.location}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                      {(formatDate(exp.start_date) || (exp.end_date && formatDate(exp.end_date))) && (
                                        <Badge variant="outline" className="text-xs font-normal" style={section.badgeStyle}>
                                          {formatDate(exp.start_date)}{formatDate(exp.start_date) && " – "}
                                          {exp.end_date ? formatDate(exp.end_date) : "Present"}
                                        </Badge>
                                      )}
                                      {(onEditExperience || onDeleteExperience) && (
                                        <DropdownMenu>
                                          <DropdownMenuTrigger className="h-7 w-7 p-0 rounded-md opacity-0 group-hover:opacity-100 hover:bg-muted flex items-center justify-center transition-opacity">
                                            <MoreVertical className="h-4 w-4" style={{ color: "var(--muted-foreground)" }} />
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end">
                                            {onEditExperience && (
                                              <DropdownMenuItem onClick={() => onEditExperience(exp)}>
                                                <Edit2 className="h-3.5 w-3.5 mr-2" />Edit
                                              </DropdownMenuItem>
                                            )}
                                            {onDeleteExperience && (
                                              <DropdownMenuItem onClick={() => onDeleteExperience(exp.id)}
                                                className="focus:text-destructive" style={{ color: "var(--destructive)" }}>
                                                <Trash2 className="h-3.5 w-3.5 mr-2" />Delete
                                              </DropdownMenuItem>
                                            )}
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                      )}
                                    </div>
                                  </div>
                                  {exp.description && (
                                    <p className="text-sm mt-2 leading-relaxed whitespace-pre-line" style={{ color: "var(--muted-foreground)" }}>
                                      {exp.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8" style={{ color: "var(--muted-foreground)" }}>
                            {section.emptyIcon}
                            <p className="text-sm">No {section.label.toLowerCase()} added</p>
                            {editable && <p className="text-xs opacity-70 mt-0.5">Upload your resume to auto-populate</p>}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
            )}

            {/* ── Education ───────────────────────────────────────────────── */}
            <Card className="section-card">
              <CardHeader className="border-b flex flex-row items-center justify-between space-y-0 group rounded-t-lg overflow-hidden"
                style={{ background: "linear-gradient(to right, var(--muted), var(--secondary))", borderColor: "var(--border)" }}>
                <CardTitle className="flex items-center gap-3 text-lg">
                  <div className="section-icon">
                    <GraduationCap className="h-5 w-5" style={{ color: "var(--success)" }} />
                  </div>
                  <div>
                    <span>Education</span>
                  </div>
                </CardTitle>
                {(onAddEducation || onClearAllEducation) && (
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {onClearAllEducation && profile.education && profile.education.length > 0 && (
                      <Button variant="ghost" size="sm" onClick={onClearAllEducation}
                        style={{ color: "var(--destructive)" }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                    {onAddEducation && (
                      <Button variant="ghost" size="sm" onClick={onAddEducation}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}
              </CardHeader>
              <CardContent className="p-6">
                {profile.education && profile.education.length > 0 ? (
                  <div className="space-y-0">
                    {profile.education
                      .sort((a, b) => {
                        const yearA = a.graduation_year || new Date(a.end_date || "1900-01-01").getFullYear();
                        const yearB = b.graduation_year || new Date(b.end_date || "1900-01-01").getFullYear();
                        return yearB - yearA;
                      })
                      .map((edu, index) => (
                        <div key={edu.id} className={`group flex items-start gap-3 py-4 ${index !== 0 ? "border-t border-border/50" : ""}`}>
                          <div className="h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                            style={{ background: "var(--secondary)" }}>
                            <GraduationCap className="h-4 w-4" style={{ color: "var(--primary)" }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold" style={{ color: "var(--foreground)" }}>{edu.institution}</p>
                                <p className="text-sm font-medium mt-0.5" style={{ color: "var(--primary)" }}>{edu.degree}</p>
                                <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                                  {edu.field_of_study && edu.field_of_study}
                                  {edu.field_of_study && edu.institution_location && " · "}
                                  {edu.institution_location && edu.institution_location}
                                </p>
                              </div>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <Badge variant="outline" className="text-xs font-normal"
                                  style={{ background: "var(--secondary)", color: "var(--primary)", borderColor: "var(--border)" }}>
                                  {(edu.start_date || edu.end_date) ? (
                                    <>{edu.start_date && new Date(edu.start_date).getFullYear()}{edu.start_date && "–"}{edu.end_date ? new Date(edu.end_date).getFullYear() : "Present"}</>
                                  ) : edu.graduation_year ? `Grad. ${edu.graduation_year}` : "Present"}
                                </Badge>
                                {(onEditEducation || onDeleteEducation) && (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger className="h-7 w-7 p-0 rounded-md opacity-0 group-hover:opacity-100 hover:bg-muted flex items-center justify-center transition-opacity">
                                      <MoreVertical className="h-4 w-4" style={{ color: "var(--muted-foreground)" }} />
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      {onEditEducation && (
                                        <DropdownMenuItem onClick={() => onEditEducation(edu)}>
                                          <Edit2 className="h-3.5 w-3.5 mr-2" />Edit
                                        </DropdownMenuItem>
                                      )}
                                      {onDeleteEducation && (
                                        <DropdownMenuItem onClick={() => onDeleteEducation(edu.id)}
                                          style={{ color: "var(--destructive)" }}>
                                          <Trash2 className="h-3.5 w-3.5 mr-2" />Delete
                                        </DropdownMenuItem>
                                      )}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8" style={{ color: "var(--muted-foreground)" }}>
                    <GraduationCap className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No education added</p>
                    {editable && <p className="text-xs opacity-70 mt-0.5">Upload your resume to auto-populate</p>}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ── Skills ──────────────────────────────────────────────────── */}
            <Card className="section-card">
              <CardHeader className="border-b flex flex-row items-center justify-between space-y-0 group rounded-t-lg overflow-hidden"
                style={{ background: "linear-gradient(to right, var(--muted), var(--secondary))", borderColor: "var(--border)" }}>
                <CardTitle className="flex items-center gap-3 text-lg">
                  <div className="section-icon">
                    <Sparkles className="h-5 w-5" style={{ color: "var(--accent-foreground)" }} />
                  </div>
                  <div>
                    <span>Skills</span>
                    <p className="text-sm font-normal mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                      {profile.skills?.length ?? 0} {profile.skills?.length === 1 ? "skill" : "skills"} listed
                    </p>
                  </div>
                </CardTitle>
                {(onAddSkill || onClearAllSkills) && (
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {onClearAllSkills && profile.skills && profile.skills.length > 0 && (
                      <Button variant="ghost" size="sm" onClick={onClearAllSkills}
                        style={{ color: "var(--destructive)" }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                    {onAddSkill && (
                      <Button variant="ghost" size="sm" onClick={onAddSkill}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}
              </CardHeader>
              <CardContent className="p-6">
                {profile.skills && profile.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((skill) => (
                      editable && onEditSkill ? (
                        <div
                          key={skill.id}
                          className="skill-badge group relative cursor-pointer"
                          onClick={() => onEditSkill(skill)}
                        >
                          {skill.skill_name}
                          {onDeleteSkill && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => { e.stopPropagation(); onDeleteSkill(skill.id); }}
                              className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-card shadow hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity"
                              aria-label="Delete skill"
                            >
                              <svg className="h-3 w-3 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </Button>
                          )}
                        </div>
                      ) : (
                        <div key={skill.id} className="skill-badge">
                          {skill.skill_name}
                        </div>
                      )
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8" style={{ color: "var(--muted-foreground)" }}>
                    <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No skills added</p>
                    {editable && <p className="text-xs opacity-70 mt-0.5">Upload your resume to auto-populate</p>}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ── Right Sidebar ─────────────────────────────────────────────── */}
          <div className="space-y-6">

            {/* Profile Strength */}
            <Card className="section-card overflow-hidden">
              <CardHeader className="border-b"
                style={{ background: "linear-gradient(to right, var(--muted), var(--secondary))", borderColor: "var(--border)" }}>
                <CardTitle className="flex items-center gap-3 text-base">
                  <div className="section-icon">
                    <Activity className="h-5 w-5" style={{ color: "var(--success)" }} />
                  </div>
                  <span>Profile Strength</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-3">
                      <span className="font-bold text-base">
                        {completionPercent < 50 ? "Beginner" : completionPercent < 80 ? "Intermediate" : "All-star"}
                      </span>
                      <span className="font-bold text-lg">{completionPercent}%</span>
                    </div>
                    <div className="h-2 rounded-full w-full overflow-hidden" style={{ background: "var(--border)" }}>
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${completionPercent}%`,
                          background: completionPercent < 50
                            ? "var(--warning)"
                            : completionPercent < 80
                              ? "var(--highlight)"
                              : "var(--success)",
                        }}
                      />
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p className="font-medium">Improve your profile:</p>
                    {!profile.bio && (
                      <div className="flex items-start gap-2" style={{ color: "var(--muted-foreground)" }}>
                        <div className="h-1.5 w-1.5 rounded-full mt-1.5" style={{ background: "var(--muted-foreground)" }} />
                        <span>Add a professional summary</span>
                      </div>
                    )}
                    {!profile.phone && (
                      <div className="flex items-start gap-2" style={{ color: "var(--muted-foreground)" }}>
                        <div className="h-1.5 w-1.5 rounded-full mt-1.5" style={{ background: "var(--muted-foreground)" }} />
                        <span>Add contact information</span>
                      </div>
                    )}
                    {(!profile.experience || profile.experience.length === 0) && (
                      <div className="flex items-start gap-2" style={{ color: "var(--muted-foreground)" }}>
                        <div className="h-1.5 w-1.5 rounded-full mt-1.5" style={{ background: "var(--muted-foreground)" }} />
                        <span>Add work experience</span>
                      </div>
                    )}
                    {(!profile.skills || profile.skills.length === 0) && (
                      <div className="flex items-start gap-2" style={{ color: "var(--muted-foreground)" }}>
                        <div className="h-1.5 w-1.5 rounded-full mt-1.5" style={{ background: "var(--muted-foreground)" }} />
                        <span>List your skills</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Certifications */}
            <Card className="section-card">
              <CardHeader className="border-b flex flex-row items-center justify-between space-y-0 group rounded-t-lg overflow-hidden"
                style={{ background: "linear-gradient(to right, var(--muted), var(--secondary))", borderColor: "var(--border)" }}>
                <CardTitle className="flex items-center gap-3 text-base">
                  <div className="section-icon">
                    <Award className="h-5 w-5" style={{ color: "var(--success)" }} />
                  </div>
                  <div>
                    <span>Certifications</span>
                    <p className="text-sm font-normal mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                      {profile.certifications?.length ?? 0} total
                    </p>
                  </div>
                </CardTitle>
                {(onAddCertification || onClearAllCertifications) && (
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {onClearAllCertifications && profile.certifications && profile.certifications.length > 0 && (
                      <Button variant="ghost" size="sm" onClick={onClearAllCertifications}
                        style={{ color: "var(--destructive)" }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                    {onAddCertification && (
                      <Button variant="ghost" size="sm" onClick={onAddCertification}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}
              </CardHeader>
              <CardContent className="p-6">
                {profile.certifications && profile.certifications.length > 0 ? (
                  <div className="space-y-4">
                    {profile.certifications.map((cert, index) => (
                      <div key={cert.id} className={`group flex items-start justify-between gap-2 ${index !== 0 ? "border-t border-border/50 pt-4" : ""}`}>
                        <div className="flex items-start gap-3">
                          <div className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                            style={{ background: "var(--secondary)" }}>
                            <Award className="h-4 w-4" style={{ color: "var(--primary)" }} />
                          </div>
                          <div>
                            <p className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>{cert.cert_type}</p>
                            {cert.verified && (
                              <p className="text-xs font-medium flex items-center gap-1 mt-0.5" style={{ color: "var(--success)" }}>
                                <CheckCircle className="h-3 w-3" />Verified
                              </p>
                            )}
                          </div>
                        </div>
                        {(onEditCertification || onDeleteCertification) && (
                          <DropdownMenu>
                            <DropdownMenuTrigger className="h-7 w-7 p-0 rounded-md opacity-0 group-hover:opacity-100 hover:bg-muted flex items-center justify-center transition-opacity">
                              <MoreVertical className="h-4 w-4" style={{ color: "var(--muted-foreground)" }} />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {onEditCertification && (
                                <DropdownMenuItem onClick={() => onEditCertification(cert)}>
                                  <Edit2 className="h-3.5 w-3.5 mr-2" />Edit
                                </DropdownMenuItem>
                              )}
                              {onDeleteCertification && (
                                <DropdownMenuItem onClick={() => onDeleteCertification(cert.id)}
                                  style={{ color: "var(--destructive)" }}>
                                  <Trash2 className="h-3.5 w-3.5 mr-2" />Delete
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8" style={{ color: "var(--muted-foreground)" }}>
                    <Award className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No certifications yet</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Resume — always visible; upload area only for editable */}
            {(onResumeUpload || (profile.resumes && profile.resumes.length > 0)) && (
              <Card id="resume-upload-card" className="section-card overflow-hidden">
                <CardHeader className="border-b"
                  style={{ background: "linear-gradient(to right, var(--muted), var(--secondary))", borderColor: "var(--border)" }}>
                  <CardTitle className="flex items-center gap-3 text-base">
                    <div className="section-icon">
                      <FileText className="h-5 w-5" style={{ color: "var(--success)" }} />
                    </div>
                    <span>Resume</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    {/* Upload area — nurse only */}
                    {onResumeUpload && (
                      <label className="block cursor-pointer">
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={onResumeUpload}
                          className="hidden"
                          disabled={uploading}
                        />
                        <div className="border-2 border-dashed rounded-lg p-4 text-center transition-colors"
                          style={{
                            borderColor: "var(--border)",
                            color: "var(--muted-foreground)",
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLDivElement).style.borderColor = "var(--primary)";
                            (e.currentTarget as HTMLDivElement).style.background = "var(--accent)";
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)";
                            (e.currentTarget as HTMLDivElement).style.background = "";
                          }}>
                          {uploading ? (
                            <div className="flex items-center justify-center gap-2">
                              <div className="h-4 w-4 border-2 border-t-transparent rounded-full animate-spin"
                                style={{ borderColor: "var(--primary)" }} />
                              <span className="text-sm">Processing...</span>
                            </div>
                          ) : (
                            <>
                              <Upload className="h-8 w-8 mx-auto mb-2" style={{ color: "var(--muted-foreground)" }} />
                              <p className="text-sm font-medium">Upload Resume</p>
                              <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>PDF or Word format</p>
                            </>
                          )}
                        </div>
                      </label>
                    )}

                    {/* Resume list — always visible */}
                    {profile.resumes && profile.resumes.length > 0 && (
                      <div className={`space-y-2${onResumeUpload ? " pt-2" : ""}`}>
                        {profile.resumes.map((resume) => (
                          <div key={resume.id} className="flex items-center gap-2 p-2 rounded text-sm group"
                            style={{ background: "var(--muted)" }}>
                            <FileCheck className="h-4 w-4 flex-shrink-0" style={{ color: "var(--success)" }} />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium truncate">{resume.original_filename}</p>
                              <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                                {new Date(resume.uploaded_at).toLocaleDateString()}
                              </p>
                            </div>
                            {onViewResume && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onViewResume(resume.id)}
                                className="h-6 w-6 opacity-0 group-hover:opacity-100"
                                title="View resume"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            {onDownloadResume && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onDownloadResume(resume.id, resume.original_filename)}
                                className="h-6 w-6 opacity-0 group-hover:opacity-100"
                                title="Download resume"
                              >
                                <Download className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            {onDeleteResume && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onDeleteResume(resume.id)}
                                className="h-6 w-6 opacity-0 group-hover:opacity-100"
                                title="Delete resume"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Bottom spacing */}
      <div className="h-8" />

      {/* Access & Security (Bottom of right column) */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 mt-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-start-3">
            <Card className="section-card overflow-hidden shadow-sm">
              <CardHeader className="bg-muted/30 border-b p-4">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">Access & Security</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Account Status</span>
                  <Badge variant="outline" className="font-bold border-success/20 text-success bg-success/5 uppercase">
                    ACTIVE
                  </Badge>
                </div>
                <div className="pt-2 border-t">
                  <Button
                    variant="outline"
                    className="w-full text-sm font-semibold rounded-xl hover:bg-primary hover:text-white transition-all active:scale-95"
                    onClick={() => setPasswordModalOpen(true)}
                  >
                    Change Password
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <ChangePasswordModal
        open={passwordModalOpen}
        onOpenChange={setPasswordModalOpen}
      />
    </div>
  );
}
