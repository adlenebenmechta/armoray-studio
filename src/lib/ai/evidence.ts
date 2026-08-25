import type { VideoAnalysis, SceneAnalysis } from "./analysis";

/**
 * PRODUCT-EVIDENCE GATE — the exact Notch secret captured live:
 *
 * When the reference ad's demo scene requires physical product facts that the
 * project does not yet have (size / open-mechanism / contents...), the agent
 * HOLDS generation at the "product-evidence checkpoint" and returns a dynamic
 * intake form. The fields are not hardcoded — they are derived from what the
 * reference x-ray says the demo scene will visually require.
 *
 * Captured schema (from the live Notch session):
 * { type: "intake_form",
 *   title: "A few <Product> details first",
 *   fields: [
 *     { id: "product-size", aspect: "size", prompt: "Tin dimensions or scale photo",
 *       required: true, inputType: "text", attachment: "optional",
 *       allowCustomText: true, allowMultipleFiles: false },
 *     ...
 *   ] }
 */

export interface IntakeField {
  id: string;
  aspect: string;
  prompt: string;
  required: boolean;
  inputType: "text" | "none";
  attachment: "optional" | "none";
  allowCustomText: boolean;
  allowMultipleFiles: boolean;
  answered?: boolean;
  value?: string;
}

export interface IntakeForm {
  type: "intake_form";
  title: string;
  gateReason: string;
  fields: IntakeField[];
}

const FIELD_TEMPLATES: Record<string, Omit<IntakeField, "id" | "required" | "answered" | "value">> = {
  size: {
    aspect: "size",
    prompt: "Product dimensions or scale reference (vs. a hand, a coin…)",
    inputType: "text",
    attachment: "optional",
    allowCustomText: true,
    allowMultipleFiles: false,
  },
  "open-mechanism": {
    aspect: "open-mechanism",
    prompt: "How the product opens / works (twist, pull, peel…)",
    inputType: "text",
    attachment: "optional",
    allowCustomText: true,
    allowMultipleFiles: false,
  },
  contents: {
    aspect: "contents",
    prompt: "Photo of the product open / in use",
    inputType: "none",
    attachment: "optional",
    allowCustomText: false,
    allowMultipleFiles: false,
  },
  texture: {
    aspect: "texture",
    prompt: "Material / texture description (what it feels like)",
    inputType: "text",
    attachment: "optional",
    allowCustomText: true,
    allowMultipleFiles: false,
  },
  usage: {
    aspect: "usage",
    prompt: "How it is used step by step",
    inputType: "text",
    attachment: "optional",
    allowCustomText: true,
    allowMultipleFiles: false,
  },
};

/**
 * Build the dynamic intake form from the reference x-ray.
 * Returns null when the gate is satisfied (no evidence missing).
 */
export function buildIntakeForm(
  analysis: VideoAnalysis | null,
  product: { name: string | null; productSize: string | null; productFacts: string | null; productImage: string | null }
): IntakeForm | null {
  if (!analysis) return null;

  // Collect every evidence aspect the reference scenes require
  const needed = new Set<string>();
  for (const scene of analysis.scenes as SceneAnalysis[]) {
    for (const ev of scene.productEvidenceNeeded ?? []) needed.add(ev);
  }
  if (!needed.size) return null; // reference needs no product evidence

  const facts = safeParseFacts(product.productFacts);

  const fields: IntakeField[] = [];
  for (const aspect of needed) {
    const tpl = FIELD_TEMPLATES[aspect];
    if (!tpl) continue;

    // size is satisfied by project.productSize or facts.size
    const answered =
      (aspect === "size" && Boolean(product.productSize || facts.size)) ||
      Boolean(facts[aspect]) ||
      (aspect === "contents" && Boolean(product.productImage));
    if (answered) continue;

    fields.push({
      id: aspect === "size" ? "product-size" : aspect,
      aspect,
      prompt: tpl.prompt,
      required: true,
      inputType: tpl.inputType,
      attachment: tpl.attachment,
      allowCustomText: tpl.allowCustomText,
      allowMultipleFiles: tpl.allowMultipleFiles,
    });
  }

  if (!fields.length) return null; // everything already answered

  const demoNeeds = Array.from(needed).join(", ");
  return {
    type: "intake_form",
    title: `A few ${product.name || "product"} details first`,
    gateReason: `The reference's demo moment requires: ${demoNeeds}. Generation is held at the product-evidence checkpoint until these are confirmed.`,
    fields,
  };
}

function safeParseFacts(raw: string | null): Record<string, string> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null ? (parsed as Record<string, string>) : {};
  } catch {
    return {};
  }
}

/**
 * The gate message the agent shows — mirrors Notch's live wording:
 * "I'm holding generation at the product-evidence checkpoint because..."
 */
export function gateMessage(form: IntakeForm, locale: string): string {
  const aspects = form.fields.map((f) => f.aspect).join(", ");
  if (locale === "ar") {
    return `تحليل المرجع وطريقة تكييفه جاهزان، لكنني أوقفت التوليد عند نقطة فحص أدلة المنتج لأن مشهد العرض في المرجع يحتاج إلى: ${aspects}. صورة سريعة كافية للشكل والمحتوى، والنص يكفي للحجم وطريقة الفتح.`;
  }
  if (locale === "fr") {
    return `La décomposition de la référence et l'adaptation sont prêtes. Je maintiens la génération au point de contrôle des preuves produit car la démo de la référence nécessite : ${aspects}. Une photo rapide suffit pour l'aspect et le contenu ; un texte suffit pour la taille et le mécanisme d'ouverture.`;
  }
  return `The reference breakdown and the adaptation are ready. I'm holding generation at the product-evidence checkpoint because the reference's demo requires: ${aspects}. A quick photo is best for looks and contents; text is enough to confirm size and how it opens.`;
}
