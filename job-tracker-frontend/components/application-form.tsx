"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { applications } from "@/lib/api";
import type { Application, ApplicationFormData, ApplicationStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const STATUSES: ApplicationStatus[] = [
  "applied",
  "interview",
  "offer",
  "rejected",
  "withdrawn",
];

const WORK_MODES = ["remote", "hybrid", "onsite"];
const EMPLOYMENT_TYPES = ["full-time", "part-time", "contract", "internship"];

interface ApplicationFormProps {
  initial?: Application; // provided when editing
  onSuccess: () => void;
  onCancel: () => void;
}

export function ApplicationForm({
  initial,
  onSuccess,
  onCancel,
}: ApplicationFormProps) {
  const isEdit = !!initial;
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = e.currentTarget;
    const v = (name: string) =>
      (form.elements.namedItem(name) as HTMLInputElement).value.trim();

    const salaryMin = v("salaryMin") ? Number(v("salaryMin")) : undefined;
    const salaryMax = v("salaryMax") ? Number(v("salaryMax")) : undefined;

    const data: ApplicationFormData = {
      job: {
        title: v("title"),
        companyName: v("companyName"),
        workMode: v("workMode"),
        location: v("location") || undefined,
        employmentType: v("employmentType") || undefined,
        salaryMin,
        salaryMax,
        salaryCurrency: v("salaryCurrency") || undefined,
        description: v("description") || undefined,
        jobUrl: v("jobUrl") || undefined,
        source: v("source") || undefined,
      },
      application: {
        status: v("status") as ApplicationStatus,
        notes: v("notes") || undefined,
      },
    };

    try {
      if (isEdit) {
        await applications.update(initial!.applicationId, data);
      } else {
        await applications.create(data);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message ?? err.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <FieldGroup>
        {/* ── Required ── */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="title">Job Title *</FieldLabel>
            <Input
              id="title"
              name="title"
              required
              defaultValue={initial?.title}
              placeholder="Software Engineer"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="companyName">Company *</FieldLabel>
            <Input
              id="companyName"
              name="companyName"
              required
              defaultValue={initial?.companyName}
              placeholder="Acme Corp"
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="status">Status *</FieldLabel>
            <select
              id="status"
              name="status"
              required
              defaultValue={initial?.status ?? "applied"}
              className="h-9 w-full rounded-4xl border border-input bg-input/30 px-3 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </Field>

          <Field>
            <FieldLabel htmlFor="workMode">Work Mode *</FieldLabel>
            <select
              id="workMode"
              name="workMode"
              required
              defaultValue={initial?.workMode ?? "remote"}
              className="h-9 w-full rounded-4xl border border-input bg-input/30 px-3 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              {WORK_MODES.map((m) => (
                <option key={m} value={m}>
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </option>
              ))}
            </select>
          </Field>
        </div>

        {/* ── Optional ── */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="location">Location</FieldLabel>
            <Input
              id="location"
              name="location"
              defaultValue={initial?.location ?? ""}
              placeholder="San Francisco, CA"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="employmentType">Employment Type</FieldLabel>
            <select
              id="employmentType"
              name="employmentType"
              defaultValue={initial?.employmentType ?? ""}
              className="h-9 w-full rounded-4xl border border-input bg-input/30 px-3 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <option value="">— select —</option>
              {EMPLOYMENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Field>
            <FieldLabel htmlFor="salaryMin">Salary Min</FieldLabel>
            <Input
              id="salaryMin"
              name="salaryMin"
              type="number"
              min={0}
              defaultValue={initial?.salaryMin ?? ""}
              placeholder="60000"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="salaryMax">Salary Max</FieldLabel>
            <Input
              id="salaryMax"
              name="salaryMax"
              type="number"
              min={0}
              defaultValue={initial?.salaryMax ?? ""}
              placeholder="90000"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="salaryCurrency">Currency</FieldLabel>
            <Input
              id="salaryCurrency"
              name="salaryCurrency"
              defaultValue={initial?.salaryCurrency ?? ""}
              placeholder="USD"
              maxLength={3}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="jobUrl">Job URL</FieldLabel>
            <Input
              id="jobUrl"
              name="jobUrl"
              type="url"
              defaultValue={initial?.jobUrl ?? ""}
              placeholder="https://..."
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="source">Source</FieldLabel>
            <Input
              id="source"
              name="source"
              defaultValue={initial?.source ?? ""}
              placeholder="LinkedIn, referral…"
            />
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="description">Job Description</FieldLabel>
          <textarea
            id="description"
            name="description"
            rows={3}
            defaultValue={initial?.description ?? ""}
            placeholder="Paste the job description…"
            className="w-full rounded-2xl border border-input bg-input/30 px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 resize-none"
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="notes">Notes</FieldLabel>
          <textarea
            id="notes"
            name="notes"
            rows={2}
            defaultValue={initial?.notes ?? ""}
            placeholder="Your private notes…"
            className="w-full rounded-2xl border border-input bg-input/30 px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 resize-none"
          />
        </Field>

        {error && <FieldError>{error}</FieldError>}

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading
              ? isEdit
                ? "Saving…"
                : "Adding…"
              : isEdit
              ? "Save changes"
              : "Add application"}
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
