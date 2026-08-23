import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { agentReply } from "@/lib/ai/agent";

const localeNames: Record<string, string> = { ar: "Arabic", en: "English", fr: "French" };

/**
 * Fallback replies when the AI provider is not configured yet (e.g. on a fresh
 * Vercel deployment without a ZAI_API_KEY). The agent stays useful and guides
 * the user through the pipeline instead of failing.
 */
function fallbackReply(message: string, locale: string, ctx: { hasVideo: boolean; hasProduct: boolean; hasStoryboard: boolean }): string {
  const msg = message.toLowerCase();
  const ar = locale === "ar";
  const fr = locale === "fr";

  if (ctx.hasVideo && ctx.hasProduct && !ctx.hasStoryboard) {
    return ar
      ? "جاهز لإعادة البناء! سأعيد بناء نفس بنية الفيديو المرجعي لكن لمنتجك — استخدم زر «أعيديه لمنتجي» بالأسفل لتشغيل إعادة كتابة السكريبت."
      : fr
        ? "Prêt pour la reconstruction ! Utilisez le bouton « Recrée-la pour mon produit » ci-dessous pour relancer le script."
        : "Ready to rebuild! Use the “Recreate it for my product” button below to run the script rewrite.";
  }
  if (!ctx.hasVideo) {
    return ar
      ? "لنبدأ! ارفع أي فيديو إعلاني أعجبك بزر مشبك الورق، وسأفكك بنيته الرابحة مشهداً بمشهد (الخطّاف، العرض، الدعوة) قبل إعادة بنائها لمنتجك."
      : fr
        ? "Commençons ! Importez n'importe quelle pub qui vous plaît avec le bouton trombone, et je décomposerai sa structure gagnante scène par scène."
        : "Let's start! Upload any video ad you love with the paperclip button, and I'll decompose its winning structure scene by scene.";
  }
  if (!ctx.hasProduct) {
    return ar
      ? "رائع، حللتُ الفيديو المرجعي! أضف منتجك الآن (الاسم والوصف وصورة المنتج) بزر «أضف منتجاً» وسأبني العقل العلامي الخاص بك."
      : fr
        ? "Super, vidéo analysée ! Ajoutez votre produit avec le bouton « Ajouter le produit » et je construirai le Cerveau de Marque."
        : "Great, reference analyzed! Add your product with the “Add product” button and I'll build your Brand Brain.";
  }
  if (msg.includes("how") || msg.includes("كيف") || msg.includes("comment")) {
    return ar
      ? "خط الإنتاج: 1) رفع فيديو مرجعي ← 2) أشعة الفيديو (تفكيك البنية) ← 3) إضافة منتجك ← 4) إعادة كتابة السكريبت لمنتجك ← 5) توليد المشاهد مشهداً بمشهد ← 6) فحص الصوت والجودة."
      : fr
        ? "Le pipeline : 1) vidéo de référence → 2) X-Ray (décomposition) → 3) votre produit → 4) réécriture du script → 5) génération scène par scène → 6) contrôle vocal et qualité."
        : "The pipeline: 1) reference video → 2) X-Ray decomposition → 3) your product → 4) script rewrite → 5) scene-by-scene generation → 6) speech QA.";
  }
  return ar
    ? "أنا نوفا، وكيلتك الإبداعية في Armoray Studio. أرسل فيديو إعلانياً مرجعياً وأضف منتجك، وسأبني لك نسخة بنفس البنية الرابحة — لكن لمنتجك بالكامل."
    : fr
      ? "Je suis Nova, votre agente créative chez Armoray Studio. Envoyez une vidéo de référence et ajoutez votre produit."
      : "I'm Nova, your creative agent at Armoray Studio. Send a reference video and add your product.";
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const message = (body.message || "").toString().slice(0, 2000);
    const projectId = body.projectId ? String(body.projectId) : null;
    const locale = ["ar", "en", "fr"].includes(body.locale) ? body.locale : "ar";
    const history: { role: "user" | "assistant"; content: string }[] = Array.isArray(body.history)
      ? body.history.slice(-10).map((h: { role?: string; content?: string }) => ({
          role: h.role === "assistant" ? "assistant" : "user",
          content: String(h.content ?? "").slice(0, 1000),
        }))
      : [];

    if (!message) return NextResponse.json({ error: "no_message" }, { status: 400 });

    let ctx = {
      localeName: localeNames[locale] ?? "English",
      hasVideo: false,
      hasProduct: false,
      hasStoryboard: false,
      isGenerating: false,
    };

    if (projectId) {
      const project = await db.project.findUnique({ where: { id: projectId }, include: { scenes: true } });
      if (project) {
        ctx = {
          ...ctx,
          hasVideo: Boolean(project.refAnalysis),
          hasProduct: Boolean(project.productName),
          hasStoryboard: project.scenes.some((s) => s.newPrompt),
          isGenerating: project.scenes.some((s) => s.status === "generating"),
          productName: project.productName ?? undefined,
          sceneCount: project.scenes.length || undefined,
        };
      }
    }

    let reply: string;
    try {
      reply = await agentReply(message, history, ctx);
    } catch {
      // AI provider unavailable (e.g. missing API key on serverless) —
      // answer with the guided fallback so the product still works.
      reply = fallbackReply(message, locale, ctx);
    }
    return NextResponse.json({ reply });
  } catch (e: unknown) {
    console.error("chat error", e);
    return NextResponse.json({ error: "chat_failed", detail: String((e as { message?: string })?.message ?? e).slice(0, 300) }, { status: 500 });
  }
}
