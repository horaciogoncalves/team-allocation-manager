export interface Member {
  id: string;
  name: string;
  email: string;
  role: string | null;
  std_cst: number | null;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Allocation {
  id: string;
  member_id: string;
  project_id: string;
  allocation_percentage: number;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface AllocationWithDetails extends Allocation {
  member: Pick<Member, "id" | "name" | "email"> | null;
  project: Pick<Project, "id" | "name"> | null;
}

export interface DashboardSummary {
  totalMembers: number;
  totalProjects: number;
  recentAllocations: AllocationWithDetails[];
  membersPerProject: {
    project: Project;
    memberCount: number;
    totalAllocation: number;
  }[];
}

export type MemberInput = Omit<Member, "id" | "created_at" | "updated_at">;
export type ProjectInput = Omit<Project, "id" | "created_at" | "updated_at">;
export type AllocationInput = Omit<Allocation, "id" | "created_at" | "updated_at">;

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export type MemberFormData = {
  name: string;
  email: string;
  role: string;
  std_cst: string;
};

export type ProjectFormData = {
  name: string;
  description: string;
  status: string;
  start_date?: string;
  end_date?: string;
};

export type AllocationFormData = {
  member_id: string;
  project_id: string;
  allocation_percentage: number;
  start_date?: string;
  end_date?: string;
};
