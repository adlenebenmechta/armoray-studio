"use client";

import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Send,
  Paperclip,
  Image as ImageIcon,
  Package,
  Sparkles,
  Film,
  Video,
  Play,
  Download,
  Loader2,
  Volume2,
  Clapperboard,
  Wand2,
} from "lucide-react";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { extractFrames, downscaleImage } from "./media";

export interface SceneData {
  id: string;
  index: number;
  role: string;
  description: string;
  camera?: string | null;
  onScreenText?: string | null;
  duration: number;
  isProductScene: boolean;
  newPrompt?: string | null;
  newVoiceover?: string | null;
  onScreenNew?: string | null;
  status: string;
  videoUrl?: string | null;
  error?: string | null;
  speechQa?: string | null;
}

export interface ProjectData {
  id: string;
  name: string;
  status: string;
  locale: string;
  refVideoName?: string | null;
  refDuration?: number | null;
  refAnalysis?: string | null;
  productName?: string | null;
  productUrl?: string | null;
  productDesc?: string | null;
  productImage?: string | null;
  scenes: SceneData[];
}

export interface ChatMsg {
  id: string;
  role: "user" | "agent";
  kind: string;
  content: string;
  meta?: Record<string, unknown> | null;
}

interface AnalysisMeta {
  hook: string;
  structure: string[];
  tone: string;
  pacing: string;
  summary: string;
  format: string;
}

let msgSeq = 0;
const nextId = () => `local-${Date.now()}-${msgSeq++}`;

