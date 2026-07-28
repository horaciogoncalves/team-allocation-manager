"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, ClipboardPlus, LayoutList, Pencil, Timeline as TimelineIcon, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/ui/loading";
import { Select } from "@/components/ui/select";
import { ResponsiveTable } from "@/components/ui/responsive-table";
import type { ResponsiveTableColumn } from "@/components/ui/responsive-table";
import { Timeline } from "@/components/ui/timeline";
import { useFeedback } from "@/components/ui/feedback";
import {
  createAllocation,
  deleteAllocation,
  getAllocations,
  getMembers,
  getProjects,
  updateAllocation,
} from "@/lib/api";
import { getDateRange } from "@/lib/date-utils";
import { allocationsOverlap } from "@/lib/overlap";
import type { AllocationWithDetails, AllocationFormData, Member, Project } from "@/lib/types";

const initialFormData: AllocationFormData = {
  member_id: "",
  project_id: "",
  allocation_percentage: 0,
  start_date: "",
  end_date: "",
};

type AllocationsSortKey = "member_name" | "project_name" | "allocation_percentage" | "start_date";

type AllocationView = "list" | "timeline";
type DateRangeMode = "last3m" | "next3m" | "next6m" | "next12m" | "all";

function formatDate(date: string | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString();
}

function countOverallocations(allocations: AllocationWithDetails[], members: Member[]) {
  const memberTotals = new Map<string, number>();

  allocations.forEach((allocation) => {
    memberTotals.set(
      allocation.member_id,
      (memberTotals.get(allocation.member_id) ?? 0) + allocation.allocation_percentage
    );
  });

  const overallocatedMembers = members.filter(
    (member) => (memberTotals.get(member.id) ?? 0) > 100
  );

  return {
    count: overallocatedMembers.length,
    memberIds: new Set(overallocatedMembers.map((m) => m.id)),
  };
}

