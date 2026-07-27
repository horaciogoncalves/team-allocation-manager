import Link from "next/link";
import { Users, FolderKanban, GitPullRequest, AlertTriangle, CheckCircle2 } from "lucide-react";
import { BarChart } from "@/components/ui/bar-chart";
import { DonutChart } from "@/components/ui/donut-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { query } from "@/lib/db";
import type { Allocation, AllocationWithDetails, Member, Project } from "@/lib/types";

export const dynamic = "force-dynamic";

function computeMembersPerProject(projects: Project[], allocations: AllocationWithDetails[]) {
  return projects.map((project) => {
    const projectAllocations = allocations.filter(
      (allocation) => allocation.project_id === project.id
    );
    const uniqueMemberIds = new Set(projectAllocations.map((allocation) => allocation.member_id));
    const totalAllocation = projectAllocations.reduce(
      (sum, allocation) => sum + allocation.allocation_percentage,
      0
    );

    return {
      project,
      memberCount: uniqueMemberIds.size,
      totalAllocation,
      isOverallocated: totalAllocation > 100,
    };
  });
}

function computeOverallocatedMembers(members: Member[], allocations: AllocationWithDetails[]) {
  const totals = new Map<string, number>();
  allocations.forEach((allocation) => {
    totals.set(
      allocation.member_id,
      (totals.get(allocation.member_id) ?? 0) + allocation.allocation_percentage
    );
  });

  return members
    .filter((member) => (totals.get(member.id) ?? 0) > 100)
    .map((member) => ({
      member,
      totalAllocation: totals.get(member.id) ?? 0,
    }));
}

interface OverallocationSummary {
  count: number;
  memberNames: string[];
  projectNames: string[];
}

function computeOverallocationSummary(
  members: Member[],
  projects: Project[],
  allocations: AllocationWithDetails[]
): OverallocationSummary {
  const memberTotals = new Map<string, number>();
  const projectTotals = new Map<string, number>();

  allocations.forEach((allocation) => {
    memberTotals.set(
      allocation.member_id,
      (memberTotals.get(allocation.member_id) ?? 0) + allocation.allocation_percentage
    );
    projectTotals.set(
      allocation.project_id,
      (projectTotals.get(allocation.project_id) ?? 0) + allocation.allocation_percentage
    );
  });

  const memberNames = members
    .filter((member) => (memberTotals.get(member.id) ?? 0) > 100)
    .map((member) => member.name);
  const projectNames = projects
    .filter((project) => (projectTotals.get(project.id) ?? 0) > 100)
    .map((project) => project.name);

  return {
    count: memberNames.length + projectNames.length,
    memberNames,
    projectNames,
  };
}

interface AllocationRow extends Allocation {
  member_name: string | null;
  member_email: string | null;
  project_name: string | null;
}

const STATUS_ORDER = ["active", "completed", "on hold", "not started"] as const;

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-500",
  completed: "bg-blue-500",
  "on hold": "bg-amber-500",
  "not started": "bg-zinc-400",
};

const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  completed: "Completed",
  "on hold": "On hold",
  "not started": "Not started",
};

function computeProjectStatusBreakdown(projects: Project[]) {
  const counts = new Map<string, number>();
  projects.forEach((project) => {
    const status = project.status || "not started";
    counts.set(status, (counts.get(status) ?? 0) + 1);
  });

  return STATUS_ORDER.filter((status) => (counts.get(status) ?? 0) > 0 || projects.length === 0).map(
    (status) => ({
      id: status,
      label: STATUS_LABELS[status] ?? status,
      value: counts.get(status) ?? 0,
      colorClass: STATUS_COLORS[status] ?? "bg-zinc-400",
    })
  );
}

