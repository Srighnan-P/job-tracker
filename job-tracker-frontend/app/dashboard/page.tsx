"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { auth, applications } from "@/lib/api";
import type { Application, ApplicationStatus, User } from "@/lib/types";
import { ApplicationForm } from "@/components/application-form";
import { QuickStatusSelect } from "@/components/quick-status-select";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  BriefcaseIcon,
  PlusIcon,
  LogOutIcon,
  PencilIcon,
  TrashIcon,
  XIcon,
  ExternalLinkIcon,
  SearchIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ChevronDownIcon,
  RotateCcwIcon,
  LayersIcon,
} from "lucide-react";
import { parseLocalDate } from "@/lib/utils";

// ─── Status badge & card styles ───────────────────────────────────────────────

const STATUS_CARD_STYLES: Record<
  ApplicationStatus,
  { card: string; num: string; label: string; activeBorder: string }
> = {
  applied: {
    card: "border-blue-200/80 bg-blue-50/70 hover:bg-blue-100/60 dark:border-blue-900/50 dark:bg-blue-950/30 dark:hover:bg-blue-900/40",
    num: "text-blue-700 dark:text-blue-300",
    label: "text-blue-600/90 dark:text-blue-400/90",
    activeBorder: "ring-2 ring-blue-500 ring-offset-2 ring-offset-background",
  },
  interview: {
    card: "border-violet-200/80 bg-violet-50/70 hover:bg-violet-100/60 dark:border-violet-900/50 dark:bg-violet-950/30 dark:hover:bg-violet-900/40",
    num: "text-violet-700 dark:text-violet-300",
    label: "text-violet-600/90 dark:text-violet-400/90",
    activeBorder: "ring-2 ring-violet-500 ring-offset-2 ring-offset-background",
  },
  offer: {
    card: "border-emerald-200/80 bg-emerald-50/70 hover:bg-emerald-100/60 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:hover:bg-emerald-900/40",
    num: "text-emerald-700 dark:text-emerald-300",
    label: "text-emerald-600/90 dark:text-emerald-400/90",
    activeBorder: "ring-2 ring-emerald-500 ring-offset-2 ring-offset-background",
  },
  rejected: {
    card: "border-red-200/80 bg-red-50/70 hover:bg-red-100/60 dark:border-red-900/50 dark:bg-red-950/30 dark:hover:bg-red-900/40",
    num: "text-red-700 dark:text-red-300",
    label: "text-red-600/90 dark:text-red-400/90",
    activeBorder: "ring-2 ring-red-500 ring-offset-2 ring-offset-background",
  },
  withdrawn: {
    card: "border-zinc-200/80 bg-zinc-100/70 hover:bg-zinc-200/60 dark:border-zinc-800 dark:bg-zinc-900/40 dark:hover:bg-zinc-800/60",
    num: "text-zinc-700 dark:text-zinc-300",
    label: "text-zinc-600/90 dark:text-zinc-400/90",
    activeBorder: "ring-2 ring-zinc-500 ring-offset-2 ring-offset-background",
  },
};

type SortOption =
  | "date-desc"
  | "date-asc"
  | "company-asc"
  | "company-desc"
  | "role-asc"
  | "role-desc"
  | "salary-desc"
  | "salary-asc";

