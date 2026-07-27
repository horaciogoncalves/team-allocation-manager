import type {
  Member,
  Project,
  AllocationWithDetails,
  MemberFormData,
  ProjectFormData,
  AllocationFormData,
} from "@/lib/types";

async function fetchJson<T>(url: string, options?: RequestInit): Promise<{ data?: T; error?: string }> {
  try {
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
      },
      ...options,
    });

    const json = (await response.json()) as { data?: T; error?: string };

    if (!response.ok) {
      return { error: json.error ?? `Request failed with status ${response.status}` };
    }

    return json;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Network error";
    return { error: message };
  }
}

// Members
export async function getMembers(): Promise<{ data?: Member[]; error?: string }> {
  return fetchJson<Member[]>("/api/members");
}

export async function getMember(id: string): Promise<{ data?: Member; error?: string }> {
  return fetchJson<Member>(`/api/members?id=${encodeURIComponent(id)}`);
}

export async function createMember(member: MemberFormData): Promise<{ data?: Member; error?: string }> {
  return fetchJson<Member>("/api/members", {
    method: "POST",
    body: JSON.stringify(member),
  });
}

export async function updateMember(
  id: string,
  member: Partial<MemberFormData>
): Promise<{ data?: Member; error?: string }> {
  return fetchJson<Member>("/api/members", {
    method: "PUT",
    body: JSON.stringify({ id, ...member }),
  });
}

export async function deleteMember(id: string): Promise<{ error?: string }> {
  return fetchJson(`/api/members?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

// Projects
export async function getProjects(): Promise<{ data?: Project[]; error?: string }> {
  return fetchJson<Project[]>("/api/projects");
}

export async function getProject(id: string): Promise<{ data?: Project; error?: string }> {
  return fetchJson<Project>(`/api/projects?id=${encodeURIComponent(id)}`);
}

export async function createProject(project: ProjectFormData): Promise<{ data?: Project; error?: string }> {
  return fetchJson<Project>("/api/projects", {
    method: "POST",
    body: JSON.stringify(project),
  });
}

export async function updateProject(
  id: string,
  project: Partial<ProjectFormData>
): Promise<{ data?: Project; error?: string }> {
  return fetchJson<Project>("/api/projects", {
    method: "PUT",
    body: JSON.stringify({ id, ...project }),
  });
}

export async function deleteProject(id: string): Promise<{ error?: string }> {
  return fetchJson(`/api/projects?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

// Allocations
export async function getAllocations(): Promise<{ data?: AllocationWithDetails[]; error?: string }> {
  return fetchJson<AllocationWithDetails[]>("/api/allocations");
}

export async function getAllocation(id: string): Promise<{ data?: AllocationWithDetails; error?: string }> {
  return fetchJson<AllocationWithDetails>(`/api/allocations?id=${encodeURIComponent(id)}`);
}

export async function createAllocation(
  allocation: AllocationFormData
): Promise<{ data?: AllocationWithDetails; error?: string }> {
  return fetchJson<AllocationWithDetails>("/api/allocations", {
    method: "POST",
    body: JSON.stringify(allocation),
  });
}

export async function updateAllocation(
  id: string,
  allocation: Partial<AllocationFormData>
): Promise<{ data?: AllocationWithDetails; error?: string }> {
  return fetchJson<AllocationWithDetails>("/api/allocations", {
    method: "PUT",
    body: JSON.stringify({ id, ...allocation }),
  });
}

export async function deleteAllocation(id: string): Promise<{ error?: string }> {
  return fetchJson(`/api/allocations?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
