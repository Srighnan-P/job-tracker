"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { applications } from "@/lib/api";
import type { Application, ApplicationStatus } from "@/lib/types";
import { ApplicationForm } from "@/components/application-form";
import { QuickStatusSelect } from "@/components/quick-status-select";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  BriefcaseIcon,
  ArrowLeftIcon,
  ExternalLinkIcon,
  PencilIcon,
  TrashIcon,
  XIcon,
  MapPinIcon,
  MonitorIcon,
  ClockIcon,
  DollarSignIcon,
  LinkIcon,
  CalendarIcon,
  FileTextIcon,
  StickyNoteIcon,
} from "lucide-react";
import { parseLocalDate } from "@/lib/utils";

function DetailRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border last:border-0">
      <div className="mt-0.5 shrink-0 text-muted-foreground">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">
          {label}
        </p>
        <div className="text-sm">{children}</div>
      </div>
    </div>
  );
}

export default function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [app, setApp] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    applications
      .getById(Number(id))
      .then((res) => {
        const item = res.application;
        if (!item) {
          setError("Application not found.");
        } else {
          setApp(item);
        }
      })
      .catch(() => setError("Failed to load application."))
      .finally(() => setLoading(false));
  }, [id]);

  function handleSuccess() {
    setSaved(true);
    setEditing(false);
    // Re-fetch to get the updated data
    applications
      .getById(Number(id))
      .then((res) => {
        if (res.application) setApp(res.application);
      })
      .catch(() => {});
  }

  async function handleQuickStatusChange(newStatus: ApplicationStatus) {
    if (!app) return;
    try {
      await applications.update(Number(id), { application: { status: newStatus } });
      setApp((prev) => (prev ? { ...prev, status: newStatus } : null));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      alert(e.response?.data?.message ?? e.message ?? "Failed to update status");
    }
  }

  async function handleDelete() {
    setDeleteLoading(true);
    try {
      await applications.delete(Number(id));
      router.push("/dashboard");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      alert(e.response?.data?.message ?? e.message ?? "Delete failed");
      setDeleteLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground text-sm">Loading…</div>
      </div>
    );
  }

  if (error || !app) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-destructive text-sm">{error ?? "Application not found."}</p>
      </div>
    );
  }

  const salary =
    app.salaryMin || app.salaryMax
      ? [app.salaryMin, app.salaryMax].filter(Boolean).join(" – ") +
        (app.salaryCurrency ? ` ${app.salaryCurrency}` : "")
      : null;

  return (
    <>
      {/* ── Header ── */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (typeof window !== "undefined" && window.history.length > 1) {
                  router.back();
                } else {
                  router.replace("/dashboard");
                }
              }}
              className="-ml-1 cursor-pointer"
            >
              <ArrowLeftIcon className="size-4" />
              <span className="hidden sm:inline">Back</span>
            </Button>

            <div className="flex items-center gap-2 min-w-0">
              <BriefcaseIcon className="size-4 shrink-0 text-primary" />
              <span className="truncate font-semibold">{app.title}</span>
              <span className="text-muted-foreground hidden sm:inline">·</span>
              <span className="truncate text-sm text-muted-foreground hidden sm:inline">
                {app.companyName}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden sm:block">
              <QuickStatusSelect
                status={app.status}
                onChange={handleQuickStatusChange}
                size="sm"
              />
            </div>

            <Button
              size="sm"
              variant={editing ? "outline" : "default"}
              onClick={() => setEditing((v) => !v)}
            >
              {editing ? (
                <>
                  <XIcon className="size-4" />
                  <span className="hidden sm:inline">Cancel</span>
                </>
              ) : (
                <>
                  <PencilIcon className="size-4" />
                  <span className="hidden sm:inline">Edit</span>
                </>
              )}
            </Button>

            <Button
              size="sm"
              variant="destructive"
              onClick={() => setDeleting(true)}
              className="cursor-pointer"
              title="Delete application"
            >
              <TrashIcon className="size-4" />
              <span className="hidden sm:inline">Delete</span>
            </Button>

            <div className="ml-1 pl-2 border-l border-border hidden sm:block">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
        {/* ── Success banner ── */}
        {saved && (
          <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300">
            ✓ Changes saved successfully.
          </div>
        )}

        {editing ? (
          /* ── Edit form ── */
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-6 text-base font-semibold">Edit Application</h2>
            <ApplicationForm
              initial={app}
              onSuccess={handleSuccess}
              onCancel={() => setEditing(false)}
            />
          </div>
        ) : (
          /* ── Detail view ── */
          <div className="space-y-6">
            {/* Hero card */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold">{app.title}</h1>
                  <p className="mt-1 text-lg text-muted-foreground">{app.companyName}</p>
                </div>
                <div className="flex flex-col sm:items-end gap-1.5">
                  <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                    Status
                  </span>
                  <QuickStatusSelect
                    status={app.status}
                    onChange={handleQuickStatusChange}
                    size="default"
                  />
                </div>
              </div>

              {app.jobUrl && (
                <a
                  href={app.jobUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                >
                  <ExternalLinkIcon className="size-3.5" />
                  View job posting
                </a>
              )}
            </div>

            {/* Details card */}
            <div className="rounded-2xl border border-border bg-card px-6 shadow-sm">
              {app.location && (
                <DetailRow icon={<MapPinIcon className="size-4" />} label="Location">
                  {app.location}
                </DetailRow>
              )}
              {app.workMode && (
                <DetailRow icon={<MonitorIcon className="size-4" />} label="Work Mode">
                  <span className="capitalize">{app.workMode}</span>
                </DetailRow>
              )}
              {app.employmentType && (
                <DetailRow icon={<ClockIcon className="size-4" />} label="Employment Type">
                  <span className="capitalize">{app.employmentType}</span>
                </DetailRow>
              )}
              {salary && (
                <DetailRow icon={<DollarSignIcon className="size-4" />} label="Salary">
                  {salary}
                </DetailRow>
              )}
              {app.source && (
                <DetailRow icon={<LinkIcon className="size-4" />} label="Source">
                  {app.source}
                </DetailRow>
              )}
              <DetailRow icon={<CalendarIcon className="size-4" />} label="Applied On">
                {app.appliedAt || app.createdAt
                  ? parseLocalDate(app.appliedAt || app.createdAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "—"}
              </DetailRow>
            </div>

            {/* Description card */}
            {app.description && (
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4 text-sm font-semibold">
                  <FileTextIcon className="size-4 text-muted-foreground" />
                  Job Description
                </div>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground leading-relaxed">
                  {app.description}
                </p>
              </div>
            )}

            {/* Notes card */}
            {app.notes && (
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4 text-sm font-semibold">
                  <StickyNoteIcon className="size-4 text-muted-foreground" />
                  Notes
                </div>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground leading-relaxed">
                  {app.notes}
                </p>
              </div>
            )}

            {/* Empty state when no optional details */}
            {!app.location && !app.employmentType && !salary && !app.source && !app.description && !app.notes && (
              <p className="text-center text-sm text-muted-foreground py-4">
                No additional details.{" "}
                <button
                  onClick={() => setEditing(true)}
                  className="underline underline-offset-4 hover:text-foreground"
                >
                  Add some?
                </button>
              </p>
            )}
          </div>
        )}
      </main>

      {/* ── Delete confirm modal ── */}
      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-background p-6 shadow-2xl">
            <h2 className="text-lg font-semibold">Delete application?</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              This will permanently remove{" "}
              <strong>
                {app.title} at {app.companyName}
              </strong>
              . This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setDeleting(false)}
                disabled={deleteLoading}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteLoading}
              >
                {deleteLoading ? "Deleting…" : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
