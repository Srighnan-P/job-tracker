"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { applications } from "@/lib/api";
import type { Application } from "@/lib/types";
import { ApplicationForm } from "@/components/application-form";
import { Button } from "@/components/ui/button";
import {
  BriefcaseIcon,
  ArrowLeftIcon,
  ExternalLinkIcon,
  PencilIcon,
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

const STATUS_STYLES: Record<string, string> = {
  applied: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  interview: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  offer: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  rejected: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  withdrawn: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
};

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

  useEffect(() => {
    applications
      .getById(Number(id))
      .then((res: any) => {
        const item = Array.isArray(res.application)
          ? res.application[0]
          : res.application;
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
      .then((res: any) => {
        const item = Array.isArray(res.application)
          ? res.application[0]
          : res.application;
        if (item) setApp(item);
      })
      .catch(() => {});
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
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3 sm:px-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard")}
            className="-ml-1"
          >
            <ArrowLeftIcon className="size-4" />
            <span className="hidden sm:inline">Back</span>
          </Button>

          <div className="flex flex-1 items-center gap-2 min-w-0">
            <BriefcaseIcon className="size-4 shrink-0 text-primary" />
            <span className="truncate font-semibold">{app.title}</span>
            <span className="text-muted-foreground hidden sm:inline">·</span>
            <span className="truncate text-sm text-muted-foreground hidden sm:inline">
              {app.companyName}
            </span>
          </div>

          <span
            className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[app.status] ?? "bg-muted text-muted-foreground"}`}
          >
            {app.status}
          </span>

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
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
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
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold">{app.title}</h1>
                  <p className="mt-1 text-lg text-muted-foreground">{app.companyName}</p>
                </div>
                <span
                  className={`mt-1 inline-flex shrink-0 items-center rounded-full px-3 py-1 text-sm font-medium capitalize ${STATUS_STYLES[app.status] ?? "bg-muted text-muted-foreground"}`}
                >
                  {app.status}
                </span>
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
                {app.createdAt
                  ? new Date(app.createdAt).toLocaleDateString(undefined, {
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
    </>
  );
}