function formatDate(dateStr: string) {
  if (!dateStr) return "—";
  const d = parseLocalDate(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sept", "Oct", "Nov", "Dec",
  ];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
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
            className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
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

  // Search & Filter & Sort state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "all">("all");
  const [workModeFilter, setWorkModeFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("date-desc");

  // Modal state
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Application | null>(null);
  const [deleting, setDeleting] = useState<Application | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  async function refreshData() {
    try {
      const [meRes, appsRes] = await Promise.all([
        auth.me(),
        applications.getAll(),
      ]);
      setUser(meRes.user);
      setApps(appsRes.applications);
    } catch {
      setError("Failed to load data. Please refresh.");
    }
  }

  useEffect(() => {
    let ignore = false;
    async function loadData() {
      try {
        const [meRes, appsRes] = await Promise.all([
          auth.me(),
          applications.getAll(),
        ]);
        if (!ignore) {
          setUser(meRes.user);
          setApps(appsRes.applications);
        }
      } catch {
        if (!ignore) {
          setError("Failed to load data. Please refresh.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadData();
    return () => {
      ignore = true;
    };
  }, []);

  async function handleLogout() {
    try {
      await auth.logout();
    } finally {
      router.replace("/login");
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await applications.delete(deleting.applicationId);
      setApps((prev) => prev.filter((a) => a.applicationId !== deleting.applicationId));
      setDeleting(null);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      alert(e.response?.data?.message ?? e.message ?? "Delete failed");
    } finally {
      setDeleteLoading(false);
    }
  }

  async function handleQuickStatusChange(
    applicationId: number,
    newStatus: ApplicationStatus
  ) {
    try {
      await applications.update(applicationId, {
        application: { status: newStatus },
      });
      setApps((prev) =>
        prev.map((a) =>
          a.applicationId === applicationId ? { ...a, status: newStatus } : a
        )
      );
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      alert(e.response?.data?.message ?? e.message ?? "Failed to update status");
    }
  }

  function handleFormSuccess() {
    setShowAdd(false);
    setEditing(null);
    refreshData();
  }

  function handleStatusCardClick(status: ApplicationStatus | "all") {
    if (statusFilter === status) {
      // Toggle off to all
      setStatusFilter("all");
    } else {
      setStatusFilter(status);
    }
  }

  function clearAllFilters() {
    setSearchQuery("");
    setStatusFilter("all");
    setWorkModeFilter("all");
  }

  const hasActiveFilters =
    searchQuery.trim() !== "" || statusFilter !== "all" || workModeFilter !== "all";

  // ── Summary counts ──
  const counts = useMemo(() => {
    return apps.reduce(
      (acc, a) => {
        acc[a.status] = (acc[a.status] ?? 0) + 1;
        return acc;
      },
      {} as Partial<Record<ApplicationStatus, number>>
    );
  }, [apps]);

  // ── Filtered Applications ──
  const filteredApps = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return apps.filter((app) => {
      if (statusFilter !== "all" && app.status !== statusFilter) {
        return false;
      }
      if (workModeFilter !== "all" && app.workMode !== workModeFilter) {
        return false;
      }
      if (q) {
        const matchTitle = app.title.toLowerCase().includes(q);
        const matchCompany = app.companyName.toLowerCase().includes(q);
        const matchLocation = app.location?.toLowerCase().includes(q) ?? false;
        if (!matchTitle && !matchCompany && !matchLocation) {
          return false;
        }
      }
      return true;
    });
  }, [apps, searchQuery, statusFilter, workModeFilter]);

  // ── Sorted Applications ──
  const sortedAndFilteredApps = useMemo(() => {
    const list = [...filteredApps];
    list.sort((a, b) => {
      switch (sortBy) {
        case "date-desc": {
          const tA = new Date(a.appliedAt || a.createdAt).getTime() || 0;
          const tB = new Date(b.appliedAt || b.createdAt).getTime() || 0;
          return tB - tA;
        }
        case "date-asc": {
          const tA = new Date(a.appliedAt || a.createdAt).getTime() || 0;
          const tB = new Date(b.appliedAt || b.createdAt).getTime() || 0;
          return tA - tB;
        }
        case "company-asc":
          return a.companyName.localeCompare(b.companyName);
        case "company-desc":
          return b.companyName.localeCompare(a.companyName);
        case "role-asc":
          return a.title.localeCompare(b.title);
        case "role-desc":
          return b.title.localeCompare(a.title);
        case "salary-desc": {
          const sA = a.salaryMax ?? a.salaryMin ?? 0;
          const sB = b.salaryMax ?? b.salaryMin ?? 0;
          return sB - sA;
        }
        case "salary-asc": {
          const sA = a.salaryMax ?? a.salaryMin ?? 0;
          const sB = b.salaryMax ?? b.salaryMin ?? 0;
          return sA - sB;
        }
        default:
          return 0;
      }
    });
    return list;
  }, [filteredApps, sortBy]);

  // Clickable column header helpers
  function toggleSort(field: "role" | "company" | "date") {
    if (field === "role") {
      setSortBy((prev) => (prev === "role-asc" ? "role-desc" : "role-asc"));
    } else if (field === "company") {
      setSortBy((prev) => (prev === "company-asc" ? "company-desc" : "company-asc"));
    } else if (field === "date") {
      setSortBy((prev) => (prev === "date-desc" ? "date-asc" : "date-desc"));
    }
  }

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
            <ThemeToggle />
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
        {/* ── Summary cards (Clickable status filters) ── */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {/* "All" Card */}
          <button
            type="button"
            onClick={() => handleStatusCardClick("all")}
            className={`rounded-2xl border p-4 text-center transition-all cursor-pointer text-left sm:text-center ${
              statusFilter === "all"
                ? "border-primary bg-primary/10 ring-2 ring-primary ring-offset-2 ring-offset-background scale-[1.02] shadow-sm"
                : "border-border bg-card hover:bg-muted/40 hover:border-border/80"
            }`}
          >
            <div className="text-2xl font-bold tabular-nums text-foreground">
              {apps.length}
            </div>
            <div className="mt-0.5 flex items-center justify-center gap-1 text-xs font-medium text-muted-foreground">
              <LayersIcon className="size-3" />
              <span>All</span>
            </div>
          </button>

          {/* Status specific cards */}
          {(["applied", "interview", "offer", "rejected", "withdrawn"] as ApplicationStatus[]).map(
            (status) => {
              const style = STATUS_CARD_STYLES[status];
              const isActive = statusFilter === status;
              return (
                <button
                  type="button"
                  key={status}
                  onClick={() => handleStatusCardClick(status)}
                  className={`rounded-2xl border p-4 text-center transition-all cursor-pointer ${
                    style.card
                  } ${isActive ? `${style.activeBorder} scale-[1.02] shadow-sm font-semibold` : ""}`}
                >
                  <div className={`text-2xl font-bold tabular-nums ${style.num}`}>
                    {counts[status] ?? 0}
                  </div>
                  <div className={`mt-0.5 text-xs font-medium capitalize ${style.label}`}>
                    {status}
                  </div>
                </button>
              );
            }
          )}
        </div>

        {/* ── Search & Filter & Sort Toolbar ── */}
        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-xs">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by role, company, or location..."
                className="h-10 w-full rounded-full border border-input bg-input/20 pl-9 pr-9 text-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  title="Clear search"
                >
                  <XIcon className="size-4" />
                </button>
              )}
            </div>

            {/* Filter and Sort Controls */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Status Select */}
              <div className="relative inline-flex items-center">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as ApplicationStatus | "all")}
                  aria-label="Filter by status"
                  className="h-10 appearance-none rounded-full border border-input bg-input/20 pl-3.5 pr-8 text-xs font-medium text-foreground focus-visible:border-ring focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring cursor-pointer transition-colors"
                >
                  <option value="all">Status: All</option>
                  <option value="applied">Status: Applied</option>
                  <option value="interview">Status: Interview</option>
                  <option value="offer">Status: Offer</option>
                  <option value="rejected">Status: Rejected</option>
                  <option value="withdrawn">Status: Withdrawn</option>
                </select>
                <ChevronDownIcon className="pointer-events-none absolute right-2.5 size-3.5 text-muted-foreground" />
              </div>

              {/* Work Mode Select */}
              <div className="relative inline-flex items-center">
                <select
                  value={workModeFilter}
                  onChange={(e) => setWorkModeFilter(e.target.value)}
                  aria-label="Filter by work mode"
                  className="h-10 appearance-none rounded-full border border-input bg-input/20 pl-3.5 pr-8 text-xs font-medium text-foreground focus-visible:border-ring focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring cursor-pointer transition-colors"
                >
                  <option value="all">Mode: All</option>
                  <option value="remote">Mode: Remote</option>
                  <option value="hybrid">Mode: Hybrid</option>
                  <option value="onsite">Mode: Onsite</option>
                </select>
                <ChevronDownIcon className="pointer-events-none absolute right-2.5 size-3.5 text-muted-foreground" />
              </div>

              {/* Sort Select */}
              <div className="relative inline-flex items-center">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  aria-label="Sort applications"
                  className="h-10 appearance-none rounded-full border border-input bg-input/20 pl-3.5 pr-8 text-xs font-medium text-foreground focus-visible:border-ring focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring cursor-pointer transition-colors"
                >
                  <option value="date-desc">Date: Newest first</option>
                  <option value="date-asc">Date: Oldest first</option>
                  <option value="company-asc">Company: A to Z</option>
                  <option value="company-desc">Company: Z to A</option>
                  <option value="role-asc">Role: A to Z</option>
                  <option value="role-desc">Role: Z to A</option>
                  <option value="salary-desc">Salary: High to Low</option>
                  <option value="salary-asc">Salary: Low to High</option>
                </select>
                <ChevronDownIcon className="pointer-events-none absolute right-2.5 size-3.5 text-muted-foreground" />
              </div>

              {/* Clear filters button */}
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="h-10 px-3 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                  title="Clear all filters"
                >
                  <RotateCcwIcon className="size-3.5 mr-1" />
                  Reset
                </Button>
              )}
            </div>
          </div>

          {/* Active filter badges indicator */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-border/60 text-xs text-muted-foreground">
              <span className="font-medium">
                Showing {sortedAndFilteredApps.length} of {apps.length} applications
              </span>
              {statusFilter !== "all" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2.5 py-0.5 font-medium capitalize">
                  Status: {statusFilter}
                  <button
                    onClick={() => setStatusFilter("all")}
                    className="hover:opacity-75 cursor-pointer ml-0.5"
                    title="Remove status filter"
                  >
                    <XIcon className="size-3" />
                  </button>
                </span>
              )}
              {workModeFilter !== "all" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2.5 py-0.5 font-medium capitalize">
                  Mode: {workModeFilter}
                  <button
                    onClick={() => setWorkModeFilter("all")}
                    className="hover:opacity-75 cursor-pointer ml-0.5"
                    title="Remove mode filter"
                  >
                    <XIcon className="size-3" />
                  </button>
                </span>
              )}
              {searchQuery && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2.5 py-0.5 font-medium">
                  Search: &quot;{searchQuery}&quot;
                  <button
                    onClick={() => setSearchQuery("")}
                    className="hover:opacity-75 cursor-pointer ml-0.5"
                    title="Clear search query"
                  >
                    <XIcon className="size-3" />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* ── Table header & Add button ── */}
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">
            Applications{" "}
            <span className="text-base font-normal text-muted-foreground">
              ({sortedAndFilteredApps.length}
              {hasActiveFilters && ` filtered from ${apps.length}`})
            </span>
          </h1>
          <Button size="sm" onClick={() => setShowAdd(true)}>
            <PlusIcon className="size-4" />
            Add Application
          </Button>
        </div>

        {/* ── Table ── */}
        {apps.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
            <BriefcaseIcon className="mb-3 size-10 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              No applications yet.{" "}
              <button
                className="underline underline-offset-4 hover:text-foreground cursor-pointer"
                onClick={() => setShowAdd(true)}
              >
                Add your first one.
              </button>
            </p>
          </div>
        ) : sortedAndFilteredApps.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
            <SearchIcon className="mb-3 size-10 text-muted-foreground/40" />
            <p className="text-base font-medium">No matching applications</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Try adjusting your search query or filters to find what you&apos;re looking for.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllFilters}
              className="mt-4 cursor-pointer"
            >
              <RotateCcwIcon className="size-3.5 mr-1" />
              Reset all filters
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left text-xs text-muted-foreground select-none">
                  {/* Clickable Role Header */}
                  <th
                    className="px-4 py-3 font-medium cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => toggleSort("role")}
                    title="Sort by Role"
                  >
                    <div className="flex items-center gap-1">
                      <span>Role</span>
                      {sortBy === "role-asc" ? (
                        <ArrowUpIcon className="size-3 text-primary" />
                      ) : sortBy === "role-desc" ? (
                        <ArrowDownIcon className="size-3 text-primary" />
                      ) : (
                        <ArrowUpDownIcon className="size-3 opacity-40 hover:opacity-100" />
                      )}
                    </div>
                  </th>

                  {/* Clickable Company Header */}
                  <th
                    className="px-4 py-3 font-medium cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => toggleSort("company")}
                    title="Sort by Company"
                  >
                    <div className="flex items-center gap-1">
                      <span>Company</span>
                      {sortBy === "company-asc" ? (
                        <ArrowUpIcon className="size-3 text-primary" />
                      ) : sortBy === "company-desc" ? (
                        <ArrowDownIcon className="size-3 text-primary" />
                      ) : (
                        <ArrowUpDownIcon className="size-3 opacity-40 hover:opacity-100" />
                      )}
                    </div>
                  </th>

                  {/* Status Header */}
                  <th className="hidden px-4 py-3 font-medium sm:table-cell">Status</th>

                  {/* Mode Header */}
                  <th className="hidden px-4 py-3 font-medium md:table-cell">Mode</th>

                  {/* Clickable Date Header */}
                  <th
                    className="hidden px-4 py-3 font-medium lg:table-cell cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => toggleSort("date")}
                    title="Sort by Date"
                  >
                    <div className="flex items-center gap-1">
                      <span>Date</span>
                      {sortBy === "date-asc" ? (
                        <ArrowUpIcon className="size-3 text-primary" />
                      ) : sortBy === "date-desc" ? (
                        <ArrowDownIcon className="size-3 text-primary" />
                      ) : (
                        <ArrowUpDownIcon className="size-3 opacity-40 hover:opacity-100" />
                      )}
                    </div>
                  </th>

                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {sortedAndFilteredApps.map((app, i) => (
                  <tr
                    key={app.applicationId}
                    onClick={() => router.push(`/dashboard/${app.applicationId}`)}
                    className={`cursor-pointer border-b border-border last:border-0 transition-colors hover:bg-muted/40 active:bg-muted/60 ${
                      i % 2 === 0 ? "" : "bg-muted/10"
                    }`}
                  >
                    <td className="px-4 py-3 font-medium">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-foreground">{app.title}</span>
                        {app.jobUrl && (
                          <a
                            href={app.jobUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-muted-foreground hover:text-primary transition-colors"
                            title="Open job link"
                          >
                            <ExternalLinkIcon className="size-3.5" />
                          </a>
                        )}
                      </div>
                      {/* Location snippet if present */}
                      {app.location && (
                        <div className="text-xs text-muted-foreground">
                          {app.location}
                        </div>
                      )}
                      {/* Quick status selector on mobile screens */}
                      <div className="mt-1.5 sm:hidden" onClick={(e) => e.stopPropagation()}>
                        <QuickStatusSelect
                          status={app.status}
                          onChange={(newStatus) =>
                            handleQuickStatusChange(app.applicationId, newStatus)
                          }
                          size="sm"
                        />
                      </div>
                    </td>

                    <td className="px-4 py-3 text-muted-foreground">
                      {app.companyName}
                    </td>

                    {/* Quick status selector in table */}
                    <td
                      className="hidden px-4 py-3 sm:table-cell"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <QuickStatusSelect
                        status={app.status}
                        onChange={(newStatus) =>
                          handleQuickStatusChange(app.applicationId, newStatus)
                        }
                        size="sm"
                      />
                    </td>

                    <td className="hidden px-4 py-3 capitalize text-muted-foreground md:table-cell">
                      {app.workMode}
                    </td>

                    <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">
                      {formatDate(app.appliedAt ?? app.createdAt)}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditing(app);
                          }}
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                          title="Edit application"
                        >
                          <PencilIcon className="size-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleting(app);
                          }}
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer"
                          title="Delete application"
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
