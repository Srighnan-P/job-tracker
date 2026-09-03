"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { auth, applications } from "@/lib/api";
import type { Application, ApplicationStatus, User } from "@/lib/types";
import { ApplicationForm } from "@/components/application-form";
import { Button } from "@/components/ui/button";
import {
  BriefcaseIcon,
  PlusIcon,
  LogOutIcon,
  PencilIcon,
  TrashIcon,
  XIcon,
  ExternalLinkIcon,
} from "lucide-react";

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<ApplicationStatus, string> = {
  applied: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  interview: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  offer: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  rejected: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  withdrawn: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
};

function StatusBadge({ status }: { status: ApplicationStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[status]}`}
    >
      {status}
    </span>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-background shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-border bg-background px-6 py-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <XIcon className="size-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Application | null>(null);
  const [deleting, setDeleting] = useState<Application | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [meRes, appsRes] = await Promise.all([
        auth.me(),
        applications.getAll(),
      ]);
      setUser(meRes.user);
      setApps(appsRes.applications);
    } catch {
      setError("Failed to load data. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleLogout() {
    try {
      await auth.logout();
    } finally {
      router.push("/login");
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await applications.delete(deleting.applicationId);
      setApps((prev) => prev.filter((a) => a.applicationId !== deleting.applicationId));
      setDeleting(null);
    } catch (err: any) {
      alert(err.response?.data?.message ?? err.message ?? "Delete failed");
    } finally {
      setDeleteLoading(false);
    }
  }

  function handleFormSuccess() {
    setShowAdd(false);
    setEditing(null);
    fetchData();
  }

  // ── Summary counts ──
  const counts = apps.reduce(
    (acc, a) => {
      acc[a.status] = (acc[a.status] ?? 0) + 1;
      return acc;
    },
    {} as Partial<Record<ApplicationStatus, number>>
  );

  // ── Render ──
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground text-sm">Loading…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-destructive text-sm">{error}</p>
      </div>
    );
  }

  return (
    <>
      {/* ── Header ── */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2 font-semibold">
            <BriefcaseIcon className="size-5 text-primary" />
            Job Tracker
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {user?.name}
            </span>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleLogout}
              className="cursor-pointer"
            >
              <LogOutIcon className="size-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        {/* ── Summary cards ── */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {(["applied", "interview", "offer", "rejected", "withdrawn"] as ApplicationStatus[]).map(
            (status) => (
              <div
                key={status}
                className="rounded-2xl border border-border bg-card p-4 text-center"
              >
                <div className="text-2xl font-bold tabular-nums">
                  {counts[status] ?? 0}
                </div>
                <div className="mt-0.5 text-xs capitalize text-muted-foreground">
                  {status}
                </div>
              </div>
            )
          )}
        </div>

        {/* ── Table header ── */}
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">
            Applications{" "}
            <span className="text-base font-normal text-muted-foreground">
              ({apps.length})
            </span>
          </h1>
          <Button size="sm" onClick={() => setShowAdd(true)}>
            <PlusIcon className="size-4" />
            Add
          </Button>
        </div>

        {/* ── Table ── */}
        {apps.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
            <BriefcaseIcon className="mb-3 size-10 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              No applications yet.{" "}
              <button
                className="underline underline-offset-4 hover:text-foreground"
                onClick={() => setShowAdd(true)}
              >
                Add your first one.
              </button>
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left text-xs text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Company</th>
                  <th className="hidden px-4 py-3 font-medium sm:table-cell">Status</th>
                  <th className="hidden px-4 py-3 font-medium md:table-cell">Mode</th>
                  <th className="hidden px-4 py-3 font-medium lg:table-cell">Date</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {apps.map((app, i) => (
                  <tr
                    key={app.applicationId}
                    onClick={() => router.push(`/dashboard/${app.applicationId}`)}
                    className={`cursor-pointer border-b border-border last:border-0 transition-colors hover:bg-muted/40 active:bg-muted/60 ${
                      i % 2 === 0 ? "" : "bg-muted/10"
                    }`}
                  >
                    <td className="px-4 py-3 font-medium">
                      <div className="flex items-center gap-1.5">
                        {app.title}
                        {app.jobUrl && (
                          <a
                            href={app.jobUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-muted-foreground hover:text-primary"
                          >
                            <ExternalLinkIcon className="size-3.5" />
                          </a>
                        )}
                      </div>
                      {/* Show status inline on small screens */}
                      <div className="mt-1 sm:hidden">
                        <StatusBadge status={app.status} />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {app.companyName}
                    </td>
                    <td className="hidden px-4 py-3 sm:table-cell">
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="hidden px-4 py-3 capitalize text-muted-foreground md:table-cell">
                      {app.workMode}
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">
                      {new Date(app.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); setEditing(app); }}
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                          title="Edit"
                        >
                          <PencilIcon className="size-3.5" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeleting(app); }}
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                          title="Delete"
                        >
                          <TrashIcon className="size-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* ── Add modal ── */}
      {showAdd && (
        <Modal title="Add application" onClose={() => setShowAdd(false)}>
          <ApplicationForm
            onSuccess={handleFormSuccess}
            onCancel={() => setShowAdd(false)}
          />
        </Modal>
      )}

      {/* ── Edit modal ── */}
      {editing && (
        <Modal title="Edit application" onClose={() => setEditing(null)}>
          <ApplicationForm
            initial={editing}
            onSuccess={handleFormSuccess}
            onCancel={() => setEditing(null)}
          />
        </Modal>
      )}

      {/* ── Delete confirm ── */}
      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-background p-6 shadow-2xl">
            <h2 className="text-lg font-semibold">Delete application?</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              This will permanently remove{" "}
              <strong>
                {deleting.title} at {deleting.companyName}
              </strong>
              . This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setDeleting(null)}
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
