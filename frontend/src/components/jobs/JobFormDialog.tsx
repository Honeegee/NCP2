"use client";

import { useState, FormEvent, useEffect } from "react";
import { api } from "@/lib/api-client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetBody,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectOption } from "@/components/ui/select";
import { Loader2, Save, AlertCircle, Briefcase } from "lucide-react";
import type { Job, EmploymentType } from "@/types";

interface JobFormData {
  title: string;
  description: string;
  location: string;
  facility_name: string;
  employment_type: EmploymentType;
  min_experience_years: string;
  required_certifications: string;
  required_skills: string;
  salary_min: string;
  salary_max: string;
  salary_currency: string;
}

const emptyForm: JobFormData = {
  title: "",
  description: "",
  location: "",
  facility_name: "",
  employment_type: "full-time",
  min_experience_years: "0",
  required_certifications: "",
  required_skills: "",
  salary_min: "",
  salary_max: "",
  salary_currency: "USD",
};

interface JobFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingJob: Job | null;
  onSuccess: () => void;
}

export function JobFormDialog({
  open,
  onOpenChange,
  editingJob,
  onSuccess,
}: JobFormDialogProps) {
  const [formData, setFormData] = useState<JobFormData>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      if (editingJob) {
        setFormData({
          title: editingJob.title,
          description: editingJob.description,
          location: editingJob.location,
          facility_name: editingJob.facility_name,
          employment_type: editingJob.employment_type,
          min_experience_years: String(editingJob.min_experience_years),
          required_certifications: editingJob.required_certifications.join(", "),
          required_skills: editingJob.required_skills.join(", "),
          salary_min: editingJob.salary_min ? String(editingJob.salary_min) : "",
          salary_max: editingJob.salary_max ? String(editingJob.salary_max) : "",
          salary_currency: editingJob.salary_currency || "USD",
        });
      } else {
        setFormData(emptyForm);
      }
      setError(null);
    }
  }, [open, editingJob]);

  const updateField = (field: keyof JobFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        location: formData.location.trim(),
        facility_name: formData.facility_name.trim(),
        employment_type: formData.employment_type,
        min_experience_years: parseInt(formData.min_experience_years, 10) || 0,
        required_certifications: formData.required_certifications
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        required_skills: formData.required_skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        salary_min: formData.salary_min ? parseFloat(formData.salary_min) : null,
        salary_max: formData.salary_max ? parseFloat(formData.salary_max) : null,
        salary_currency: formData.salary_currency || "USD",
      };

      if (!payload.title || !payload.description || !payload.location || !payload.facility_name) {
        setError("Title, description, location, and facility name are required.");
        setSubmitting(false);
        return;
      }

      if (editingJob) {
        await api.put(`/jobs/${editingJob.id}`, payload);
      } else {
        await api.post("/jobs", payload);
      }

      onOpenChange(false);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            {editingJob ? "Edit Job" : "Create New Job"}
          </SheetTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {editingJob
              ? "Update the job posting details below."
              : "Fill in the details to create a new job posting."}
          </p>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <SheetBody>
            <div className="space-y-8">
              {error && (
                <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 rounded-lg px-3 py-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              {/* Section: Basic Info */}
              <section className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="job-title">
                      Title <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="job-title"
                      placeholder="e.g. Registered Nurse - ICU"
                      value={formData.title}
                      onChange={(e) => updateField("title", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="job-facility">
                      Facility Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="job-facility"
                      placeholder="e.g. St. Luke's Medical Center"
                      value={formData.facility_name}
                      onChange={(e) => updateField("facility_name", e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="job-description">
                    Description <span className="text-destructive">*</span>
                  </Label>
                  <textarea
                    id="job-description"
                    className="flex min-h-[140px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Describe the role, responsibilities, and requirements..."
                    value={formData.description}
                    onChange={(e) => updateField("description", e.target.value)}
                    required
                  />
                </div>
              </section>

              {/* Section: Location & Type */}
              <section className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Location & Type
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="job-location">
                      Location <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="job-location"
                      placeholder="e.g. Manila, Philippines"
                      value={formData.location}
                      onChange={(e) => updateField("location", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="job-type">Employment Type</Label>
                    <Select
                      id="job-type"
                      value={formData.employment_type}
                      onChange={(e) => updateField("employment_type", e.target.value as EmploymentType)}
                    >
                      <SelectOption value="full-time">Full-Time</SelectOption>
                      <SelectOption value="part-time">Part-Time</SelectOption>
                      <SelectOption value="contract">Contract</SelectOption>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="job-min-exp">Min Experience (years)</Label>
                    <Input
                      id="job-min-exp"
                      type="number"
                      min="0"
                      value={formData.min_experience_years}
                      onChange={(e) => updateField("min_experience_years", e.target.value)}
                    />
                  </div>
                </div>
              </section>

              {/* Section: Requirements */}
              <section className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Requirements
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="job-certs">Required Certifications</Label>
                    <Input
                      id="job-certs"
                      placeholder="e.g. PRC License, NCLEX, BLS"
                      value={formData.required_certifications}
                      onChange={(e) => updateField("required_certifications", e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Comma-separated list</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="job-skills">Required Skills</Label>
                    <Input
                      id="job-skills"
                      placeholder="e.g. Critical Care, Patient Assessment"
                      value={formData.required_skills}
                      onChange={(e) => updateField("required_skills", e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Comma-separated list</p>
                  </div>
                </div>
              </section>

              {/* Section: Compensation */}
              <section className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Compensation
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="job-salary-min">Salary Min</Label>
                    <Input
                      id="job-salary-min"
                      type="number"
                      min="0"
                      step="1000"
                      placeholder="e.g. 30000"
                      value={formData.salary_min}
                      onChange={(e) => updateField("salary_min", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="job-salary-max">Salary Max</Label>
                    <Input
                      id="job-salary-max"
                      type="number"
                      min="0"
                      step="1000"
                      placeholder="e.g. 50000"
                      value={formData.salary_max}
                      onChange={(e) => updateField("salary_max", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="job-salary-currency">Currency</Label>
                    <Select
                      id="job-salary-currency"
                      value={formData.salary_currency}
                      onChange={(e) => updateField("salary_currency", e.target.value)}
                    >
                      <SelectOption value="USD">USD</SelectOption>
                      <SelectOption value="PHP">PHP</SelectOption>
                      <SelectOption value="GBP">GBP</SelectOption>
                      <SelectOption value="EUR">EUR</SelectOption>
                      <SelectOption value="AUD">AUD</SelectOption>
                      <SelectOption value="CAD">CAD</SelectOption>
                      <SelectOption value="SGD">SGD</SelectOption>
                      <SelectOption value="AED">AED</SelectOption>
                      <SelectOption value="SAR">SAR</SelectOption>
                    </Select>
                  </div>
                </div>
              </section>
            </div>
          </SheetBody>

          <SheetFooter>
            <div className="flex items-center gap-3">
              <Button type="submit" className="btn-primary-green border-0" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    {editingJob ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-1" />
                    {editingJob ? "Update Job" : "Create Job"}
                  </>
                )}
              </Button>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
            </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
