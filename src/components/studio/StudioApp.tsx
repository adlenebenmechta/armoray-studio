"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  MessageSquare,
  FolderOpen,
  Brain,
  Settings as SettingsIcon,
  Plus,
  ArrowLeft,
  Loader2,
  Trash2,
  Globe,
  Sparkles,
  Zap,
  Layers,
  ExternalLink,
} from "lucide-react";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { localeNames } from "@/lib/i18n";
import AgentChat, { type ProjectData } from "./AgentChat";
import InspirationView from "./InspirationView";

type View = "agents" | "projects" | "brand" | "settings" | "notch-alt" | "inspiration";

export default function StudioApp({ onExit }: { onExit: () => void }) {
  const { dict, locale, setLocale } = useLang();
  const s = dict.studio;

  const [view, setView] = useState<View>("agents");
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [activeProject, setActiveProject] = useState<ProjectData | null>(null);
  const [creating, setCreating] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(true);

  const loadProjects = useCallback(async () => {
    try {
      const res = await fetch("/api/projects");
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects ?? []);
        return data.projects ?? [];
      }
    } catch {} finally {
      setLoadingProjects(false);
    }
    return [];
  }, []);

  // restore last active project
  useEffect(() => {
    (async () => {
      const savedId = typeof window !== "undefined" ? localStorage.getItem("armoray-active-project") : null;
      if (savedId) {
        try {
          const res = await fetch(`/api/projects/${savedId}`);
          if (res.ok) {
            const data = await res.json();
            setActiveProject(data.project);
          } else {
            localStorage.removeItem("armoray-active-project");
          }
        } catch {}
      }
      await loadProjects();
    })();
  }, [loadProjects]);

  async function handleNewProject() {
    setCreating(true);
    try {
      const name = `${new Date().toLocaleDateString(locale)}`;
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, locale }),
      });
      if (res.ok) {
        const data = await res.json();
        setActiveProject(data.project);
        localStorage.setItem("armoray-active-project", data.project.id);
        await loadProjects();
        setView("agents");
      }
    } catch {} finally {
      setCreating(false);
    }
  }

  function handleProjectUpdate(p: ProjectData | null) {
    setActiveProject(p);
    if (p) localStorage.setItem("armoray-active-project", p.id);
    loadProjects();
  }

  async function openProject(id: string) {
    try {
      const res = await fetch(`/api/projects/${id}`);
      if (res.ok) {
        const data = await res.json();
        setActiveProject(data.project);
        localStorage.setItem("armoray-active-project", id);
        setView("agents");
      }
    } catch {}
  }

  async function deleteProject(id: string) {
    try {
      await fetch(`/api/projects/${id}`, { method: "DELETE" });
      if (activeProject?.id === id) {
        setActiveProject(null);
        localStorage.removeItem("armoray-active-project");
      }
      await loadProjects();
    } catch {}
  }

  const navItems: { key: View; icon: React.ReactNode; label: string }[] = [
    { key: "agents", icon: <MessageSquare className="w-4 h-4" />, label: s.sidebar.agents },
    { key: "projects", icon: <FolderOpen className="w-4 h-4" />, label: s.sidebar.projects },
    { key: "inspiration", icon: <Sparkles className="w-4 h-4" />, label: dict.studio?.inspiration?.title ?? "Inspiration" },
    { key: "brand", icon: <Brain className="w-4 h-4" />, label: s.sidebar.brand },
    { key: "settings", icon: <SettingsIcon className="w-4 h-4" />, label: s.sidebar.settings },
    { key: "notch-alt", icon: <Layers className="w-4 h-4" />, label: dict.appsHub.hub },
  ];

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* sidebar — Notch style: white bg, thin border, 16px nav radius */}
      <aside className="hidden md:flex w-64 flex-col border-e border-border bg-sidebar">
        {/* logo */}
        <div className="flex items-center gap-2 px-4 h-16 border-b border-border">
          <span className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-[#593dfa] via-[#2563eb] to-[#c026d3]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M13 2L4.5 13.5H11L10 22L19.5 10H13L13 2Z" fill="white" />
            </svg>
          </span>
          <span className="font-extrabold tracking-tight">Armoray Studio</span>
        </div>

        {/* new chat */}
        <div className="p-3">
          <Button
            onClick={handleNewProject}
            disabled={creating}
            className="btn-pill w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {creating ? <Loader2 className="w-4 h-4 animate-spin me-2" /> : <Plus className="w-4 h-4 me-2" />}
            {s.sidebar.newProject}
          </Button>
        </div>

        {/* nav */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setView(item.key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                view === item.key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}

          {/* chats list — Notch style */}
          {projects.length > 0 && (
            <div className="pt-4">
              <div className="flex items-center justify-between px-3 mb-1">
                <span className="text-xs font-bold text-muted-foreground">Chats</span>
                <button onClick={() => setView("projects")} className="text-xs text-muted-foreground hover:text-foreground">
                  {dict.studio.views.projects.title}
                </button>
              </div>
              <div className="space-y-0.5">
                {projects.slice(0, 4).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => openProject(p.id)}
                    className={`w-full text-start px-3 py-2 rounded-lg text-sm transition-colors ${
                      activeProject?.id === p.id ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
                    }`}
                  >
                    <div className="truncate font-medium text-[13px]">{p.productName || p.name}</div>
                    <ChatStatusLabel status={p.status} />
                  </button>
                ))}
              </div>
            </div>
          )}
        </nav>

        {/* credits — Notch style: real usage from project ledger */}
        <div className="p-3 border-t border-border space-y-2">
          <div className="rounded-xl bg-muted border border-border p-3">
            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground mb-1.5">
              <Zap className="w-3.5 h-3.5" />
              {s.chat.creditsLabel ?? "Credits"}
            </div>
            <div className="text-sm font-extrabold">
              {projects.reduce((a, p) => a + (p.credits || 0), 0)}/30{" "}
              <span className="text-xs font-medium text-muted-foreground">used</span>
            </div>
            <div className="text-[10px] text-muted-foreground mt-1 leading-snug">
              {dict.studio.chat.freeEditNote ?? ""}
            </div>
          </div>
        </div>

        {/* language switcher */}
        <div className="px-3 pb-3 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground px-1">
            <Globe className="w-3.5 h-3.5" />
            {s.views.settings.language}
          </div>
          <div className="grid grid-cols-3 gap-1">
            {(["ar", "en", "fr"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLocale(l)}
                className={`text-xs py-1.5 rounded-lg font-semibold transition-colors ${
                  locale === l ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {localeNames[l]}
              </button>
            ))}
          </div>
          <button
            onClick={onExit}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
            {s.sidebar.backToSite}
          </button>
        </div>
      </aside>

      {/* mobile top bar */}
      <div className="flex md:hidden flex-col flex-1 min-w-0">
        <div className="flex items-center gap-2 h-14 px-4 border-b border-border bg-sidebar">
          <span className="w-7 h-7 rounded-lg flex items-center justify-center bg-gradient-to-br from-[#593dfa] via-[#2563eb] to-[#c026d3]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M13 2L4.5 13.5H11L10 22L19.5 10H13L13 2Z" fill="white" />
            </svg>
          </span>
          <span className="font-extrabold text-sm">Armoray Studio</span>
          <div className="ms-auto flex items-center gap-1">
            {(["ar", "en", "fr"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLocale(l)}
                className={`text-xs px-2 py-1 rounded-lg font-semibold ${
                  locale === l ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-1 px-2 py-2 border-b border-border bg-sidebar overflow-x-auto">
          <Button size="sm" onClick={handleNewProject} disabled={creating} className="btn-pill me-2 bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="w-4 h-4" />
          </Button>
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setView(item.key)}
              className={`flex items-center gap-1.5 whitespace-nowrap text-xs font-medium px-3 py-1.5 rounded-lg ${
                view === item.key ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
        <div className="flex-1 min-h-0">
          <MainView
            view={view}
            activeProject={activeProject}
            onProjectUpdate={handleProjectUpdate}
            projects={projects}
            loadingProjects={loadingProjects}
            onOpenProject={openProject}
            onDeleteProject={deleteProject}
            onExit={onExit}
            onNewProject={handleNewProject}
          />
        </div>
      </div>

      {/* desktop main */}
      <div className="hidden md:flex flex-1 min-w-0">
        <MainView
          view={view}
          activeProject={activeProject}
          onProjectUpdate={handleProjectUpdate}
          projects={projects}
          loadingProjects={loadingProjects}
          onOpenProject={openProject}
          onDeleteProject={deleteProject}
          onExit={onExit}
          onNewProject={handleNewProject}
        />
      </div>
    </div>
  );
}

function NotchAltView() {
  const { dict } = useLang();
  const a = dict.appsHub;
  return (
    <div className="flex-1 flex flex-col min-w-0">
      <div className="flex items-center gap-3 h-16 px-4 md:px-6 border-b border-border bg-sidebar/60">
        <Layers className="w-4 h-4 shrink-0" style={{ color: "#593dfa" }} />
        <span className="text-sm font-bold truncate">{a.hub}</span>
        <Badge variant="outline" className="text-[11px] rounded-full border-border text-muted-foreground shrink-0">
          {a.badge}
        </Badge>
        <Button
          variant="outline"
          size="sm"
          className="btn-pill ms-auto h-9 bg-card border-border shrink-0"
          onClick={() => window.open("https://notch-alternative.vercel.app", "_blank")}
        >
          <ExternalLink className="w-3.5 h-3.5 me-1.5" />
          <span className="hidden sm:inline">{a.openNewTab}</span>
        </Button>
      </div>
      <div className="flex-1 min-h-0 bg-background">
        <iframe
          src="https://notch-alternative.vercel.app"
          title={a.hub}
          className="w-full h-full border-0"
          allow="camera; microphone; clipboard-read; clipboard-write; fullscreen"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-downloads"
        />
      </div>
    </div>
  );
}

function ChatStatusLabel({ status }: { status: string }) {
  const { dict } = useLang();
  const st = dict.studio.status as Record<string, string>;
  const label = st[status] ?? status;
  const color =
    status === "done"
      ? "text-emerald-600"
      : status === "generating" || status === "analyzing" || status === "adapting"
        ? "text-amber-600"
        : status === "error"
          ? "text-destructive"
          : "text-muted-foreground";
  return <div className={`text-[11px] ${color}`}>{label}</div>;
}

function MainView({
  view,
  activeProject,
  onProjectUpdate,
  projects,
  loadingProjects,
  onOpenProject,
  onDeleteProject,
  onExit,
  onNewProject,
}: {
  view: View;
  activeProject: ProjectData | null;
  onProjectUpdate: (p: ProjectData | null) => void;
  projects: ProjectData[];
  loadingProjects: boolean;
  onOpenProject: (id: string) => void;
  onDeleteProject: (id: string) => void;
  onExit: () => void;
  onNewProject: () => void;
}) {
  const { dict } = useLang();
  const s = dict.studio;

  if (view === "agents") {
    return (
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center gap-3 h-16 px-4 md:px-6 border-b border-border bg-sidebar/60">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" style={{ color: "#593dfa" }} />
            <span className="text-sm font-bold">{s.chat.agentName}</span>
          </div>
          {activeProject && <StatusBadge status={activeProject.status} />}
        </div>
        <div className="flex-1 min-h-0">
          <AgentChat key={activeProject?.id ?? "none"} project={activeProject} onProjectUpdate={onProjectUpdate} />
        </div>
      </div>
    );
  }

  if (view === "projects") {
    return (
      <div className="flex-1 overflow-y-auto p-6 md:p-10">
        <h1 className="text-2xl font-extrabold mb-6">{s.views.projects.title}</h1>
        {loadingProjects ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
          </div>
        ) : projects.length === 0 ? (
          <div className="text-muted-foreground text-sm border border-dashed border-border rounded-2xl bg-card p-10 text-center">
            {s.views.projects.empty}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((p) => (
              <Card key={p.id} className="bg-card border-border hover:shadow-[0_8px_30px_rgba(0,0,0,0.05)] transition-shadow">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-bold text-sm truncate">{p.productName || p.name}</div>
                    <StatusBadge status={p.status} />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {p.productName || "—"} · {p.scenes?.length ?? 0} {s.views.projects.scenes}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="btn-pill flex-1 bg-card" onClick={() => onOpenProject(p.id)}>
                      {s.views.projects.open}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => onDeleteProject(p.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (view === "brand") {
    return (
      <div className="flex-1 overflow-y-auto p-6 md:p-10">
        <h1 className="text-2xl font-extrabold">{s.views.brand.title}</h1>
        <p className="text-muted-foreground text-sm mt-1 mb-6">{s.views.brand.subtitle}</p>
        <Card className="bg-card border-border max-w-xl">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-4">
              {activeProject?.productImage ? (
                <img
                  src={activeProject.productImage}
                  alt={activeProject.productName ?? ""}
                  className="w-16 h-16 rounded-xl border border-border object-contain bg-background"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl border border-dashed border-border flex items-center justify-center text-muted-foreground">
                  <Brain className="w-6 h-6" />
                </div>
              )}
              <div>
                <div className="font-bold">{activeProject?.productName || s.views.brand.notSet}</div>
                <div className="text-xs text-muted-foreground" dir="ltr">{activeProject?.productUrl || s.views.brand.notSet}</div>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              <div className="text-xs font-bold mb-1">{s.views.brand.productDesc}</div>
              {activeProject?.productDesc || s.views.brand.notSet}
            </div>
            <p className="text-xs text-muted-foreground">{s.views.brand.editHere}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (view === "notch-alt") {
    return <NotchAltView />;
  }

  if (view === "inspiration") {
    return <InspirationView />;
  }

  // settings
  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-10">
      <h1 className="text-2xl font-extrabold">{s.views.settings.title}</h1>
      <p className="text-muted-foreground text-sm mt-1 mb-6">{s.views.settings.subtitle}</p>
      <div className="space-y-4 max-w-2xl">
        <Card className="bg-card border-border">
          <CardContent className="p-6 space-y-2">
            <div className="font-bold flex items-center gap-2">
              <Globe className="w-4 h-4" style={{ color: "#593dfa" }} />
              {s.views.settings.language}
            </div>
            <p className="text-sm text-muted-foreground">{s.views.settings.languageDesc}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-6 space-y-2">
            <div className="font-bold">{s.views.settings.pipeline}</div>
            <p className="text-sm text-muted-foreground leading-relaxed">{s.views.settings.pipelineText}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-6 space-y-2">
            <div className="font-bold">{s.views.settings.about}</div>
            <p className="text-sm text-muted-foreground leading-relaxed">{s.views.settings.aboutText}</p>
          </CardContent>
        </Card>
        <Button variant="outline" onClick={onExit} className="btn-pill bg-card border-border h-11">
          <ArrowLeft className="w-4 h-4 me-2 rtl:rotate-180" />
          {s.sidebar.backToSite}
        </Button>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const { dict } = useLang();
  const st = dict.studio.status as Record<string, string>;
  const label = st[status] ?? status;
  const cls =
    status === "done"
      ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30"
      : status === "generating" || status === "analyzing" || status === "adapting"
        ? "bg-amber-500/10 text-amber-700 border-amber-500/30"
        : status === "error"
          ? "bg-destructive/10 text-destructive border-destructive/30"
          : "bg-muted text-muted-foreground border-border";
  return (
    <Badge variant="outline" className={`text-[11px] rounded-full font-medium ${cls}`}>
      {label}
    </Badge>
  );
}
