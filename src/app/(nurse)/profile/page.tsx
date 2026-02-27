"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api-client";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import type { ExperienceType, AdminProfile } from "@/types";
import type { NurseFullProfile, NurseExperience, NurseEducation, NurseSkill, NurseCertification } from "@/types";
import ExperienceModal from "@/components/profile/modals/ExperienceModal";
import EducationModal from "@/components/profile/modals/EducationModal";
import SkillsModal from "@/components/profile/modals/SkillsModal";
import CertificationsModal from "@/components/profile/modals/CertificationsModal";
import ProfileEditModal from "@/components/profile/modals/ProfileEditModal";
import AdminProfileEditModal from "@/components/profile/modals/AdminProfileEditModal";
import { ProfileView } from "@/components/profile/ProfileView";
import { AdminProfileView } from "@/components/profile/AdminProfileView";
import { startOnboardingTour } from "@/lib/onboarding-tour";

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="relative mx-auto h-12 w-12">
            <div className="absolute inset-0 rounded-full border-4 border-muted" />
            <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          </div>
          <p className="text-sm text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    }>
      <ProfilePageContent />
    </Suspense>
  );
}

function ProfilePageContent() {
  const { user, refreshProfile } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [profile, setProfile] = useState<NurseFullProfile | null>(null);
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [profileEditModalOpen, setProfileEditModalOpen] = useState(false);
  const [adminProfileEditOpen, setAdminProfileEditOpen] = useState(false);

  // Experience modal
  const [experienceModalOpen, setExperienceModalOpen] = useState(false);
  const [editingExperience, setEditingExperience] = useState<NurseExperience | null>(null);

  // Education modal
  const [educationModalOpen, setEducationModalOpen] = useState(false);
  const [editingEducation, setEditingEducation] = useState<NurseEducation | null>(null);

  // Skills modal
  const [skillsModalOpen, setSkillsModalOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<NurseSkill | null>(null);

  // Certifications modal
  const [certificationsModalOpen, setCertificationsModalOpen] = useState(false);
  const [editingCertification, setEditingCertification] = useState<NurseCertification | null>(null);

  const isAdmin = user?.role === "admin" || user?.role === "superadmin";

  const fetchProfile = useCallback(async () => {
    try {
      if (isAdmin) {
        const data = await api.get<AdminProfile>("/users/me/profile");
        setAdminProfile(data);
      } else {
        const data = await api.get<NurseFullProfile>("/nurses/me");
        setProfile(data);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user, fetchProfile]);

  // Trigger onboarding tour for new SSO users
  useEffect(() => {
    if (!loading && searchParams.get("tour") === "welcome") {
      startOnboardingTour(true);
      window.history.replaceState({}, "", "/profile");
    }
  }, [loading, searchParams]);

  // ─── Profile editing ──────────────────────────────────────────────────
  const handleSaveProfile = async (data: any) => {
    try {
      if (isAdmin) {
        await api.patch("/users/me/profile", data);
      } else {
        await api.put("/nurses/" + profile?.id, data);
      }
      toast.success("Profile updated successfully!");
      setProfileEditModalOpen(false);
      setAdminProfileEditOpen(false);
      fetchProfile();
      await refreshProfile();
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Failed to update profile";
      toast.error(message);
    }
  };

  // ─── Profile picture ──────────────────────────────────────────────
  const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPicture(true);
    const fd = new FormData();
    fd.append("file", file);

    try {
      if (isAdmin) {
        await api.upload("/users/me/profile-picture", fd);
        toast.success("Profile picture updated!");
      } else {
        const data = await api.upload<{ message?: string }>("/nurses/me/profile-picture", fd);
        toast.success(data.message || "Profile picture updated!");
      }
      fetchProfile();
      await refreshProfile();
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Upload failed";
      toast.error(message);
    } finally {
      setUploadingPicture(false);
    }
  };

  const handleDeleteProfilePicture = async () => {
    if (!confirm("Remove profile picture?")) return;
    try {
      if (isAdmin) {
        await api.delete("/users/me/profile-picture");
      } else {
        await api.delete("/nurses/me/profile-picture");
      }
      toast.success("Profile picture removed");
      fetchProfile();
      await refreshProfile();
    } catch (error) {
      toast.error("Failed to remove profile picture");
    }
  };

  // ─── Nurse Specific Handlers (Experience, etc.) ────────────────────────
  // ... (keeping them for nurse role)

  const handleOpenExperienceModal = (exp?: NurseExperience) => {
    setEditingExperience(exp ?? null);
    setExperienceModalOpen(true);
  };

  const handleSaveExperience = async (data: any) => {
    if (!profile) return;
    try {
      if (editingExperience) {
        await api.put("/nurses/me/experience/" + editingExperience.id, data);
      } else {
        await api.post("/nurses/me/experience", data);
      }
      toast.success(editingExperience ? "Experience updated!" : "Experience added!");
      setExperienceModalOpen(false);
      fetchProfile();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Something went wrong");
    }
  };

  const handleDeleteExperience = async (id: string) => {
    if (!confirm("Delete this experience?")) return;
    try {
      await api.delete("/nurses/me/experience/" + id);
      toast.success("Experience deleted!");
      fetchProfile();
    } catch (error) {
      toast.error("Failed to delete experience");
    }
  };

  const handleClearAllExperience = async () => {
    if (!confirm("Delete ALL entries?")) return;
    try {
      await api.delete("/nurses/me/experience");
      fetchProfile();
    } catch (error) {
      toast.error("Failed to clear experience");
    }
  };

  // ... (Education, Skills, Certs, Resume handlers truncated for brevity in this call, 
  // but they should remain in the file)

  const handleOpenEducationModal = (edu?: NurseEducation) => {
    setEditingEducation(edu ?? null);
    setEducationModalOpen(true);
  };
  const handleSaveEducation = async (data: any) => {
    try {
      if (editingEducation) await api.put("/nurses/me/education/" + editingEducation.id, data);
      else await api.post("/nurses/me/education", data);
      setEducationModalOpen(false); fetchProfile();
    } catch (error) { toast.error("Error saving education"); }
  };
  const handleDeleteEducation = async (id: string) => {
    if (confirm("Delete?")) { await api.delete("/nurses/me/education/" + id); fetchProfile(); }
  };
  const handleClearAllEducation = async () => {
    if (confirm("Clear all?")) { await api.delete("/nurses/me/education"); fetchProfile(); }
  };

  const handleOpenSkillsModal = (skill?: NurseSkill) => {
    setEditingSkill(skill ?? null); setSkillsModalOpen(true);
  };
  const handleSaveSkill = async (data: any) => {
    try {
      if (editingSkill) await api.put("/nurses/me/skills/" + editingSkill.id, { ...data, proficiency: "basic" });
      else await api.post("/nurses/me/skills", { ...data, proficiency: "basic" });
      setSkillsModalOpen(false); fetchProfile();
    } catch (error) { toast.error("Error saving skill"); }
  };
  const handleDeleteSkill = async (id: string) => {
    await api.delete("/nurses/me/skills/" + id); fetchProfile();
  };
  const handleClearAllSkills = async () => {
    await api.delete("/nurses/me/skills"); fetchProfile();
  };

  const handleOpenCertificationsModal = (cert?: NurseCertification) => {
    setEditingCertification(cert ?? null); setCertificationsModalOpen(true);
  };
  const handleSaveCertification = async (data: any) => {
    try {
      if (editingCertification) await api.put("/nurses/me/certifications/" + editingCertification.id, data);
      else await api.post("/nurses/me/certifications", data);
      setCertificationsModalOpen(false); fetchProfile();
    } catch (error) { toast.error("Error saving certification"); }
  };
  const handleDeleteCertification = async (id: string) => {
    await api.delete("/nurses/me/certifications/" + id); fetchProfile();
  };
  const handleClearAllCertifications = async () => {
    await api.delete("/nurses/me/certifications"); fetchProfile();
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file || !profile) return;
    setUploading(true);
    const fd = new FormData(); fd.append("file", file); fd.append("profile_id", profile.id);
    try { await api.upload("/resumes/upload", fd); fetchProfile(); }
    catch (error) { toast.error("Upload failed"); } finally { setUploading(false); }
  };
  const handleViewResume = async (id: string) => {
    const { url } = await api.get<{ url: string }>("/resumes/" + id); window.open(url, "_blank");
  };
  const handleDownloadResume = async (id: string, filename: string) => {
    const { url } = await api.get<{ url: string }>("/resumes/" + id);
    const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
  };
  const handleDeleteResume = async (id: string) => {
    if (confirm("Delete resume?")) { await api.delete("/resumes/" + id); fetchProfile(); }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (isAdmin && adminProfile && user) {
    return (
      <>
        <AdminProfileView
          profile={{ ...adminProfile, user: { email: user.email, role: user.role, created_at: user.created_at || new Date().toISOString() } }}
          onEditProfile={() => setAdminProfileEditOpen(true)}
          uploadingPicture={uploadingPicture}
          onProfilePictureUpload={handleProfilePictureUpload}
          onDeleteProfilePicture={handleDeleteProfilePicture}
        />
        <AdminProfileEditModal
          open={adminProfileEditOpen}
          onOpenChange={setAdminProfileEditOpen}
          profile={adminProfile}
          onSave={handleSaveProfile}
        />
      </>
    );
  }

  if (!isAdmin && profile) {
    return (
      <div>
        <ProfileView
          profile={profile}
          onEditProfile={() => setProfileEditModalOpen(true)}
          onProfilePictureUpload={handleProfilePictureUpload}
          onDeleteProfilePicture={handleDeleteProfilePicture}
          uploadingPicture={uploadingPicture}
          onAddExperience={() => handleOpenExperienceModal()}
          onEditExperience={handleOpenExperienceModal}
          onDeleteExperience={handleDeleteExperience}
          onClearAllExperience={handleClearAllExperience}
          onAddEducation={() => handleOpenEducationModal()}
          onEditEducation={handleOpenEducationModal}
          onDeleteEducation={handleDeleteEducation}
          onClearAllEducation={handleClearAllEducation}
          onAddSkill={() => handleOpenSkillsModal()}
          onEditSkill={handleOpenSkillsModal}
          onDeleteSkill={handleDeleteSkill}
          onClearAllSkills={handleClearAllSkills}
          onAddCertification={() => handleOpenCertificationsModal()}
          onEditCertification={handleOpenCertificationsModal}
          onDeleteCertification={handleDeleteCertification}
          onClearAllCertifications={handleClearAllCertifications}
          onResumeUpload={handleResumeUpload}
          uploading={uploading}
          onViewResume={handleViewResume}
          onDownloadResume={handleDownloadResume}
          onDeleteResume={handleDeleteResume}
        />

        <ExperienceModal
          open={experienceModalOpen}
          onOpenChange={setExperienceModalOpen}
          experience={editingExperience}
          onSave={handleSaveExperience}
        />
        <EducationModal
          open={educationModalOpen}
          onOpenChange={setEducationModalOpen}
          education={editingEducation}
          onSave={handleSaveEducation}
        />
        <SkillsModal
          open={skillsModalOpen}
          onOpenChange={setSkillsModalOpen}
          skill={editingSkill}
          onSave={handleSaveSkill}
        />
        <CertificationsModal
          open={certificationsModalOpen}
          onOpenChange={setCertificationsModalOpen}
          certification={editingCertification}
          onSave={handleSaveCertification}
        />
        <ProfileEditModal
          open={profileEditModalOpen}
          onOpenChange={setProfileEditModalOpen}
          profile={profile}
          onSave={handleSaveProfile}
        />
      </div>
    );
  }

  return (
    <div className="text-center py-12">
      <p className="text-muted-foreground">Profile not found.</p>
    </div>
  );
}