export default function AllocationsPage() {
  const [allocations, setAllocations] = useState<AllocationWithDetails[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<AllocationFormData>(initialFormData);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<
    Partial<Record<keyof AllocationFormData, string>>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [memberFilter, setMemberFilter] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [sortKey, setSortKey] = useState<AllocationsSortKey>("start_date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [view, setView] = useState<AllocationView>("list");
  const [dateRangeMode, setDateRangeMode] = useState<DateRangeMode>("next6m");
  const [deleteTarget, setDeleteTarget] = useState<AllocationWithDetails | null>(null);
  const deleteTriggerRef = useRef<HTMLElement | null>(null);
  const formCardRef = useRef<HTMLDivElement>(null);
  const firstSelectRef = useRef<HTMLSelectElement>(null);
  const { announce } = useFeedback();

  async function loadData() {
    try {
      setLoading(true);
      setError(null);
      const [
        { data: allocationsData, error: allocationsError },
        { data: membersData, error: membersError },
        { data: projectsData, error: projectsError },
      ] = await Promise.all([getAllocations(), getMembers(), getProjects()]);

      if (allocationsError || membersError || projectsError) {
        setError(allocationsError ?? membersError ?? projectsError ?? "Failed to load data.");
        return;
      }

      setAllocations(allocationsData ?? []);
      setMembers(membersData ?? []);
      setProjects(projectsData ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function handleSort(key: AllocationsSortKey) {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  }

  const memberTotals = useMemo(() => {
    const totals = new Map<string, number>();
    allocations.forEach((allocation) => {
      totals.set(
        allocation.member_id,
        (totals.get(allocation.member_id) ?? 0) + allocation.allocation_percentage
      );
    });
    return totals;
  }, [allocations]);

  const memberAllocationSummary = useMemo(() => {
    if (!formData.member_id) {
      return {
        overlappingTotal: 0,
        projectedTotal: 0,
        memberOverallocated: false,
      };
    }

    const newRange = {
      start_date: formData.start_date || null,
      end_date: formData.end_date || null,
    };

    const overlappingTotal = allocations
      .filter(
        (a) =>
          a.member_id === formData.member_id &&
          a.id !== editingId &&
          allocationsOverlap(
            { start_date: a.start_date, end_date: a.end_date },
            newRange
          )
      )
      .reduce((sum, a) => sum + a.allocation_percentage, 0);

    const projectedTotal = overlappingTotal + formData.allocation_percentage;

    return {
      overlappingTotal,
      projectedTotal,
      memberOverallocated: projectedTotal > 100,
    };
  }, [
    allocations,
    formData.member_id,
    formData.start_date,
    formData.end_date,
    formData.allocation_percentage,
    editingId,
  ]);

  const { overlappingTotal, projectedTotal, memberOverallocated } =
    memberAllocationSummary;

  const conflictError = useMemo(() => {
    if (editingId || !formData.member_id || !memberOverallocated) {
      return null;
    }
    const member = members.find((m) => m.id === formData.member_id);
    return `Cannot create allocation: ${member?.name ?? "This member"} would be allocated ${projectedTotal}% across overlapping allocations (maximum 100%).`;
  }, [editingId, formData.member_id, memberOverallocated, members, projectedTotal]);

  const { count: overallocationCount, memberIds } = useMemo(
    () => countOverallocations(allocations, members),
    [allocations, members]
  );
  const hasOverallocations = overallocationCount > 0;
  const overallocatedMemberNames = members
    .filter((m) => memberIds.has(m.id))
    .map((m) => m.name);

  const timelineDateRange = useMemo(
    () => getDateRange(dateRangeMode, allocations),
    [dateRangeMode, allocations]
  );

  const dateRangeOptions = [
    { value: "last3m", label: "Last 3 months" },
    { value: "next3m", label: "Next 3 months" },
    { value: "next6m", label: "Next 6 months" },
    { value: "next12m", label: "Next 12 months" },
    { value: "all", label: "All time" },
  ];

  function validateForm(data: AllocationFormData): boolean {
    const errors: Partial<Record<keyof AllocationFormData, string>> = {};
    if (!data.member_id) {
      errors.member_id = "Please select a member.";
    }
    if (!data.project_id) {
      errors.project_id = "Please select a project.";
    }
    if (
      typeof data.allocation_percentage !== "number" ||
      Number.isNaN(data.allocation_percentage) ||
      data.allocation_percentage < 0 ||
      data.allocation_percentage > 100
    ) {
      errors.allocation_percentage = "Percentage must be between 0 and 100.";
    }
    if (data.start_date && data.end_date && data.end_date < data.start_date) {
      errors.end_date = "End date must be on or after start date.";
    }
    setFormErrors(errors);

    if (!editingId && conflictError) {
      return false;
    }

    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateForm(formData)) return;

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        allocation_percentage: Number(formData.allocation_percentage),
        start_date: formData.start_date || undefined,
        end_date: formData.end_date || undefined,
      };

      if (editingId) {
        const { error: apiError } = await updateAllocation(editingId, payload);
        if (apiError) {
          setError(apiError);
          return;
        }
        announce("Allocation updated");
      } else {
        const { error: apiError } = await createAllocation(payload);
        if (apiError) {
          setError(apiError);
          return;
        }
        announce("Allocation created");
      }
      setFormData(initialFormData);
      setEditingId(null);
      setFormErrors({});
      await loadData();
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleEdit(allocation: AllocationWithDetails) {
    setFormData({
      member_id: allocation.member_id,
      project_id: allocation.project_id,
      allocation_percentage: allocation.allocation_percentage,
      start_date: allocation.start_date ?? "",
      end_date: allocation.end_date ?? "",
    });
    setEditingId(allocation.id);
    setFormErrors({});
    formCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => firstSelectRef.current?.focus(), 300);
  }

  function handleCancel() {
    setFormData(initialFormData);
    setEditingId(null);
    setFormErrors({});
  }

  async function confirmDelete() {
    if (!deleteTarget) return;

    const { error: apiError } = await deleteAllocation(deleteTarget.id);
    if (apiError) {
      setError(apiError);
      setDeleteTarget(null);
      return;
    }
    announce("Allocation deleted");
    setDeleteTarget(null);
    await loadData();
  }

  function handleAddClick() {
    setEditingId(null);
    setFormData(initialFormData);
    setFormErrors({});
    formCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => firstSelectRef.current?.focus(), 300);
  }

  const memberOptions = members.map((member) => ({
    value: member.id,
    label: `${member.name} (${member.email})`,
  }));

  const projectOptions = projects.map((project) => ({
    value: project.id,
    label: project.name,
  }));

  const memberFilterOptions = [{ value: "", label: "All members" }, ...memberOptions];

  const projectFilterOptions = [{ value: "", label: "All projects" }, ...projectOptions];

  const filteredAllocations = allocations.filter((allocation) => {
    const searchLower = search.toLowerCase();
    const matchesSearch =
      (allocation.member?.name ?? "").toLowerCase().includes(searchLower) ||
      (allocation.project?.name ?? "").toLowerCase().includes(searchLower);
    const matchesMember = memberFilter ? allocation.member_id === memberFilter : true;
    const matchesProject = projectFilter ? allocation.project_id === projectFilter : true;
    return matchesSearch && matchesMember && matchesProject;
  });

  const sortedAllocations = [...filteredAllocations].sort((a, b) => {
    let aValue: string | number;
    let bValue: string | number;

    switch (sortKey) {
      case "member_name":
        aValue = a.member?.name ?? "";
        bValue = b.member?.name ?? "";
        break;
      case "project_name":
        aValue = a.project?.name ?? "";
        bValue = b.project?.name ?? "";
        break;
      case "allocation_percentage":
        aValue = a.allocation_percentage;
        bValue = b.allocation_percentage;
        break;
      case "start_date":
      default:
        aValue = a.start_date ?? "";
        bValue = b.start_date ?? "";
        break;
    }

    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const isEmpty = !loading && allocations.length === 0;
  const noResults = !loading && allocations.length > 0 && filteredAllocations.length === 0;

  function isAllocationOverallocated(allocation: AllocationWithDetails): boolean {
    return (memberTotals.get(allocation.member_id) ?? 0) > 100;
  }

  const allocationColumns: ResponsiveTableColumn<AllocationWithDetails, AllocationsSortKey>[] = [
    {
      key: "member_name",
      header: "Member",
      cell: (allocation) => {
        const overallocated = isAllocationOverallocated(allocation);
        return (
          <>
            <Link
              href="/members"
              className="hover:text-indigo-700 dark:hover:text-indigo-400 hover:underline focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:ring-offset-2 rounded px-0.5"
            >
              {allocation.member?.name ?? "Unknown"}
            </Link>
            {overallocated && (
              <span className="sr-only"> contributes to an over-allocation</span>
            )}
          </>
        );
      },
      sortKey: "member_name",
      isRowHeader: true,
    },
    {
      key: "project_name",
      header: "Project",
      cell: (allocation) => (
        <Link
          href="/projects"
          className="hover:text-indigo-700 dark:hover:text-indigo-400 hover:underline focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:ring-offset-2 rounded px-0.5"
        >
          {allocation.project?.name ?? "Unknown"}
        </Link>
      ),
      sortKey: "project_name",
    },
    {
      key: "allocation_percentage",
      header: "Allocation",
      cell: (allocation) => {
        const overallocated = isAllocationOverallocated(allocation);
        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              overallocated
                ? "bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300"
                : "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300"
            }`}
          >
            {allocation.allocation_percentage}%
          </span>
        );
      },
      sortKey: "allocation_percentage",
      align: "right",
    },
    {
      key: "start_date",
      header: "Dates",
      cell: (allocation) =>
        allocation.start_date && allocation.end_date
          ? `${formatDate(allocation.start_date)} → ${formatDate(allocation.end_date)}`
          : allocation.start_date
          ? `From ${formatDate(allocation.start_date)}`
          : allocation.end_date
          ? `Until ${formatDate(allocation.end_date)}`
          : "—",
      sortKey: "start_date",
      align: "right",
      className: "tabular-nums",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Allocations
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-1">Assign team members to projects.</p>
        </div>
        <Button onClick={handleAddClick}>
          <ClipboardPlus className="w-4 h-4" aria-hidden="true" />
          Add Allocation
        </Button>
      </div>

      {error && (
        <div
          role="alert"
          aria-live="polite"
          aria-atomic="true"
          className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 dark:bg-red-950/30 dark:border-red-900/50 dark:text-red-300"
        >
          {error}
        </div>
      )}

      {hasOverallocations && (
        <div
          role="alert"
          className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800 dark:bg-amber-950/30 dark:border-amber-900/50 dark:text-amber-300"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="flex-1">
              <p className="font-medium">Overallocation detected</p>
              <p className="mt-1">
                Member{overallocatedMemberNames.length === 1 ? "" : "s"}{" "}
                <strong>{overallocatedMemberNames.join(", ")}</strong>{" "}
                {overallocatedMemberNames.length === 1 ? "is" : "are"} allocated more than 100% across projects.
              </p>
            </div>
            <Link
              href="/allocations"
              className="inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-xs font-medium bg-amber-100 text-amber-900 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-200 dark:hover:bg-amber-900/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:ring-offset-2 shrink-0"
            >
              Review allocations
            </Link>
          </div>
        </div>
      )}

      <Card className="mb-8" ref={formCardRef}>
        <CardHeader>
          <CardTitle>{editingId ? "Edit Allocation" : "Add Allocation"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Member"
                options={memberOptions}
                value={formData.member_id}
                onChange={(e) => setFormData({ ...formData, member_id: e.target.value })}
                error={formErrors.member_id}
                required
                ref={firstSelectRef}
              />
              <Select
                label="Project"
                options={projectOptions}
                value={formData.project_id}
                onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                error={formErrors.project_id}
                required
              />
            </div>
            {(formData.member_id || formData.project_id) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {formData.member_id && (
                  <div
                    className={`rounded-lg p-3 text-sm border ${
                      memberOverallocated
                        ? "bg-red-50 border-red-200 text-red-800 dark:bg-red-950/30 dark:border-red-900/50 dark:text-red-300"
                        : "bg-zinc-50 border-zinc-200 text-zinc-700 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300"
                    }`}
                    role={memberOverallocated ? "alert" : undefined}
                  >
                    <span className="font-medium">Member allocation:</span>{" "}
                    {overlappingTotal}% overlapping → would become{" "}
                    <span className={memberOverallocated ? "font-bold" : ""}>
                      {projectedTotal}%
                    </span>
                    {conflictError && (
                      <span className="block mt-1 font-medium">
                        {conflictError}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Allocation Percentage"
                type="number"
                min={0}
                max={100}
                step={1}
                value={formData.allocation_percentage}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    allocation_percentage: e.target.value === "" ? 0 : Number(e.target.value),
                  })
                }
                error={formErrors.allocation_percentage}
                helperText="Percentage of the member's time allocated to this project (0-100)"
                required
              />
              <Input
                label="Start Date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                helperText="Optional. Defines when the allocation is active."
              />
              <Input
                label="End Date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                error={formErrors.end_date}
                helperText="Optional. Defines when the allocation is active."
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="submit"
                isLoading={isSubmitting}
                disabled={!editingId && !!conflictError}
              >
                {editingId ? "Update Allocation" : "Add Allocation"}
              </Button>
              {editingId && (
                <Button type="button" variant="secondary" onClick={handleCancel}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>{view === "list" ? "Allocation List" : "Allocation Timeline"}</CardTitle>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="inline-flex rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden">
                <Button
                  type="button"
                  variant={view === "list" ? "primary" : "ghost"}
                  size="sm"
                  onClick={() => setView("list")}
                  className="rounded-none"
                  aria-label="Show list view"
                >
                  <LayoutList className="w-4 h-4" aria-hidden="true" />
                  List
                </Button>
                <Button
                  type="button"
                  variant={view === "timeline" ? "primary" : "ghost"}
                  size="sm"
                  onClick={() => setView("timeline")}
                  className="rounded-none"
                  aria-label="Show timeline view"
                >
                  <TimelineIcon className="w-4 h-4" aria-hidden="true" />
                  Timeline
                </Button>
              </div>
              {view === "timeline" && (
                <Select
                  aria-label="Select date range"
                  options={dateRangeOptions}
                  value={dateRangeMode}
                  showEmptyOption={false}
                  onChange={(e) => setDateRangeMode(e.target.value as DateRangeMode)}
                  className="max-w-[180px]"
                />
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {view === "list" ? (
            <>
              <div className="mb-4 flex flex-col lg:flex-row gap-4">
            <Input
              type="search"
              placeholder="Search by member or project..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search allocations"
              className="max-w-md"
            />
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <Select
                aria-label="Filter by member"
                options={memberFilterOptions}
                value={memberFilter}
                onChange={(e) => setMemberFilter(e.target.value)}
                className="max-w-xs"
              />
              <Select
                aria-label="Filter by project"
                options={projectFilterOptions}
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                className="max-w-xs"
              />
            </div>
          </div>

          <ResponsiveTable
            columns={allocationColumns}
            data={sortedAllocations}
            keyExtractor={(allocation) => allocation.id}
            actions={(allocation) => (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(allocation)}
                  aria-label="Edit allocation"
                  className="min-h-11 min-w-11 md:min-h-7 md:min-w-7"
                >
                  <Pencil className="w-4 h-4" aria-hidden="true" />
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={(e) => {
                    deleteTriggerRef.current = e.currentTarget;
                    setDeleteTarget(allocation);
                  }}
                  aria-label="Delete allocation"
                  className="min-h-11 min-w-11 md:min-h-7 md:min-w-7"
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                </Button>
              </>
            )}
            emptyState={
              isEmpty ? (
                <EmptyState
                  title="No allocations yet"
                  description="Assign a member to a project using the form above."
                />
              ) : noResults ? (
                <EmptyState
                  title="No allocations found"
                  description="Try adjusting your search or filters."
                />
              ) : null
            }
            loadingState={<LoadingState />}
            isLoading={loading}
            sortKey={sortKey}
            sortDirection={sortDirection}
            onSort={handleSort}
            rowClassName={(allocation) =>
              isAllocationOverallocated(allocation)
                ? "bg-amber-50/60 dark:bg-amber-950/20"
                : undefined
            }
          />
            </>
          ) : (
            <Timeline
              projects={projects}
              allocations={allocations}
              members={members}
              startDate={timelineDateRange.start}
              endDate={timelineDateRange.end}
            />
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title="Delete allocation?"
        message={
          deleteTarget
            ? `Are you sure you want to delete this allocation? This action cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
        triggerRef={deleteTriggerRef}
      />
    </div>
  );
}
