"use client";

import { useEffect, useRef, useState } from "react";
import { FolderPlus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/ui/loading";
import { Select } from "@/components/ui/select";
import { ResponsiveTable } from "@/components/ui/responsive-table";
import type { ResponsiveTableColumn } from "@/components/ui/responsive-table";
import { Textarea } from "@/components/ui/textarea";
import { useFeedback } from "@/components/ui/feedback";
import { createProject, deleteProject, getProjects, updateProject } from "@/lib/api";
import type { Project, ProjectFormData } from "@/lib/types";

const initialFormData: ProjectFormData = {
  name: "",
  description: "",
  status: "active",
  start_date: "",
  end_date: "",
};

const statusOptions = [
  { value: "active", label: "Active" },
  { value: "on-hold", label: "On Hold" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const statusFilterOptions = [{ value: "", label: "All statuses" }, ...statusOptions];

type ProjectsSortKey = "name" | "status" | "start_date" | "end_date" | "created_at";

const statusBadgeClasses: Record<string, string> = {
  active:
    "bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-300",
  completed:
    "bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300",
  "on-hold":
    "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300",
  cancelled:
    "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300",
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProjectFormData>(initialFormData);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof ProjectFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortKey, setSortKey] = useState<ProjectsSortKey>("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const deleteTriggerRef = useRef<HTMLElement | null>(null);
  const formCardRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);
  const { announce } = useFeedback();

  async function loadProjects() {
    try {
      setLoading(true);
      setError(null);
      const { data, error: apiError } = await getProjects();
      if (apiError) {
        setError(apiError);
        return;
      }
      setProjects(data ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProjects();
  }, []);

  function handleSort(key: ProjectsSortKey) {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  }

  function validateForm(data: ProjectFormData): boolean {
    const errors: Partial<Record<keyof ProjectFormData, string>> = {};
    if (!data.name.trim()) {
      errors.name = "Project name is required.";
    }
    if (data.start_date && data.end_date && data.end_date < data.start_date) {
      errors.end_date = "End date must be on or after start date.";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateForm(formData)) return;

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        start_date: formData.start_date || undefined,
        end_date: formData.end_date || undefined,
      };

      if (editingId) {
        const { error: apiError } = await updateProject(editingId, payload);
        if (apiError) {
          setError(apiError);
          return;
        }
        announce("Project updated");
      } else {
        const { error: apiError } = await createProject(payload);
        if (apiError) {
          setError(apiError);
          return;
        }
        announce("Project created");
      }
      setFormData(initialFormData);
      setEditingId(null);
      setFormErrors({});
      await loadProjects();
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleEdit(project: Project) {
    setFormData({
      name: project.name,
      description: project.description ?? "",
      status: project.status,
      start_date: project.start_date ?? "",
      end_date: project.end_date ?? "",
    });
    setEditingId(project.id);
    setFormErrors({});
    formCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => firstInputRef.current?.focus(), 300);
  }

  function handleCancel() {
    setFormData(initialFormData);
    setEditingId(null);
    setFormErrors({});
  }

  async function confirmDelete() {
    if (!deleteTarget) return;

    const { error: apiError } = await deleteProject(deleteTarget.id);
    if (apiError) {
      setError(apiError);
      setDeleteTarget(null);
      return;
    }
    announce("Project deleted");
    setDeleteTarget(null);
    await loadProjects();
  }

  function handleAddClick() {
    setEditingId(null);
    setFormData(initialFormData);
    setFormErrors({});
    formCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => firstInputRef.current?.focus(), 300);
  }

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(search.toLowerCase()) ||
      (project.description ?? "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter ? project.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  const sortedProjects = [...filteredProjects].sort((a, b) => {
    const aValue = a[sortKey] ?? "";
    const bValue = b[sortKey] ?? "";
    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const isEmpty = !loading && projects.length === 0;
  const noResults = !loading && projects.length > 0 && filteredProjects.length === 0;

  const projectColumns: ResponsiveTableColumn<Project, ProjectsSortKey>[] = [
    {
      key: "name",
      header: "Name",
      cell: (project) => (
        <button
          type="button"
          onClick={() => handleEdit(project)}
          className="hover:text-indigo-700 dark:hover:text-indigo-400 hover:underline focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:ring-offset-2 rounded px-0.5 text-left"
        >
          {project.name}
        </button>
      ),
      sortKey: "name",
      isRowHeader: true,
    },
    {
      key: "status",
      header: "Status",
      cell: (project) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            statusBadgeClasses[project.status] ?? statusBadgeClasses.cancelled
          }`}
        >
          {project.status}
        </span>
      ),
      sortKey: "status",
    },
    {
      key: "start_date",
      header: "Start Date",
      cell: (project) =>
        project.start_date ? new Date(project.start_date).toLocaleDateString() : "—",
      sortKey: "start_date",
      align: "right",
      className: "tabular-nums",
    },
    {
      key: "end_date",
      header: "End Date",
      cell: (project) =>
        project.end_date ? new Date(project.end_date).toLocaleDateString() : "—",
      sortKey: "end_date",
      align: "right",
      className: "tabular-nums",
    },
    {
      key: "created_at",
      header: "Created",
      cell: (project) => new Date(project.created_at).toLocaleDateString(),
      sortKey: "created_at",
      align: "right",
      className: "tabular-nums",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Projects
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-1">Manage your projects.</p>
        </div>
        <Button onClick={handleAddClick}>
          <FolderPlus className="w-4 h-4" aria-hidden="true" />
          Add Project
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

      <Card className="mb-8" ref={formCardRef}>
        <CardHeader>
          <CardTitle>{editingId ? "Edit Project" : "Add Project"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Project Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                error={formErrors.name}
                required
                ref={firstInputRef}
              />
              <Select
                label="Status"
                options={statusOptions}
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                helperText="Current project status"
                required
              />
            </div>
            <div className="grid grid-cols-1 gap-4">
              <Textarea
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief project description"
                helperText="Brief summary of the project"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Start Date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
              <Input
                label="End Date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                error={formErrors.end_date}
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" isLoading={isSubmitting}>
                {editingId ? "Update Project" : "Add Project"}
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
          <CardTitle>Project List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col sm:flex-row gap-4">
            <Input
              type="search"
              placeholder="Search by name or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search projects"
              className="max-w-md"
            />
            <Select
              aria-label="Filter by status"
              options={statusFilterOptions}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="max-w-xs"
            />
          </div>

          <ResponsiveTable
            columns={projectColumns}
            data={sortedProjects}
            keyExtractor={(project) => project.id}
            actions={(project) => (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(project)}
                  aria-label={`Edit ${project.name}`}
                  className="min-h-11 min-w-11 md:min-h-7 md:min-w-7"
                >
                  <Pencil className="w-4 h-4" aria-hidden="true" />
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={(e) => {
                    deleteTriggerRef.current = e.currentTarget;
                    setDeleteTarget(project);
                  }}
                  aria-label={`Delete ${project.name}`}
                  className="min-h-11 min-w-11 md:min-h-7 md:min-w-7"
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                </Button>
              </>
            )}
            emptyState={
              isEmpty ? (
                <EmptyState
                  title="No projects yet"
                  description="Add your first project using the form above."
                />
              ) : noResults ? (
                <EmptyState
                  title="No projects found"
                  description="Try adjusting your search or filter."
                />
              ) : null
            }
            loadingState={<LoadingState />}
            isLoading={loading}
            sortKey={sortKey}
            sortDirection={sortDirection}
            onSort={handleSort}
          />
        </CardContent>
      </Card>

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title="Delete project?"
        message={
          deleteTarget
            ? `Are you sure you want to delete ${deleteTarget.name}? This action cannot be undone.`
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
