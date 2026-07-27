import { query } from "@/lib/db";
import type { Project, ProjectInput } from "@/lib/types";

export const dynamic = "force-dynamic";

function isProjectInput(body: unknown): body is ProjectInput {
  const b = body as Record<string, unknown>;
  return (
    typeof b === "object" && b !== null && typeof b.name === "string" && b.name.trim().length > 0
  );
}

function validateProject(body: ProjectInput): string | null {
  if (!body.name || body.name.trim().length === 0) {
    return "Project name is required.";
  }
  if (body.start_date && body.end_date && body.end_date < body.start_date) {
    return "End date must be on or after start date.";
  }
  return null;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      const rows = await query<Project>("SELECT * FROM projects WHERE id = $1", [id]);

      if (rows.length === 0) {
        return Response.json({ error: "Project not found." }, { status: 404 });
      }

      return Response.json({ data: rows[0] });
    }

    const rows = await query<Project>("SELECT * FROM projects ORDER BY created_at DESC");
    return Response.json({ data: rows });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as unknown;

    if (!isProjectInput(body)) {
      return Response.json(
        { error: "Invalid request body. 'name' is required." },
        { status: 400 }
      );
    }

    const validationError = validateProject(body);
    if (validationError) {
      return Response.json({ error: validationError }, { status: 400 });
    }

    const rows = await query<Project>(
      `INSERT INTO projects (name, description, status, start_date, end_date)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        body.name.trim(),
        body.description ?? null,
        body.status ?? "active",
        body.start_date ?? null,
        body.end_date ?? null,
      ]
    );

    return Response.json({ data: rows[0] }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as unknown;
    const b = body as Record<string, unknown>;

    if (!b.id || typeof b.id !== "string") {
      return Response.json({ error: "Project id is required." }, { status: 400 });
    }

    const updates: Partial<Project> = {};
    if (typeof b.name === "string") updates.name = b.name.trim();
    if ("description" in b) updates.description = typeof b.description === "string" ? b.description : null;
    if (typeof b.status === "string") updates.status = b.status;
    if (typeof b.start_date === "string" || b.start_date === null) updates.start_date = b.start_date as string | null;
    if (typeof b.end_date === "string" || b.end_date === null) updates.end_date = b.end_date as string | null;

    if (updates.name !== undefined && updates.name.trim().length === 0) {
      return Response.json({ error: "Project name cannot be empty." }, { status: 400 });
    }
    if (
      updates.start_date !== undefined &&
      updates.start_date !== null &&
      updates.end_date !== undefined &&
      updates.end_date !== null
    ) {
      if (updates.end_date < updates.start_date) {
        return Response.json(
          { error: "End date must be on or after start date." },
          { status: 400 }
        );
      }
    }

    const fields: string[] = [];
    const values: unknown[] = [];

    if (updates.name !== undefined) {
      fields.push(`name = $${fields.length + 1}`);
      values.push(updates.name);
    }
    if ("description" in updates) {
      fields.push(`description = $${fields.length + 1}`);
      values.push(updates.description ?? null);
    }
    if (updates.status !== undefined) {
      fields.push(`status = $${fields.length + 1}`);
      values.push(updates.status);
    }
    if (updates.start_date !== undefined) {
      fields.push(`start_date = $${fields.length + 1}`);
      values.push(updates.start_date);
    }
    if (updates.end_date !== undefined) {
      fields.push(`end_date = $${fields.length + 1}`);
      values.push(updates.end_date);
    }

    if (fields.length === 0) {
      const rows = await query<Project>("SELECT * FROM projects WHERE id = $1", [b.id]);
      if (rows.length === 0) {
        return Response.json({ error: "Project not found." }, { status: 404 });
      }
      return Response.json({ data: rows[0] });
    }

    values.push(b.id);

    const rows = await query<Project>(
      `UPDATE projects
       SET ${fields.join(", ")}
       WHERE id = $${fields.length + 1}
       RETURNING *`,
      values
    );

    if (rows.length === 0) {
      return Response.json({ error: "Project not found." }, { status: 404 });
    }

    return Response.json({ data: rows[0] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return Response.json({ error: "Project id is required." }, { status: 400 });
    }

    await query("DELETE FROM projects WHERE id = $1", [id]);

    return Response.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
