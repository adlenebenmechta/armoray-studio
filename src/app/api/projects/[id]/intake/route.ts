import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { IntakeForm } from "@/lib/ai/evidence";

/**
 * POST /api/projects/[id]/intake — submit the Product-Evidence Gate answers.
 * Mirrors Notch's live flow: the user answers the dynamic intake form
 * (size / open-mechanism / contents...), the facts are merged into the
 * project, and generation is unblocked.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    // answers: { "product-size": "6cm tin", "open-mechanism": "twist-off lid" }
    const answers: Record<string, string> = {};
    if (body.answers && typeof body.answers === "object") {
      for (const [k, v] of Object.entries(body.answers as Record<string, unknown>)) {
        answers[String(k).slice(0, 40)] = String(v ?? "").slice(0, 600);
      }
    }
    // attachments map aspect -> image data URL (contents photo)
    const attachments: Record<string, string> = {};
    if (body.attachments && typeof body.attachments === "object") {
      for (const [k, v] of Object.entries(body.attachments as Record<string, unknown>)) {
        attachments[String(k).slice(0, 40)] = String(v ?? "");
      }
    }

    const project = await db.project.findUnique({ where: { id } });
    if (!project) return NextResponse.json({ error: "not_found" }, { status: 404 });

    let form: IntakeForm | null = null;
    try {
      form = project.evidenceGate ? (JSON.parse(project.evidenceGate) as IntakeForm) : null;
    } catch {
      form = null;
    }
    if (!form) return NextResponse.json({ error: "no_gate" }, { status: 400 });

    // Merge answers into product facts (aspect -> value)
    const facts: Record<string, string> = (() => {
      try {
        return project.productFacts ? JSON.parse(project.productFacts) : {};
      } catch {
        return {};
      }
    })();

    let sizeText = project.productSize ?? "";
    for (const field of form.fields) {
      const val = answers[field.id] ?? answers[field.aspect];
      if (val && val.trim()) {
        facts[field.aspect] = val.trim();
        if (field.aspect === "size" && !sizeText) sizeText = val.trim().slice(0, 200);
      }
    }

    // Contents photo becomes the product image if none set
    let productImage = project.productImage;
    const contentsImg = attachments["contents"] ?? attachments[fieldId(form, "contents")];
    if (contentsImg && contentsImg.startsWith("data:")) {
      productImage = contentsImg;
      facts["contents-photo"] = "attached";
    }

    const updated = await db.project.update({
      where: { id },
      data: {
        productFacts: JSON.stringify(facts),
        productSize: sizeText || null,
        productImage,
        evidenceGate: null, // gate satisfied
        status: "analyzed",
      },
      include: { scenes: { orderBy: { index: "asc" } } },
    });

    return NextResponse.json({ project: updated, facts });
  } catch (e: unknown) {
    console.error("intake error", e);
    return NextResponse.json({ error: "intake_failed" }, { status: 500 });
  }
}

function fieldId(form: IntakeForm, aspect: string): string {
  return form.fields.find((f) => f.aspect === aspect)?.id ?? aspect;
}
