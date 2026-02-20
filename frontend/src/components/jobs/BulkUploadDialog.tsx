"use client";

import { useState, useRef, DragEvent } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Upload,
  Download,
  FileSpreadsheet,
  Loader2,
  CheckCircle,
  AlertCircle,
  X,
} from "lucide-react";

interface BulkUploadResult {
  created: number;
  errors: { row: number; message: string }[];
  total: number;
}

interface BulkUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const CSV_HEADERS = [
  "title",
  "description",
  "location",
  "facility_name",
  "employment_type",
  "min_experience_years",
  "required_certifications",
  "required_skills",
  "salary_min",
  "salary_max",
  "salary_currency",
];

const CSV_SAMPLE_ROW = [
  "Registered Nurse - ICU",
  "Provide critical care nursing in the ICU department",
  "Manila, Philippines",
  "St. Luke's Medical Center",
  "full-time",
  "2",
  "PRC License;BLS;ACLS",
  "Critical Care;Patient Assessment",
  "30000",
  "50000",
  "PHP",
];

function downloadTemplate() {
  const csvContent = [
    CSV_HEADERS.join(","),
    CSV_SAMPLE_ROW.map((v) => `"${v}"`).join(","),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "jobs_upload_template.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export function BulkUploadDialog({
  open,
  onOpenChange,
  onSuccess,
}: BulkUploadDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<BulkUploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setFile(null);
    setResult(null);
    setError(null);
    setUploading(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) reset();
    onOpenChange(open);
  };

  const handleFile = (f: File) => {
    if (!f.name.endsWith(".csv")) {
      setError("Please select a CSV file.");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setError("File size must be under 5MB.");
      return;
    }
    setFile(f);
    setError(null);
    setResult(null);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await api.upload<BulkUploadResult>(
        "/jobs/bulk-upload",
        formData
      );
      setResult(res);
      if (res.created > 0) {
        onSuccess();
        toast.success(`${res.created} job${res.created > 1 ? "s" : ""} created successfully`, {
          description: res.errors.length > 0
            ? `${res.errors.length} row${res.errors.length > 1 ? "s" : ""} had errors. See details in the dialog.`
            : "All jobs are now live and visible to nurses.",
        });
      } else {
        toast.error("No jobs were created", {
          description: "All rows had validation errors. Check the details below.",
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      setError(message);
      toast.error("Bulk upload failed", { description: message });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Bulk Upload Jobs
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Template download */}
          <div className="flex items-center justify-between rounded-lg border border-dashed p-3">
            <div className="flex items-center gap-2 text-sm">
              <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                Need the CSV template?
              </span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={downloadTemplate}
            >
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
          </div>

          {/* Instructions */}
          <div className="text-xs text-muted-foreground space-y-1 bg-muted/50 rounded-lg p-3">
            <p className="font-medium text-foreground text-sm mb-1.5">Format Notes:</p>
            <ul className="list-disc pl-4 space-y-0.5">
              <li>Required columns: <strong>title, description, location, facility_name</strong></li>
              <li>employment_type: full-time, part-time, or contract</li>
              <li>Certifications & skills: use semicolons (;) to separate multiple values</li>
              <li>Maximum 200 jobs per upload</li>
            </ul>
          </div>

          {/* Drop zone */}
          {!result && (
            <div
              className={`relative rounded-lg border-2 border-dashed p-8 text-center transition-colors cursor-pointer ${
                dragging
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-primary/50"
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm font-medium">
                {file ? file.name : "Drop your CSV file here or click to browse"}
              </p>
              {file && (
                <p className="text-xs text-muted-foreground mt-1">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              )}
            </div>
          )}

          {/* Selected file chip */}
          {file && !result && (
            <div className="flex items-center justify-between bg-muted rounded-lg px-3 py-2">
              <div className="flex items-center gap-2 text-sm">
                <FileSpreadsheet className="h-4 w-4" />
                <span className="truncate max-w-[200px]">{file.name}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  if (inputRef.current) inputRef.current.value = "";
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 rounded-lg px-3 py-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm bg-green-50 text-green-700 rounded-lg px-3 py-2 dark:bg-green-900/20 dark:text-green-400">
                <CheckCircle className="h-4 w-4 flex-shrink-0" />
                <span>
                  Successfully created <strong>{result.created}</strong> of{" "}
                  {result.total} jobs.
                </span>
              </div>

              {result.errors.length > 0 && (
                <div className="rounded-lg border border-destructive/30 overflow-hidden">
                  <div className="bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
                    {result.errors.length} row(s) had errors:
                  </div>
                  <div className="max-h-40 overflow-y-auto divide-y">
                    {result.errors.map((err, i) => (
                      <div
                        key={i}
                        className="px-3 py-1.5 text-xs text-muted-foreground flex gap-2"
                      >
                        <span className="font-medium text-foreground whitespace-nowrap">
                          Row {err.row}:
                        </span>
                        <span>{err.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            {result ? (
              <Button
                type="button"
                className="btn-primary-green border-0"
                onClick={() => handleOpenChange(false)}
              >
                Done
              </Button>
            ) : (
              <Button
                type="button"
                className="btn-primary-green border-0"
                disabled={!file || uploading}
                onClick={handleUpload}
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-1" />
                    Upload & Create Jobs
                  </>
                )}
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
