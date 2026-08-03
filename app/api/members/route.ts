import { query } from "@/lib/db";
import type { Member, MemberInput } from "@/lib/types";

export const dynamic = "force-dynamic";

function isMemberInput(body: unknown): body is MemberInput {
  const b = body as Record<string, unknown>;
  const stdCstType = typeof b.std_cst;
  return (
    typeof b === "object" &&
    b !== null &&
    typeof b.name === "string" &&
    b.name.trim().length > 0 &&
    typeof b.email === "string" &&
    b.email.trim().length > 0 &&
    ("std_cst" in b
      ? stdCstType === "string" || stdCstType === "number" || b.std_cst === null
      : true)
  );
}

function parseStdCst(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = typeof value === "string" ? Number(value.replace(",", ".")) : value;
  if (Number.isNaN(parsed) || parsed < 0) return null;
  return Number(parsed.toFixed(2));
}

function validateMember(body: MemberInput): string | null {
  if (!body.name || body.name.trim().length === 0) {
    return "Name is required.";
  }
  if (!body.email || body.email.trim().length === 0) {
    return "Email is required.";
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(body.email)) {
    return "Please provide a valid email address.";
  }
  if (body.std_cst !== null && body.std_cst !== undefined && body.std_cst < 0) {
    return "Hourly cost cannot be negative.";
  }
  return null;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      const rows = await query<Member>("SELECT * FROM members WHERE id = $1", [id]);

      if (rows.length === 0) {
        return Response.json({ error: "Member not found." }, { status: 404 });
      }

      return Response.json({ data: rows[0] });
    }

    const rows = await query<Member>("SELECT * FROM members ORDER BY created_at DESC");
    return Response.json({ data: rows });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("GET /api/members error:", error);
    if (error instanceof Error && error.cause) {
      console.error("Error cause:", error.cause);
    }
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as unknown;

    if (!isMemberInput(body)) {
      return Response.json(
        { error: "Invalid request body. 'name' and 'email' are required." },
        { status: 400 }
      );
    }

    const stdCst = parseStdCst(body.std_cst);
    const validationError = validateMember({ ...body, std_cst: stdCst });
    if (validationError) {
      return Response.json({ error: validationError }, { status: 400 });
    }

    const rows = await query<Member>(
      `INSERT INTO members (name, email, role, std_cst)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [body.name.trim(), body.email.trim().toLowerCase(), body.role ?? null, stdCst]
    );

    return Response.json({ data: rows[0] }, { status: 201 });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23505"
    ) {
      return Response.json(
        { error: "A member with this email already exists." },
        { status: 409 }
      );
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as unknown;
    const b = body as Record<string, unknown>;

    if (!b.id || typeof b.id !== "string") {
      return Response.json({ error: "Member id is required." }, { status: 400 });
    }

    const stdCst = parseStdCst(b.std_cst);
    if (stdCst === null && b.std_cst !== undefined && b.std_cst !== null && b.std_cst !== "") {
      return Response.json({ error: "Hourly cost must be a non-negative number." }, { status: 400 });
    }

    const updates: Partial<Member> = {};
    if (typeof b.name === "string") updates.name = b.name.trim();
    if (typeof b.email === "string") updates.email = b.email.trim().toLowerCase();
    if ("role" in b) updates.role = typeof b.role === "string" ? b.role : null;
    if ("std_cst" in b) updates.std_cst = stdCst;

    if (updates.name !== undefined && updates.name.trim().length === 0) {
      return Response.json({ error: "Name cannot be empty." }, { status: 400 });
    }
    if (updates.email !== undefined) {
      if (updates.email.trim().length === 0) {
        return Response.json({ error: "Email cannot be empty." }, { status: 400 });
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updates.email)) {
        return Response.json(
          { error: "Please provide a valid email address." },
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
    if (updates.email !== undefined) {
      fields.push(`email = $${fields.length + 1}`);
      values.push(updates.email);
    }
    if ("role" in updates) {
      fields.push(`role = $${fields.length + 1}`);
      values.push(updates.role ?? null);
    }
    if ("std_cst" in updates) {
      fields.push(`std_cst = $${fields.length + 1}`);
      values.push(updates.std_cst ?? null);
    }

    if (fields.length === 0) {
      const rows = await query<Member>("SELECT * FROM members WHERE id = $1", [b.id]);
      if (rows.length === 0) {
        return Response.json({ error: "Member not found." }, { status: 404 });
      }
      return Response.json({ data: rows[0] });
    }

    values.push(b.id);

    const rows = await query<Member>(
      `UPDATE members
       SET ${fields.join(", ")}
       WHERE id = $${fields.length + 1}
       RETURNING *`,
      values
    );

    if (rows.length === 0) {
      return Response.json({ error: "Member not found." }, { status: 404 });
    }

    return Response.json({ data: rows[0] });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23505"
    ) {
      return Response.json(
        { error: "A member with this email already exists." },
        { status: 409 }
      );
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return Response.json({ error: "Member id is required." }, { status: 400 });
    }

    await query("DELETE FROM members WHERE id = $1", [id]);

    return Response.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
