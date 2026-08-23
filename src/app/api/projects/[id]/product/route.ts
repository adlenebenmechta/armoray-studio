import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const name = (body.name || "").toString().slice(0, 200);
    const url = (body.url || "").toString().slice(0, 500) || null;
    const desc = (body.desc || "").toString().slice(0, 3000) || null;
    const image = typeof body.image === "string" && body.image.startsWith("data:image") ? body.image.slice(0, 3_000_000) : null;

    if (!name) return NextResponse.json({ error: "name_required" }, { status: 400 });

    const project = await db.project.findUnique({ where: { id } });
    if (!project) return NextResponse.json({ error: "not_found" }, { status: 404 });

    const updated = await db.project.update({
      where: { id },
      data: {
        productName: name,
        productUrl: url,
        productDesc: desc,
        productImage: image ?? project.productImage,
      },
    });

    return NextResponse.json({ project: updated });
  } catch {
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }
}
