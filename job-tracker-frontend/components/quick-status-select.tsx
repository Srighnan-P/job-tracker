"use client";

import { useState, useRef, useEffect } from "react";
import type { ApplicationStatus } from "@/lib/types";
import { ChevronDownIcon, CheckIcon, Loader2Icon } from "lucide-react";

export const STATUS_OPTIONS: { value: ApplicationStatus; label: string; dot: string; badge: string }[] = [
  {
    value: "applied",
    label: "Applied",
    dot: "bg-blue-500",
    badge: "bg-blue-100 text-blue-700 hover:bg-blue-200/80 dark:bg-blue-900/40 dark:text-blue-300 dark:hover:bg-blue-900/60",
  },
  {
    value: "interview",
    label: "Interview",
    dot: "bg-violet-500",
    badge: "bg-violet-100 text-violet-700 hover:bg-violet-200/80 dark:bg-violet-900/40 dark:text-violet-300 dark:hover:bg-violet-900/60",
  },
  {
    value: "offer",
    label: "Offer",
    dot: "bg-emerald-500",
    badge: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200/80 dark:bg-emerald-900/40 dark:text-emerald-300 dark:hover:bg-emerald-900/60",
  },
  {
    value: "rejected",
    label: "Rejected",
    dot: "bg-red-500",
    badge: "bg-red-100 text-red-700 hover:bg-red-200/80 dark:bg-red-900/40 dark:text-red-300 dark:hover:bg-red-900/60",
  },
  {
    value: "withdrawn",
    label: "Withdrawn",
    dot: "bg-zinc-500",
    badge: "bg-zinc-100 text-zinc-700 hover:bg-zinc-200/80 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700",
  },
];

interface QuickStatusSelectProps {
  status: ApplicationStatus;
  onChange: (newStatus: ApplicationStatus) => Promise<void> | void;
  size?: "sm" | "default";
  disabled?: boolean;
}

export function QuickStatusSelect({
  status,
  onChange,
  size = "sm",
  disabled = false,
}: QuickStatusSelectProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentOption =
    STATUS_OPTIONS.find((opt) => opt.value === status) ?? STATUS_OPTIONS[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  async function handleSelect(newStatus: ApplicationStatus, e: React.MouseEvent) {
    e.stopPropagation();
    if (newStatus === status || loading || disabled) {
      setOpen(false);
      return;
    }

    setOpen(false);
    setLoading(true);
    try {
      await onChange(newStatus);
    } finally {
      setLoading(false);
    }
  }

  const isSmall = size === "sm";

  return (
    <div
      ref={containerRef}
      className="relative inline-block text-left"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        disabled={disabled || loading}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
        title="Quick change status"
        className={`group inline-flex items-center gap-1.5 rounded-full font-medium transition-all cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring ${
          isSmall ? "px-2.5 py-0.5 text-xs" : "px-3.5 py-1 text-sm"
        } ${currentOption.badge} ${
          open ? "ring-2 ring-primary/40 shadow-xs" : ""
        } ${disabled || loading ? "opacity-75 cursor-not-allowed" : ""}`}
      >
        {loading ? (
          <Loader2Icon className={`animate-spin ${isSmall ? "size-3" : "size-3.5"}`} />
        ) : (
          <span className={`inline-block rounded-full ${currentOption.dot} ${isSmall ? "size-1.5" : "size-2"}`} />
        )}
        <span className="capitalize">{currentOption.label}</span>
        <ChevronDownIcon
          className={`transition-transform duration-150 text-current/70 group-hover:text-current ${
            open ? "rotate-180" : ""
          } ${isSmall ? "size-3" : "size-3.5"}`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Change status"
          className="absolute left-0 z-50 mt-1.5 min-w-[140px] origin-top-left rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-xl ring-1 ring-foreground/5 animate-in fade-in-0 zoom-in-95 duration-100"
        >
          <div className="px-2 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Update Status
          </div>
          {STATUS_OPTIONS.map((opt) => {
            const isSelected = opt.value === status;
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={(e) => handleSelect(opt.value, e)}
                className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-xs text-left transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-accent font-semibold text-accent-foreground"
                    : "hover:bg-muted/70 text-foreground"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`inline-block size-2 rounded-full ${opt.dot}`} />
                  <span className="capitalize">{opt.label}</span>
                </div>
                {isSelected && <CheckIcon className="size-3.5 text-primary shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