export default function AgentChat({
  project,
  onProjectUpdate,
}: {
  project: ProjectData | null;
  onProjectUpdate: (p: ProjectData | null) => void;
}) {
  const { dict, locale } = useLang();
  const c = dict.studio.chat;
  const cd = dict.studio.cards;

  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [agentThinking, setAgentThinking] = useState(false);
  const [productOpen, setProductOpen] = useState(false);
  const [stageMsg, setStageMsg] = useState<string | null>(null);
  const [ttsBusy, setTtsBusy] = useState<string | null>(null);

  const videoInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastProjectIdRef = useRef<string | null>(null);

  // form state for product dialog
  const [pfName, setPfName] = useState("");
  const [pfUrl, setPfUrl] = useState("");
  const [pfDesc, setPfDesc] = useState("");
  const [pfImage, setPfImage] = useState<string | null>(null);
  const [pfSize, setPfSize] = useState("");
  const [pfFacts, setPfFacts] = useState("");

  const hasVideo = Boolean(project?.refAnalysis);
  const hasProduct = Boolean(project?.productName);
  const scenes = project?.scenes ?? [];
  const hasStoryboard = scenes.some((s) => s.newPrompt);
  const isGenerating = scenes.some((s) => s.status === "generating");
  const allSettled = scenes.length > 0 && scenes.every((s) => s.status === "done" || s.status === "error");
  const anyDone = scenes.some((s) => s.status === "done");
  const anyFailed = scenes.some((s) => s.status === "error");

  // load persisted messages when project changes
  useEffect(() => {
    if (!project) {
      setMessages([]);
      return;
    }
    if (lastProjectIdRef.current === project.id) return;
    lastProjectIdRef.current = project.id;
    (async () => {
      try {
        const res = await fetch(`/api/projects/${project.id}`);
        if (res.ok) {
          const data = await res.json();
          const msgs: ChatMsg[] = (data.project?.messages ?? []).map((m: Record<string, unknown>) => ({
            id: String(m.id),
            role: m.role === "user" ? "user" : "agent",
            kind: String(m.kind ?? "text"),
            content: String(m.content ?? ""),
            meta: m.meta ? JSON.parse(String(m.meta)) : null,
          }));
          if (msgs.length === 0) {
            msgs.push({ id: nextId(), role: "agent", kind: "text", content: c.greeting });
          }
          setMessages(msgs);
        } else {
          setMessages([{ id: nextId(), role: "agent", kind: "text", content: c.greeting }]);
        }
      } catch {
        setMessages([{ id: nextId(), role: "agent", kind: "text", content: c.greeting }]);
      }
    })();
  }, [project?.id]);

  // greeting when project created fresh
  useEffect(() => {
    if (project && messages.length === 0 && lastProjectIdRef.current === project.id) {
      setMessages([{ id: nextId(), role: "agent", kind: "text", content: c.greeting }]);
    }
  }, [project?.id]);

  // polling while generating
  useEffect(() => {
    if (!project || !isGenerating) return;
    const id = project.id;
    const timer = setInterval(async () => {
      try {
        const res = await fetch(`/api/projects/${id}/poll`);
        if (res.ok) {
          const data = await res.json();
          if (data.project) {
            onProjectUpdate(data.project);
            const sc: SceneData[] = data.project.scenes ?? [];
            if (sc.length > 0 && sc.every((s) => s.status === "done" || s.status === "error")) {
              const doneNow = sc.some((s) => s.status === "done");
              pushAgent(c.doneIntro, doneNow ? "result" : "text", { done: true });
            }
          }
        }
      } catch {
        // keep polling
      }
    }, 9000);
    return () => clearInterval(timer);
  }, [project?.id, isGenerating]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, stageMsg, agentThinking]);

  function pushAgent(content: string, kind = "text", meta: Record<string, unknown> | null = null) {
    setMessages((prev) => [...prev, { id: nextId(), role: "agent", kind, content, meta }]);
  }
  function pushUser(content: string, kind = "text", meta: Record<string, unknown> | null = null) {
    setMessages((prev) => [...prev, { id: nextId(), role: "user", kind, content, meta }]);
  }

  async function saveMsg(role: "user" | "agent", kind: string, content: string, meta: Record<string, unknown> | null = null) {
    if (!project) return;
    try {
      await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, kind, content, meta }),
      });
    } catch {}
  }

  // ---------- ACTIONS ----------

  async function handleVideoUpload(file: File) {
    if (!project || busy) return;
    setBusy(true);
    const previewUrl = URL.createObjectURL(file);
    pushUser(c.videoAttached, "video", { url: previewUrl, name: file.name });
    await saveMsg("user", "video", c.videoAttached, { name: file.name });
    setStageMsg(c.waitingFrames);
    try {
      const media = await extractFrames(file, 6);
      let transcript: string | null = null;
      if (media.audioBase64) {
        setStageMsg(dict.studio.chat.analyzing);
        try {
          const asrRes = await fetch("/api/asr", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ audioBase64: media.audioBase64 }),
          });
          if (asrRes.ok) {
            const asrData = await asrRes.json();
            transcript = asrData.text || null;
          }
        } catch {}
      }
      const res = await fetch(`/api/projects/${project.id}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          frames: media.frames,
          duration: media.duration,
          videoName: file.name,
          transcript,
        }),
      });
      if (!res.ok) throw new Error("analyze_failed");
      const data = await res.json();
      onProjectUpdate(data.project);
      const analysis = data.analysis;
      pushAgent(c.analyzedIntro + (analysis.summary ? `\n\n${analysis.summary}` : ""), "analysis", { analysis });
      await saveMsg("agent", "analysis", c.analyzedIntro, { analysis });
    } catch (e) {
      pushAgent(dict.studio.errors.analyzeFailed, "error");
    } finally {
      setStageMsg(null);
      setBusy(false);
    }
  }

  async function handleSaveProduct() {
    if (!project || busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/product`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: pfName,
          url: pfUrl,
          desc: pfDesc,
          image: pfImage,
          size: pfSize,
          facts: pfFacts.split("\n").map((l) => l.trim()).filter(Boolean),
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      onProjectUpdate(data.project);
      setProductOpen(false);
      pushUser(`${c.addProduct}: ${pfName}`, "product", { name: pfName });
      await saveMsg("user", "product", `${c.addProduct}: ${pfName}`, { name: pfName });
      pushAgent(c.productSavedIntro, "text");
      await saveMsg("agent", "text", c.productSavedIntro);
    } catch {
      pushAgent(dict.studio.errors.generic, "error");
    } finally {
      setBusy(false);
    }
  }

  async function handleRecreate() {
    if (!project || busy) return;
    if (!hasVideo) {
      pushAgent(dict.studio.errors.needVideo, "error");
      return;
    }
    if (!hasProduct) {
      setProductOpen(true);
      return;
    }
    setBusy(true);
    setAgentThinking(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/adapt`, { method: "POST" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      onProjectUpdate(data.project);
      pushAgent(c.adaptedIntro, "storyboard", {
        hookLine: data.adaptation?.hookLine ?? "",
        ctaLine: data.adaptation?.ctaLine ?? "",
        explanation: data.adaptation?.explanation ?? "",
      });
      await saveMsg("agent", "storyboard", c.adaptedIntro, {
        hookLine: data.adaptation?.hookLine ?? "",
        ctaLine: data.adaptation?.ctaLine ?? "",
        explanation: data.adaptation?.explanation ?? "",
      });
    } catch {
      pushAgent(dict.studio.errors.adaptFailed, "error");
    } finally {
      setAgentThinking(false);
      setBusy(false);
    }
  }

  async function handleGenerate() {
    if (!project || busy) return;
    if (!hasStoryboard) {
      pushAgent(dict.studio.errors.needVideo, "error");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/generate`, { method: "POST" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      onProjectUpdate(data.project);
      pushAgent(c.generateIntro, "storyboard", { generating: true });
      await saveMsg("agent", "storyboard", c.generateIntro, { generating: true });
    } catch {
      pushAgent(dict.studio.errors.generateFailed, "error");
    } finally {
      setBusy(false);
    }
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || busy || agentThinking) return;
    setInput("");
    pushUser(text, "text");
    setAgentThinking(true);
    try {
      const history = messages
        .filter((m) => m.kind === "text")
        .slice(-8)
        .map((m) => ({ role: m.role === "user" ? "user" : "assistant", content: m.content }));
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, projectId: project?.id, locale, history }),
      });
      const data = await res.json();
      const reply = data.reply || dict.studio.errors.generic;
      pushAgent(reply, "text");
      if (project) {
        fetch(`/api/projects/${project.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify([
            { role: "user", kind: "text", content: text },
            { role: "agent", kind: "text", content: reply },
          ]),
        }).catch(() => {});
      }
    } catch {
      pushAgent(dict.studio.errors.generic, "error");
    } finally {
      setAgentThinking(false);
    }
  }

  async function handleListen(scene: SceneData) {
    if (!scene.newVoiceover || ttsBusy) return;
    setTtsBusy(scene.id);
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: scene.newVoiceover }),
      });
      const data = await res.json();
      if (data.audio) {
        const audio = new Audio(data.audio);
        audio.play();
      }
    } catch {} finally {
      setTtsBusy(null);
    }
  }

  function suggestions(): { label: string; action: () => void }[] {
    const s = c.suggestions;
    const out: { label: string; action: () => void }[] = [];
    if (!hasVideo) out.push({ label: s.addVideo, action: () => videoInputRef.current?.click() });
    if (hasVideo && !hasProduct) out.push({ label: s.addProduct, action: () => setProductOpen(true) });
    if (hasVideo && hasProduct && !hasStoryboard) out.push({ label: s.recreate, action: handleRecreate });
    if (hasStoryboard && !isGenerating && !allSettled) out.push({ label: s.generate, action: handleGenerate });
    if (allSettled && anyFailed) out.push({ label: s.regenerate, action: handleGenerate });
    if (allSettled) out.push({ label: s.moreAngles, action: () => setInput("…") });
    return out.slice(0, 3);
  }

  // ---------- RENDER ----------

  const analysis: AnalysisMeta | null = (() => {
    if (!project?.refAnalysis) return null;
    try {
      return JSON.parse(project.refAnalysis);
    } catch {
      return null;
    }
  })();

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* messages */}
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-4 md:px-8 py-6 space-y-4">
        {messages.map((m) => (
          <ChatMessage
            key={m.id}
            msg={m}
            project={project}
            analysis={analysis}
            onListen={handleListen}
            ttsBusy={ttsBusy}
          />
        ))}
        {stageMsg && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground px-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            {stageMsg}
          </div>
        )}
        {agentThinking && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground px-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            {c.thinking}
          </div>
        )}
        {/* suggestion chips */}
        {messages.length > 0 && !busy && !agentThinking && suggestions().length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {suggestions().map((s, i) => (
              <button
                key={i}
                onClick={s.action}
                className="text-xs md:text-sm rounded-full border border-border bg-card hover:bg-accent px-4 py-2 transition-colors"
              >
                {s.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* input */}
      <div className="border-t border-border bg-card/50 backdrop-blur px-4 md:px-8 py-4">
        <div className="flex items-end gap-2 max-w-3xl mx-auto">
          <div className="flex gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              title={c.uploadVideo}
              disabled={busy || agentThinking}
              onClick={() => videoInputRef.current?.click()}
            >
              <Paperclip className="w-5 h-5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              title={c.addProduct}
              disabled={busy || agentThinking}
              onClick={() => setProductOpen(true)}
            >
              <Package className="w-5 h-5" />
            </Button>
          </div>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={c.placeholder}
            disabled={busy || agentThinking}
            className="flex-1"
          />
          <Button type="button" size="icon" onClick={handleSend} disabled={busy || agentThinking || !input.trim()}>
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleVideoUpload(f);
          e.target.value = "";
        }}
      />
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (f) {
            try {
              setPfImage(await downscaleImage(f));
              setProductOpen(true);
            } catch {}
          }
          e.target.value = "";
        }}
      />

      {/* product dialog */}
      <Dialog open={productOpen} onOpenChange={(open) => !busy && setProductOpen(open)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{dict.studio.productDialog.title}</DialogTitle>
            <DialogDescription>{dict.studio.productDialog.desc}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="pf-name">{dict.studio.productDialog.nameLabel}</Label>
              <Input
                id="pf-name"
                value={pfName}
                onChange={(e) => setPfName(e.target.value)}
                placeholder={dict.studio.productDialog.namePh}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="pf-url">{dict.studio.productDialog.urlLabel}</Label>
              <Input
                id="pf-url"
                value={pfUrl}
                onChange={(e) => setPfUrl(e.target.value)}
                placeholder={dict.studio.productDialog.urlPh}
                dir="ltr"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="pf-desc">{dict.studio.productDialog.descLabel}</Label>
              <Textarea
                id="pf-desc"
                value={pfDesc}
                onChange={(e) => setPfDesc(e.target.value)}
                placeholder={dict.studio.productDialog.descPh}
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label>{dict.studio.productDialog.imageLabel}</Label>
              {pfImage ? (
                <div className="flex items-center gap-3">
                  <img src={pfImage} alt="product" className="w-20 h-20 object-contain rounded-lg border border-border bg-background" />
                  <Button variant="outline" size="sm" onClick={() => imageInputRef.current?.click()}>
                    <ImageIcon className="w-4 h-4 me-2" />
                    {dict.studio.productDialog.imagePh}
                  </Button>
                </div>
              ) : (
                <Button variant="outline" onClick={() => imageInputRef.current?.click()}>
                  <ImageIcon className="w-4 h-4 me-2" />
                  {dict.studio.productDialog.imagePh}
                </Button>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="pf-size">{dict.studio.productDialog.sizeLabel}</Label>
              <Input id="pf-size" value={pfSize} onChange={(e) => setPfSize(e.target.value)} placeholder={dict.studio.productDialog.sizePh} />
              <p className="text-xs text-muted-foreground">{dict.studio.productDialog.sizeHint}</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="pf-facts">{dict.studio.productDialog.factsLabel}</Label>
              <Textarea id="pf-facts" value={pfFacts} onChange={(e) => setPfFacts(e.target.value)} placeholder={dict.studio.productDialog.factsPh} rows={2} />
              <p className="text-xs text-muted-foreground">{dict.studio.productDialog.factsHint}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setProductOpen(false)} disabled={busy}>
              {dict.studio.productDialog.cancel}
            </Button>
            <Button onClick={handleSaveProduct} disabled={busy || !pfName.trim()}>
              {busy ? <Loader2 className="w-4 h-4 animate-spin me-2" /> : <Package className="w-4 h-4 me-2" />}
              {dict.studio.productDialog.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---------- MESSAGE RENDERER ----------

function ChatMessage({
  msg,
  project,
  analysis,
  onListen,
  ttsBusy,
}: {
  msg: ChatMsg;
  project: ProjectData | null;
  analysis: AnalysisMeta | null;
  onListen: (s: SceneData) => void;
  ttsBusy: string | null;
}) {
  const { dict } = useLang();
  const c = dict.studio.cards;
  const isUser = msg.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] md:max-w-[70%] rounded-2xl rounded-ee-sm bg-primary text-primary-foreground px-4 py-3 text-sm whitespace-pre-wrap shadow">
          {msg.kind === "video" && msg.meta?.name ? (
            <span className="flex items-center gap-2">
              <Film className="w-4 h-4 shrink-0" />
              <span className="truncate">{String(msg.meta.name)}</span>
            </span>
          ) : (
            msg.content
          )}
        </div>
      </div>
    );
  }

  // agent messages
  return (
    <div className="flex gap-3 max-w-full">
      <div className="shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-background font-bold text-sm shadow">
        N
      </div>
      <div className="flex flex-col gap-2 min-w-0 max-w-[92%] md:max-w-[78%]">
        {msg.content && (
          <div className="rounded-2xl rounded-es-sm bg-card border border-border px-4 py-3 text-sm whitespace-pre-wrap shadow-sm">
            {msg.content}
          </div>
        )}
        {msg.kind === "video" && null}
        {msg.kind === "analysis" && analysis && <AnalysisCard analysis={analysis} scenes={project?.scenes ?? []} />}
        {msg.kind === "product" && project?.productName && (
          <Card className="overflow-hidden">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Package className="w-4 h-4 text-emerald-500" />
                {c.product.title}
              </div>
              <div className="text-sm font-medium">{project.productName}</div>
              {project.productDesc && <p className="text-xs text-muted-foreground line-clamp-3">{project.productDesc}</p>}
              {project.productImage && (
                  <img src={project.productImage} alt={project.productName} className="w-full max-w-[200px] rounded-lg border border-border" />
              )}
            </CardContent>
          </Card>
        )}
        {msg.kind === "storyboard" && <StoryboardCard scenes={project?.scenes ?? []} onListen={onListen} ttsBusy={ttsBusy} />}
        {msg.kind === "result" && <ResultCard scenes={project?.scenes ?? []} />}
      </div>
    </div>
  );
}

// ---------- CARDS ----------

function AnalysisCard({ analysis, scenes }: { analysis: AnalysisMeta; scenes: SceneData[] }) {
  const { dict } = useLang();
  const c = dict.studio.cards.analysis;
  const roles = c.roles || {};
  const totalDur = scenes.reduce((a, s) => a + (s.duration || 0), 0) || 1;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 md:p-5 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Clapperboard className="w-4 h-4 text-emerald-500" />
          {c.xray}
          {analysis.format && <Badge variant="secondary" className="text-xs">{analysis.format}</Badge>}
        </div>

        {/* timeline map — hook/demo/proof/cta beats with proportional widths */}
        <div className="flex h-9 rounded-lg overflow-hidden border border-border text-[10px] font-semibold">
          {scenes.map((s) => {
            const pct = ((s.duration || 3) / totalDur) * 100;
            const roleColor: Record<string, string> = {
              hook: "bg-emerald-500/80 text-zinc-950",
              demo: "bg-teal-500/70 text-zinc-950",
              proof: "bg-amber-400/70 text-zinc-950",
              cta: "bg-orange-500/80 text-zinc-950",
            };
            return (
              <div
                key={s.id}
                className={`${roleColor[s.role] || "bg-zinc-600 text-zinc-100"} flex items-center justify-center min-w-0 px-1 truncate`}
                style={{ width: `${pct}%` }}
                title={`${roles[s.role] || s.role} · ${Math.round(s.duration)}s`}
              >
                {roles[s.role] || s.role}
              </div>
            );
          })}
        </div>
        <div className="text-xs text-muted-foreground">
          {scenes.length} {c.scenes} · {Math.round(totalDur)} {c.seconds} · {c.format}: {analysis.format || "—"}
        </div>

        {analysis.hook && (
          <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3">
            <div className="text-xs font-semibold text-emerald-500 mb-1">{c.hook}</div>
            <div className="text-sm">{analysis.hook}</div>
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-xs text-muted-foreground mb-1">{c.tone}</div>
            <div>{analysis.tone || "—"}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">{c.pacing}</div>
            <div>{analysis.pacing || "—"}</div>
          </div>
        </div>
        {analysis.structure?.length > 0 && (
          <div>
            <div className="text-xs text-muted-foreground mb-2">{c.structure}</div>
            <div className="flex flex-wrap gap-1.5">
              {analysis.structure.map((s, i) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {s}
                </Badge>
              ))}
            </div>
          </div>
        )}
        <div>
          <div className="text-xs text-muted-foreground mb-2">
            {c.scenes} ({scenes.length})
          </div>
          <div className="space-y-2">
            {scenes.map((s) => (
              <div key={s.id} className="rounded-lg border border-border p-3 space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-xs">
                    {c.scene} {s.index + 1}
                  </Badge>
                  {s.role && <Badge className="text-xs bg-teal-500/15 text-teal-600 border border-teal-500/30">{roles[s.role] || s.role}</Badge>}
                  <span className="text-xs text-muted-foreground">
                    {Math.round(s.duration)} {c.seconds}
                  </span>
                  {s.isProductScene && (
                    <Badge className="text-xs bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 hover:bg-emerald-500/15">
                      {c.productScene}
                    </Badge>
                  )}
                </div>
                <p className="text-sm">{s.description}</p>
                {s.camera && (
                  <p className="text-xs text-muted-foreground">
                    {c.camera}: {s.camera}
                  </p>
                )}
                {s.onScreenText && (
                  <p className="text-xs text-muted-foreground">
                    {c.onScreen}: {s.onScreenText}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StoryboardCard({
  scenes,
  onListen,
  ttsBusy,
}: {
  scenes: SceneData[];
  onListen: (s: SceneData) => void;
  ttsBusy: string | null;
}) {
  const { dict } = useLang();
  const c = dict.studio.cards.storyboard;
  const roles = c.roles || {};
  const adapted = scenes.filter((s) => s.newPrompt);
  if (!adapted.length) return null;
  const doneCount = adapted.filter((s) => s.status === "done").length;
  const generatingCount = adapted.filter((s) => s.status === "generating").length;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 md:p-5 space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Wand2 className="w-4 h-4 text-emerald-500" />
            {c.title}
          </div>
          {generatingCount > 0 && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground min-w-[140px]">
              <Progress value={(doneCount / adapted.length) * 100} className="h-1.5 w-24" />
              {doneCount}/{adapted.length}
            </div>
          )}
        </div>
        <div className="space-y-3">
          {adapted.map((s) => (
            <div key={s.id} className="rounded-lg border border-border overflow-hidden">
              <div className="flex items-center gap-2 p-3 bg-muted/40 flex-wrap">
                <Badge variant="outline" className="text-xs">
                  {dict.studio.cards.analysis.scene} {s.index + 1}
                </Badge>
                {s.role && <Badge className="text-xs bg-teal-500/15 text-teal-600 border border-teal-500/30">{roles[s.role] || s.role}</Badge>}
                {s.isProductScene && (
                  <Badge className="text-xs bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 hover:bg-emerald-500/15">
                    {dict.studio.cards.analysis.productScene}
                  </Badge>
                )}
                <SceneStatusBadge status={s.status} />
                {s.newVoiceover && (
                  <button
                    onClick={() => onListen(s)}
                    disabled={ttsBusy === s.id}
                    className="ms-auto flex items-center gap-1 text-xs text-emerald-500 hover:underline disabled:opacity-50"
                  >
                    {ttsBusy === s.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Volume2 className="w-3.5 h-3.5" />}
                    {c.listen}
                  </button>
                )}
              </div>
              <div className="p-3 space-y-2">
                {s.newVoiceover && (
                  <div>
                    <div className="text-xs text-muted-foreground">{c.voiceover}</div>
                    <p className="text-sm">{s.newVoiceover}</p>
                  </div>
                )}
                {s.onScreenNew && (
                  <div>
                    <div className="text-xs text-muted-foreground">{c.onScreen}</div>
                    <p className="text-sm font-semibold">{s.onScreenNew}</p>
                  </div>
                )}
                <div>
                  <div className="text-xs text-muted-foreground">{c.prompt}</div>
                  <p className="text-xs text-muted-foreground leading-relaxed" dir="ltr">
                    {s.newPrompt}
                  </p>
                </div>
                {s.status === "generating" && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    {c.generating}
                  </div>
                )}
                {s.status === "done" && s.videoUrl && (
                  <>
                    <video src={s.videoUrl} controls playsInline className="w-full max-w-[240px] rounded-lg border border-border" />
                    <SpeechQaRow scene={s} />
                  </>
                )}
                {s.status === "error" && <div className="text-xs text-red-500">{c.error}</div>}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ResultCard({ scenes }: { scenes: SceneData[] }) {
  const { dict } = useLang();
  const c = dict.studio.cards.result;
  const done = scenes.filter((s) => s.status === "done" && s.videoUrl);
  if (!done.length) return null;
  return (
    <Card className="overflow-hidden border-emerald-500/30">
      <CardContent className="p-4 md:p-5 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Sparkles className="w-4 h-4 text-emerald-500" />
          {c.title}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {done.map((s) => (
            <div key={s.id} className="space-y-2">
              <video src={s.videoUrl!} controls playsInline className="w-full rounded-lg border border-border" />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {c.sceneN} {s.index + 1}
                </span>
                <a
                  href={s.videoUrl!}
                  download
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-xs text-emerald-500 hover:underline"
                >
                  <Download className="w-3.5 h-3.5" />
                  {c.download}
                </a>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function SceneStatusBadge({ status }: { status: string }) {
  const { dict } = useLang();
  const c = dict.studio.cards.storyboard;
  if (status === "done")
    return <Badge className="text-xs bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 hover:bg-emerald-500/15">{c.done}</Badge>;
  if (status === "generating")
    return (
      <Badge className="text-xs bg-amber-500/15 text-amber-500 border border-amber-500/30 hover:bg-amber-500/15">
        {c.generating}
      </Badge>
    );
  if (status === "error")
    return <Badge variant="destructive" className="text-xs">{c.error}</Badge>;
  return <Badge variant="secondary" className="text-xs">{c.pending}</Badge>;
}

function SpeechQaRow({ scene }: { scene: SceneData }) {
  const { dict } = useLang();
  const c = dict.studio.cards.storyboard;

  const qa = (() => {
    if (!scene.speechQa) return null;
    try {
      return JSON.parse(scene.speechQa) as {
        transcript: string;
        wordCount: number;
        pace: number;
        passed: boolean;
        issues: string[];
      };
    } catch {
      return null;
    }
  })();

  if (!qa) return null;

  return (
    <div className={`rounded-lg border p-2.5 space-y-1 ${qa.passed ? "border-emerald-500/30 bg-emerald-500/5" : "border-amber-500/40 bg-amber-500/5"}`}>
      <div className="flex items-center gap-2 flex-wrap text-xs">
        <Volume2 className="w-3.5 h-3.5 text-emerald-500" />
        <span className="font-semibold">{c.speechQa}</span>
        <span className="text-muted-foreground">
          {qa.wordCount} {c.words} · {qa.pace} {c.wps}
        </span>
        <Badge
          variant="outline"
          className={`text-[10px] ${qa.passed ? "text-emerald-500 border-emerald-500/40" : "text-amber-500 border-amber-500/40"}`}
        >
          {qa.passed ? c.passed : c.failed}
        </Badge>
      </div>
      {qa.transcript && (
        <p className="text-[11px] text-muted-foreground leading-relaxed">“{qa.transcript}”</p>
      )}
    </div>
  );
}
