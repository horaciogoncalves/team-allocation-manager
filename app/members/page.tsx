"use client";

import { useEffect, useRef, useState } from "react";
import { Pencil, Trash2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/ui/loading";
import { ResponsiveTable } from "@/components/ui/responsive-table";
import type { ResponsiveTableColumn } from "@/components/ui/responsive-table";
import { useFeedback } from "@/components/ui/feedback";
import { createMember, deleteMember, getMembers, updateMember } from "@/lib/api";
import type { Member, MemberFormData } from "@/lib/types";

const initialFormData: MemberFormData = {
  name: "",
  email: "",
  role: "",
  std_cst: "",
  billing_rate: "",
};

type MembersSortKey = "name" | "email" | "role" | "std_cst" | "billing_rate" | "margin" | "created_at";

function formatCurrency(value: number | null): string {
  if (value === null) return "—";
  return `€ ${value.toFixed(2).replace(".", ",")}`;
}

function formatMargin(stdCst: string, billingRate: string): string {
  const cost = stdCst.trim().replace(",", ".");
  const rate = billingRate.trim().replace(",", ".");
  if (!cost || !rate) return "N/A";
  const costNum = Number(cost);
  const rateNum = Number(rate);
  if (Number.isNaN(costNum) || Number.isNaN(rateNum) || rateNum === 0) return "N/A";
  const margin = ((rateNum - costNum) / rateNum) * 100;
  return `${margin.toFixed(2).replace(".", ",")}%`;
}

function formatMarginValue(margin: number | null): string {
  if (margin === null) return "N/A";
  return `${margin.toFixed(2).replace(".", ",")}%`;
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<MemberFormData>(initialFormData);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof MemberFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<MembersSortKey>("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [deleteTarget, setDeleteTarget] = useState<Member | null>(null);
  const deleteTriggerRef = useRef<HTMLElement | null>(null);
  const formCardRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);
  const { announce } = useFeedback();

  function openDeleteDialog(member: Member, trigger: HTMLElement) {
    deleteTriggerRef.current = trigger;
    setDeleteTarget(member);
  }

  async function loadMembers() {
    try {
      setLoading(true);
      setError(null);
      const { data, error: apiError } = await getMembers();
      if (apiError) {
        setError(apiError);
        return;
      }
      setMembers(data ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMembers();
  }, []);

  function handleSort(key: MembersSortKey) {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  }

  function validateForm(data: MemberFormData): boolean {
    const errors: Partial<Record<keyof MemberFormData, string>> = {};
    if (!data.name.trim()) {
      errors.name = "Name is required.";
    }
    if (!data.email.trim()) {
      errors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.email = "Please enter a valid email address.";
    }
    if (data.std_cst.trim()) {
      const normalized = data.std_cst.replace(",", ".");
      const parsed = Number(normalized);
      if (Number.isNaN(parsed) || parsed < 0) {
        errors.std_cst = "Please enter a valid non-negative cost.";
      } else if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
        errors.std_cst = "Use up to 2 decimal places.";
      }
    }
    if (data.billing_rate.trim()) {
      const normalized = data.billing_rate.replace(",", ".");
      const parsed = Number(normalized);
      if (Number.isNaN(parsed) || parsed < 0) {
        errors.billing_rate = "Please enter a valid non-negative rate.";
      } else if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
        errors.billing_rate = "Use up to 2 decimal places.";
      }
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateForm(formData)) return;

    setIsSubmitting(true);
    try {
      if (editingId) {
        const { error: apiError } = await updateMember(editingId, formData);
        if (apiError) {
          setError(apiError);
          return;
        }
        announce("Member updated");
      } else {
        const { error: apiError } = await createMember(formData);
        if (apiError) {
          setError(apiError);
          return;
        }
        announce("Member created");
      }
      setFormData(initialFormData);
      setEditingId(null);
      setFormErrors({});
      await loadMembers();
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleEdit(member: Member) {
    setFormData({
      name: member.name,
      email: member.email,
      role: member.role ?? "",
      std_cst: member.std_cst !== null ? member.std_cst.toFixed(2) : "",
      billing_rate: member.billing_rate !== null ? member.billing_rate.toFixed(2) : "",
    });
    setEditingId(member.id);
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

    const { error: apiError } = await deleteMember(deleteTarget.id);
    if (apiError) {
      setError(apiError);
      setDeleteTarget(null);
      return;
    }
    announce("Member deleted");
    setDeleteTarget(null);
    await loadMembers();
  }

  function handleAddClick() {
    setEditingId(null);
    setFormData(initialFormData);
    setFormErrors({});
    formCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => firstInputRef.current?.focus(), 300);
  }

  const filteredMembers = members.filter(
    (member) =>
      member.name.toLowerCase().includes(search.toLowerCase()) ||
      member.email.toLowerCase().includes(search.toLowerCase())
  );

  const sortedMembers = [...filteredMembers].sort((a, b) => {
    const aValue = a[sortKey] ?? "";
    const bValue = b[sortKey] ?? "";
    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const isEmpty = !loading && members.length === 0;
  const noResults = !loading && members.length > 0 && filteredMembers.length === 0;

  const memberColumns: ResponsiveTableColumn<Member, MembersSortKey>[] = [
    {
      key: "name",
      header: "Name",
      cell: (member) => (
        <button
          type="button"
          onClick={() => handleEdit(member)}
          className="hover:text-indigo-700 dark:hover:text-indigo-400 hover:underline focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:ring-offset-2 rounded px-0.5 text-left"
        >
          {member.name}
        </button>
      ),
      sortKey: "name",
      isRowHeader: true,
    },
    {
      key: "email",
      header: "Email",
      cell: (member) => member.email,
      sortKey: "email",
    },
    {
      key: "role",
      header: "Role",
      cell: (member) => member.role || "—",
      sortKey: "role",
    },
    {
      key: "std_cst",
      header: "Hourly Cost",
      cell: (member) => formatCurrency(member.std_cst),
      sortKey: "std_cst",
      align: "right",
      className: "tabular-nums",
    },
    {
      key: "billing_rate",
      header: "Billing Rate",
      cell: (member) => formatCurrency(member.billing_rate),
      sortKey: "billing_rate",
      align: "right",
      className: "tabular-nums",
    },
    {
      key: "margin",
      header: "Margin",
      cell: (member) => formatMarginValue(member.margin),
      sortKey: "margin",
      align: "right",
      className: "tabular-nums",
    },
    {
      key: "created_at",
      header: "Created",
      cell: (member) => new Date(member.created_at).toLocaleDateString(),
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
            Members
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-1">Manage your team members.</p>
        </div>
        <Button onClick={handleAddClick}>
          <UserPlus className="w-4 h-4" aria-hidden="true" />
          Add Member
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
          <CardTitle>{editingId ? "Edit Member" : "Add Member"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Input
                label="Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                error={formErrors.name}
                required
                ref={firstInputRef}
              />
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                error={formErrors.email}
                required
              />
              <Input
                label="Role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                placeholder="e.g. Frontend Developer"
                helperText="e.g. Frontend Developer, Project Manager"
              />
              <Input
                label="Hourly Cost (€)"
                type="text"
                inputMode="decimal"
                value={formData.std_cst}
                onChange={(e) => setFormData({ ...formData, std_cst: e.target.value })}
                error={formErrors.std_cst}
                placeholder="0.00"
                helperText="EUR, up to 2 decimal places"
              />
              <Input
                label="Billing Rate (€)"
                type="text"
                inputMode="decimal"
                value={formData.billing_rate}
                onChange={(e) => setFormData({ ...formData, billing_rate: e.target.value })}
                error={formErrors.billing_rate}
                placeholder="0.00"
                helperText="EUR, up to 2 decimal places"
              />
              <Input
                label="Margin"
                type="text"
                value={formatMargin(formData.std_cst, formData.billing_rate)}
                readOnly
                helperText="Calculated from cost and billing rate"
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" isLoading={isSubmitting}>
                {editingId ? "Update Member" : "Add Member"}
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
          <CardTitle>Member List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              type="search"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search members"
              className="max-w-md"
            />
          </div>

          <ResponsiveTable
            columns={memberColumns}
            data={sortedMembers}
            keyExtractor={(member) => member.id}
            actions={(member) => (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(member)}
                  aria-label={`Edit ${member.name}`}
                  className="min-h-11 min-w-11 md:min-h-7 md:min-w-7"
                >
                  <Pencil className="w-4 h-4" aria-hidden="true" />
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={(e) => openDeleteDialog(member, e.currentTarget)}
                  aria-label={`Delete ${member.name}`}
                  className="min-h-11 min-w-11 md:min-h-7 md:min-w-7"
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                </Button>
              </>
            )}
            emptyState={
              isEmpty ? (
                <EmptyState
                  title="No members yet"
                  description="Add your first team member using the form above."
                />
              ) : noResults ? (
                <EmptyState
                  title="No members found"
                  description={`No members match "${search}". Try a different search term.`}
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
        title="Delete member?"
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
