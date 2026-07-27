import { query } from "@/lib/db";
import type { Allocation, AllocationInput, AllocationWithDetails } from "@/lib/types";

export const dynamic = "force-dynamic";

const ALLOCATION_DETAIL_SELECT = `
  SELECT
    a.*,
    to_jsonb(m.*) AS member,
    to_jsonb(p.*) AS project
  FROM allocations a
  LEFT JOIN members m ON m.id = a.member_id
  LEFT JOIN projects p ON p.id = a.project_id
`;

function isAllocationInput(body: unknown): body is AllocationInput {
  const b = body as Record<string, unknown>;
  return (
    typeof b === "object" &&
    b !== null &&
    typeof b.member_id === "string" &&
    b.member_id.trim().length > 0 &&
    typeof b.project_id === "string" &&
    b.project_id.trim().length > 0 &&
    typeof b.allocation_percentage === "number"
  );
}

function validateAllocation(body: AllocationInput): string | null {
  if (!body.member_id) {
    return "Member is required.";
  }
  if (!body.project_id) {
    return "Project is required.";
  }
  if (
    typeof body.allocation_percentage !== "number" ||
    Number.isNaN(body.allocation_percentage) ||
    body.allocation_percentage < 0 ||
    body.allocation_percentage > 100
  ) {
    return "Allocation percentage must be between 0 and 100.";
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
      const rows = await query<AllocationWithDetails>(
        `${ALLOCATION_DETAIL_SELECT} WHERE a.id = $1`,
        [id]
      );

      if (rows.length === 0) {
        return Response.json({ error: "Allocation not found." }, { status: 404 });
      }

      return Response.json({ data: rows[0] });
    }

    const rows = await query<AllocationWithDetails>(
      `${ALLOCATION_DETAIL_SELECT} ORDER BY a.created_at DESC`
    );
    return Response.json({ data: rows });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as unknown;

    if (!isAllocationInput(body)) {
      return Response.json(
        {
          error:
            "Invalid request body. 'member_id', 'project_id', and 'allocation_percentage' are required.",
        },
        { status: 400 }
      );
    }

    const validationError = validateAllocation(body);
    if (validationError) {
      return Response.json({ error: validationError }, { status: 400 });
    }

    const insertRows = await query<{ id: string }>(
      `INSERT INTO allocations (member_id, project_id, allocation_percentage, start_date, end_date)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [
        body.member_id,
        body.project_id,
        Math.round(body.allocation_percentage),
        body.start_date ?? null,
        body.end_date ?? null,
      ]
    );

    if (insertRows.length === 0) {
      return Response.json({ error: "Failed to create allocation." }, { status: 500 });
    }

    const detailRows = await query<AllocationWithDetails>(
      `${ALLOCATION_DETAIL_SELECT} WHERE a.id = $1`,
      [insertRows[0].id]
    );

    return Response.json({ data: detailRows[0] }, { status: 201 });
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
      return Response.json({ error: "Allocation id is required." }, { status: 400 });
    }

    const updates: Partial<Allocation> = {};
    if (typeof b.member_id === "string") updates.member_id = b.member_id;
    if (typeof b.project_id === "string") updates.project_id = b.project_id;
    if (typeof b.allocation_percentage === "number") {
      updates.allocation_percentage = Math.round(b.allocation_percentage);
    }
    if (typeof b.start_date === "string" || b.start_date === null) updates.start_date = b.start_date as string | null;
    if (typeof b.end_date === "string" || b.end_date === null) updates.end_date = b.end_date as string | null;

    if (updates.member_id !== undefined && !updates.member_id) {
      return Response.json({ error: "Member is required." }, { status: 400 });
    }
    if (updates.project_id !== undefined && !updates.project_id) {
      return Response.json({ error: "Project is required." }, { status: 400 });
    }
    if (updates.allocation_percentage !== undefined) {
      if (
        typeof updates.allocation_percentage !== "number" ||
        Number.isNaN(updates.allocation_percentage) ||
        updates.allocation_percentage < 0 ||
        updates.allocation_percentage > 100
      ) {
        return Response.json(
          { error: "Allocation percentage must be between 0 and 100." },
          { status: 400 }
        );
      }
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

    if (updates.member_id !== undefined) {
      fields.push(`member_id = $${fields.length + 1}`);
      values.push(updates.member_id);
    }
    if (updates.project_id !== undefined) {
      fields.push(`project_id = $${fields.length + 1}`);
      values.push(updates.project_id);
    }
    if (updates.allocation_percentage !== undefined) {
      fields.push(`allocation_percentage = $${fields.length + 1}`);
      values.push(updates.allocation_percentage);
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
      const rows = await query<AllocationWithDetails>(
        `${ALLOCATION_DETAIL_SELECT} WHERE a.id = $1`,
        [b.id]
      );
      if (rows.length === 0) {
        return Response.json({ error: "Allocation not found." }, { status: 404 });
      }
      return Response.json({ data: rows[0] });
    }

    values.push(b.id);

    const updateRows = await query<{ id: string }>(
      `UPDATE allocations
       SET ${fields.join(", ")}
       WHERE id = $${fields.length + 1}
       RETURNING id`,
      values
    );

    if (updateRows.length === 0) {
      return Response.json({ error: "Allocation not found." }, { status: 404 });
    }

    const detailRows = await query<AllocationWithDetails>(
      `${ALLOCATION_DETAIL_SELECT} WHERE a.id = $1`,
      [updateRows[0].id]
    );

    return Response.json({ data: detailRows[0] });
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
      return Response.json({ error: "Allocation id is required." }, { status: 400 });
    }

    await query("DELETE FROM allocations WHERE id = $1", [id]);

    return Response.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