function computeMemberWorkload(members: Member[], allocations: AllocationWithDetails[]) {
  const totals = new Map<string, number>();
  allocations.forEach((allocation) => {
    totals.set(
      allocation.member_id,
      (totals.get(allocation.member_id) ?? 0) + allocation.allocation_percentage
    );
  });

  return members
    .map((member) => ({
      id: member.id,
      label: member.name,
      value: totals.get(member.id) ?? 0,
    }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 10)
    .map((item) => ({
      ...item,
      max: Math.max(100, item.value),
      warning: item.value > 100,
      danger: item.value > 100,
      suffix: "%",
      ariaLabel: `${item.label}: ${item.value}% total allocation${
        item.value > 100 ? " (overallocated)" : ""
      }`,
    }));
}

export default async function DashboardPage() {
  const [members, projects, allocations] = await Promise.all([
    query<Member>("SELECT * FROM members ORDER BY created_at DESC"),
    query<Project>("SELECT * FROM projects ORDER BY created_at DESC"),
    query<AllocationRow>(`
      SELECT
        a.*,
        m.name AS member_name,
        m.email AS member_email,
        p.name AS project_name
      FROM allocations a
      LEFT JOIN members m ON m.id = a.member_id
      LEFT JOIN projects p ON p.id = a.project_id
      ORDER BY a.created_at DESC
    `),
  ]);

  const allocationsWithDetails: AllocationWithDetails[] = allocations.map((a) => ({
    ...a,
    member: a.member_name
      ? { id: a.member_id, name: a.member_name, email: a.member_email ?? "" }
      : null,
    project: a.project_name ? { id: a.project_id, name: a.project_name } : null,
  }));

  const recentAllocations = allocationsWithDetails.slice(0, 10);
  const membersPerProject = computeMembersPerProject(projects, allocationsWithDetails);
  const overallocatedMembers = computeOverallocatedMembers(members, allocationsWithDetails);
  const overallocationSummary = computeOverallocationSummary(members, projects, allocationsWithDetails);
  const hasOverallocations = overallocationSummary.count > 0;
  const projectStatusBreakdown = computeProjectStatusBreakdown(projects);
  const memberWorkload = computeMemberWorkload(members, allocationsWithDetails);
  const hasMoreMembers = members.filter((m) => {
    const total = allocationsWithDetails
      .filter((a) => a.member_id === m.id)
      .reduce((sum, a) => sum + a.allocation_percentage, 0);
    return total > 0;
  }).length > 10;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Dashboard
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 mt-1">
          Overview of your team, projects, and allocations.
        </p>
      </div>

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
                {overallocationSummary.memberNames.length > 0 && (
                  <>
                    Member{overallocationSummary.memberNames.length === 1 ? "" : "s"}{" "}
                    <strong>
                      {overallocationSummary.memberNames.join(", ")}
                    </strong>{" "}
                    {overallocationSummary.memberNames.length === 1 ? "is" : "are"} allocated more than 100% in total.
                  </>
                )}
                {overallocationSummary.memberNames.length > 0 &&
                  overallocationSummary.projectNames.length > 0 && <span className="block mt-1" />}
                {overallocationSummary.projectNames.length > 0 && (
                  <>
                    Project{overallocationSummary.projectNames.length === 1 ? "" : "s"}{" "}
                    <strong>
                      {overallocationSummary.projectNames.join(", ")}
                    </strong>{" "}
                    {overallocationSummary.projectNames.length === 1 ? "has" : "have"} more than 100% total allocation.
                  </>
                )}
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Link href="/members" className="block group">
          <Card className="h-full rounded-2xl transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                <Users className="w-4 h-4" aria-hidden="true" />
                Total Members
              </div>
              <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mt-2 tabular-nums">
                {members.length}
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/projects" className="block group">
          <Card className="h-full rounded-2xl transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                <FolderKanban className="w-4 h-4" aria-hidden="true" />
                Total Projects
              </div>
              <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mt-2 tabular-nums">
                {projects.length}
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/allocations" className="block group">
          <Card className="h-full rounded-2xl transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                <GitPullRequest className="w-4 h-4" aria-hidden="true" />
                Total Allocations
              </div>
              <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mt-2 tabular-nums">
                {allocations.length}
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/allocations" className="block group">
          <Card className="h-full rounded-2xl transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  <AlertTriangle className="w-4 h-4" aria-hidden="true" />
                  Overallocations
                </div>
                {hasOverallocations ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300">
                    {overallocationSummary.count}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-300">
                    <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                    All clear
                  </span>
                )}
              </div>
              <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mt-2 tabular-nums">
                {overallocationSummary.count}
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Allocations</CardTitle>
          </CardHeader>
          <CardContent>
            {recentAllocations.length === 0 ? (
              <EmptyState
                title="No allocations yet"
                description="Assign a member to a project to see recent allocations here."
                action={
                  <Link
                    href="/allocations"
                    className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:ring-offset-2"
                  >
                    Add allocation
                  </Link>
                }
              />
            ) : (
              <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {recentAllocations.map((allocation) => (
                  <li key={allocation.id}>
                    <Link
                      href="/allocations"
                      className="block py-3 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/60 focus:outline-none focus:bg-zinc-50 dark:focus:bg-zinc-800/60 focus:ring-2 focus:ring-inset focus:ring-indigo-500/50"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                            {allocation.member?.name ?? "Unknown member"}
                          </p>
                          <p className="text-sm text-zinc-500 dark:text-zinc-400">
                            {allocation.project?.name ?? "Unknown project"}
                          </p>
                        </div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300 tabular-nums">
                          {allocation.allocation_percentage}%
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Members per Project</CardTitle>
          </CardHeader>
          <CardContent>
            {membersPerProject.length === 0 ? (
              <EmptyState
                title="No projects yet"
                description="Create a project to start tracking member allocations."
                action={
                  <Link
                    href="/projects"
                    className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:ring-offset-2"
                  >
                    Create a project
                  </Link>
                }
              />
            ) : (
              <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {membersPerProject.map(({ project, memberCount, totalAllocation, isOverallocated }) => (
                  <li key={project.id}>
                    <Link
                      href="/projects"
                      className="block py-3 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/60 focus:outline-none focus:bg-zinc-50 dark:focus:bg-zinc-800/60 focus:ring-2 focus:ring-inset focus:ring-indigo-500/50"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                            {project.name}
                          </p>
                          <p className="text-sm text-zinc-500 dark:text-zinc-400">
                            {memberCount} member{memberCount === 1 ? "" : "s"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {isOverallocated && (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300"
                              aria-label="Project is overallocated"
                              title="Project total allocation exceeds 100%"
                            >
                              <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
                              Overallocated
                            </span>
                          )}
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300 tabular-nums">
                            {totalAllocation}% allocated
                          </span>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {overallocatedMembers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Overallocated Members</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {overallocatedMembers.map(({ member, totalAllocation }) => (
                  <li key={member.id}>
                    <Link
                      href="/members"
                      className="block py-3 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/60 focus:outline-none focus:bg-zinc-50 dark:focus:bg-zinc-800/60 focus:ring-2 focus:ring-inset focus:ring-indigo-500/50"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                            {member.name}
                          </p>
                          <p className="text-sm text-zinc-500 dark:text-zinc-400">{member.email}</p>
                        </div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300 tabular-nums">
                          {totalAllocation}% allocated
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Project Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {projects.length === 0 ? (
              <EmptyState
                title="No projects yet"
                description="Create a project to see the status breakdown."
                action={
                  <Link
                    href="/projects"
                    className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:ring-offset-2"
                  >
                    Create a project
                  </Link>
                }
              />
            ) : (
              <DonutChart items={projectStatusBreakdown} totalLabel="Projects" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Member Workload Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {memberWorkload.length === 0 ? (
              <EmptyState
                title="No workload data"
                description="Assign members to projects to see workload distribution."
                action={
                  <Link
                    href="/allocations"
                    className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:ring-offset-2"
                  >
                    Add allocation
                  </Link>
                }
              />
            ) : (
              <>
                <BarChart
                  items={memberWorkload}
                  unitLabel="allocation percentage"
                />
                {hasMoreMembers && (
                  <p className="mt-4 text-xs text-zinc-500 dark:text-zinc-400">
                    Showing top 10 members by allocation. View all allocations for the complete list.
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
