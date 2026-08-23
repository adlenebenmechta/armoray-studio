import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const project = await db.project.findUnique({
      where: { id },
      include: { messages: { orderBy: { createdAt: "asc" } }, scenes: { orderBy: { index: "asc" } } },
    });
    if (!project) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ project });
  } catch {
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const project = await db.project.findUnique({ where: { id } });
    if (!project) return NextResponse.json({ error: "not_found" }, { status: 404 });

    const body = await req.json();
    const items = Array.isArray(body) ? body : [body];

    for (const item of items) {
      const role = item.role === "user" ? "user" : "agent";
      const kind = ["text", "video", "analysis", "product", "storyboard", "result", "error"].includes(item.kind)
        ? item.kind
        : "text";
      const content = String(item.content ?? "").slice(0, 5000);
      const meta = item.meta ? JSON.stringify(item.meta).slice(0, 200_000) : null;
      if (!content) continue;
      await db.message.create({ data: { projectId: id, role, kind, content, meta } });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.project.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }
}
