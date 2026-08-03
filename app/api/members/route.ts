import { query } from "@/lib/db";
import type { Member, MemberInput } from "@/lib/types";

export const dynamic = "force-dynamic";

function isMemberInput(body: unknown): body is MemberInput {
  const b = body as Record<string, unknown>;
  const stdCstType = typeof b.std_cst;
  const billingRateType = typeof b.billing_rate;
  return (
    typeof b === "object" &&
    b !== null &&
    typeof b.name === "string" &&
    b.name.trim().length > 0 &&
    typeof b.email === "string" &&
    b.email.trim().length > 0 &&
    ("std_cst" in b
      ? stdCstType === "string" || stdCstType === "number" || b.std_cst === null
      : true) &&
    ("billing_rate" in b
      ? billingRateType === "string" || billingRateType === "number" || b.billing_rate === null
      : true)
  );
}

function parseMoney(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = typeof value === "string" ? Number(value.replace(",", ".")) : value;
  if (Number.isNaN(parsed) || parsed < 0) return null;
  return Number(parsed.toFixed(2));
}

function computeMargin(stdCst: number | null, billingRate: number | null): number | null {
  if (stdCst === null || billingRate === null || billingRate === 0) return null;
  const margin = ((billingRate - stdCst) / billingRate) * 100;
  return Number(margin.toFixed(2));
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
  if (body.billing_rate !== null && body.billing_rate !== undefined && body.billing_rate < 0) {
    return "Billing rate cannot be negative.";
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

    const stdCst = parseMoney(body.std_cst);
    const billingRate = parseMoney(body.billing_rate);
    const margin = computeMargin(stdCst, billingRate);
    const validationError = validateMember({
      ...body,
      std_cst: stdCst,
      billing_rate: billingRate,
      margin,
    });
    if (validationError) {
      return Response.json({ error: validationError }, { status: 400 });
    }

    const rows = await query<Member>(
      `INSERT INTO members (name, email, role, std_cst, billing_rate, margin)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        body.name.trim(),
        body.email.trim().toLowerCase(),
        body.role ?? null,
        stdCst,
        billingRate,
        margin,
      ]
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

    const stdCstRaw =
      typeof b.std_cst === "string" || typeof b.std_cst === "number" || b.std_cst === null
        ? b.std_cst
        : undefined;
    const stdCst = parseMoney(stdCstRaw);
    if (
      stdCst === null &&
      stdCstRaw !== undefined &&
      stdCstRaw !== null &&
      stdCstRaw !== ""
    ) {
      return Response.json({ error: "Hourly cost must be a non-negative number." }, { status: 400 });
    }

    const billingRateRaw =
      typeof b.billing_rate === "string" ||
      typeof b.billing_rate === "number" ||
      b.billing_rate === null
        ? b.billing_rate
        : undefined;
    const billingRate = parseMoney(billingRateRaw);
    if (
      billingRate === null &&
      billingRateRaw !== undefined &&
      billingRateRaw !== null &&
      billingRateRaw !== ""
    ) {
      return Response.json({ error: "Billing rate must be a non-negative number." }, { status: 400 });
    }

    const updates: Partial<Member> = {};
    if (typeof b.name === "string") updates.name = b.name.trim();
    if (typeof b.email === "string") updates.email = b.email.trim().toLowerCase();
    if ("role" in b) updates.role = typeof b.role === "string" ? b.role : null;
    if ("std_cst" in b) updates.std_cst = stdCst;
    if ("billing_rate" in b) updates.billing_rate = billingRate;

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
    if ("billing_rate" in updates) {
      fields.push(`billing_rate = $${fields.length + 1}`);
      values.push(updates.billing_rate ?? null);
    }

    const currentRows = await query<Member>("SELECT * FROM members WHERE id = $1", [b.id]);
    if (currentRows.length === 0) {
      return Response.json({ error: "Member not found." }, { status: 404 });
    }
    const current = currentRows[0];

    const margin = computeMargin(
      "std_cst" in b ? stdCst : current.std_cst,
      "billing_rate" in b ? billingRate : current.billing_rate
    );
    if (margin !== current.margin || "std_cst" in b || "billing_rate" in b) {
      fields.push(`margin = $${fields.length + 1}`);
      values.push(margin);
    }

    if (fields.length === 0) {
      return Response.json({ data: current });
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
