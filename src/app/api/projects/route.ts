import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const projects = await db.project.findMany({
      orderBy: { updatedAt: "desc" },
      include: { scenes: { select: { id: true, status: true } } },
    });
    return NextResponse.json({ projects });
  } catch (e) {
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const name = (body.name || "").toString().slice(0, 120) || "Untitled project";
    const locale = ["ar", "en", "fr"].includes(body.locale) ? body.locale : "ar";
    const project = await db.project.create({ data: { name, locale } });
    return NextResponse.json({ project });
  } catch (e) {
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }
}
