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
} from "lucide-react";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { localeNames } from "@/lib/i18n";
import AgentChat, { type ProjectData } from "./AgentChat";

type View = "agents" | "projects" | "brand" | "settings";

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
      const name = `${s.chat.agentName.split(" ")[0]} · ${new Date().toLocaleDateString(locale)}`;
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
    { key: "brand", icon: <Brain className="w-4 h-4" />, label: s.sidebar.brand },
    { key: "settings", icon: <SettingsIcon className="w-4 h-4" />, label: s.sidebar.settings },
  ];

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 overflow-hidden">
      {/* sidebar */}
      <aside className="hidden md:flex w-60 lg:w-64 flex-col border-e border-zinc-800 bg-zinc-900/60 backdrop-blur">
        <div className="flex items-center gap-2 px-4 h-16 border-b border-zinc-800">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-zinc-950 font-extrabold">
            A
          </div>
          <span className="font-bold tracking-tight">Armoray Studio</span>
        </div>

        <div className="p-3">
          <Button
            onClick={handleNewProject}
            disabled={creating}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold"
          >
            {creating ? <Loader2 className="w-4 h-4 animate-spin me-2" /> : <Plus className="w-4 h-4 me-2" />}
            {s.sidebar.newProject}
          </Button>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setView(item.key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                view === item.key ? "bg-zinc-800 text-zinc-50 font-medium" : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60"
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        {/* language switcher */}
        <div className="p-3 border-t border-zinc-800 space-y-2">
          <div className="flex items-center gap-2 text-xs text-zinc-500 px-1">
            <Globe className="w-3.5 h-3.5" />
            {s.views.settings.language}
          </div>
          <div className="grid grid-cols-3 gap-1">
            {(["ar", "en", "fr"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLocale(l)}
                className={`text-xs py-1.5 rounded-md transition-colors ${
                  locale === l ? "bg-emerald-500/20 text-emerald-400 font-semibold" : "bg-zinc-800 text-zinc-400 hover:text-zinc-100"
                }`}
              >
                {localeNames[l]}
              </button>
            ))}
          </div>
        </div>

        <div className="p-3 border-t border-zinc-800">
          <button
            onClick={onExit}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
            {s.sidebar.backToSite}
          </button>
        </div>
      </aside>

      {/* mobile top bar */}
      <div className="flex md:hidden flex-col flex-1 min-w-0">
        <div className="flex items-center gap-2 h-14 px-4 border-b border-zinc-800 bg-zinc-900/60">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-zinc-950 font-extrabold text-sm">
            A
          </div>
          <span className="font-bold text-sm">Armoray Studio</span>
          <div className="ms-auto flex items-center gap-1">
            {(["ar", "en", "fr"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLocale(l)}
                className={`text-xs px-2 py-1 rounded-md ${
                  locale === l ? "bg-emerald-500/20 text-emerald-400 font-semibold" : "text-zinc-400"
                }`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-1 px-2 py-2 border-b border-zinc-800 overflow-x-auto">
          <Button size="sm" onClick={handleNewProject} disabled={creating} className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 me-2">
            <Plus className="w-4 h-4" />
          </Button>
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setView(item.key)}
              className={`flex items-center gap-1.5 whitespace-nowrap text-xs px-3 py-1.5 rounded-lg ${
                view === item.key ? "bg-zinc-800 text-zinc-50" : "text-zinc-400"
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
        <div className="flex items-center gap-3 h-16 px-4 md:px-6 border-b border-zinc-800 bg-zinc-900/40">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-semibold">{s.chat.agentName}</span>
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
        <h1 className="text-2xl font-bold mb-6">{s.views.projects.title}</h1>
        {loadingProjects ? (
          <div className="flex items-center gap-2 text-zinc-400">
            <Loader2 className="w-4 h-4 animate-spin" />
          </div>
        ) : projects.length === 0 ? (
          <div className="text-zinc-400 text-sm border border-dashed border-zinc-800 rounded-xl p-10 text-center">
            {s.views.projects.empty}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((p) => (
              <Card key={p.id} className="bg-zinc-900/60 border-zinc-800 hover:border-emerald-500/40 transition-colors">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-semibold text-sm truncate">{p.name}</div>
                    <StatusBadge status={p.status} />
                  </div>
                  <div className="text-xs text-zinc-400">
                    {p.productName || "—"} · {p.scenes?.length ?? 0} {s.views.projects.scenes}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => onOpenProject(p.id)}>
                      {s.views.projects.open}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => onDeleteProject(p.id)}>
                      <Trash2 className="w-4 h-4 text-red-400" />
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
        <h1 className="text-2xl font-bold">{s.views.brand.title}</h1>
        <p className="text-zinc-400 text-sm mt-1 mb-6">{s.views.brand.subtitle}</p>
        <Card className="bg-zinc-900/60 border-zinc-800 max-w-xl">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-4">
              {activeProject?.productImage ? (
                <img
                  src={activeProject.productImage}
                  alt={activeProject.productName ?? ""}
                  className="w-16 h-16 rounded-lg border border-zinc-800 object-contain bg-zinc-950"
                />
              ) : (
                <div className="w-16 h-16 rounded-lg border border-dashed border-zinc-700 flex items-center justify-center text-zinc-600">
                  <Brain className="w-6 h-6" />
                </div>
              )}
              <div>
                <div className="font-semibold">{activeProject?.productName || s.views.brand.notSet}</div>
                <div className="text-xs text-zinc-400">{activeProject?.productUrl || s.views.brand.notSet}</div>
              </div>
            </div>
            <div className="text-sm text-zinc-300">
              <div className="text-xs text-zinc-500 mb-1">{s.views.brand.productDesc}</div>
              {activeProject?.productDesc || s.views.brand.notSet}
            </div>
            <p className="text-xs text-zinc-500">{s.views.brand.editHere}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // settings
  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-10">
      <h1 className="text-2xl font-bold">{s.views.settings.title}</h1>
      <p className="text-zinc-400 text-sm mt-1 mb-6">{s.views.settings.subtitle}</p>
      <div className="space-y-4 max-w-2xl">
        <Card className="bg-zinc-900/60 border-zinc-800">
          <CardContent className="p-6 space-y-2">
            <div className="font-semibold flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-400" />
              {s.views.settings.language}
            </div>
            <p className="text-sm text-zinc-400">{s.views.settings.languageDesc}</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/60 border-zinc-800">
          <CardContent className="p-6 space-y-2">
            <div className="font-semibold">{s.views.settings.pipeline}</div>
            <p className="text-sm text-zinc-400 leading-relaxed">{s.views.settings.pipelineText}</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/60 border-zinc-800">
          <CardContent className="p-6 space-y-2">
            <div className="font-semibold">{s.views.settings.about}</div>
            <p className="text-sm text-zinc-400 leading-relaxed">{s.views.settings.aboutText}</p>
          </CardContent>
        </Card>
        <Button variant="outline" onClick={onExit} className="border-zinc-700">
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
      ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
      : status === "generating" || status === "analyzing" || status === "adapting"
        ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
        : status === "error"
          ? "bg-red-500/15 text-red-400 border-red-500/30"
          : "bg-zinc-800 text-zinc-400 border-zinc-700";
  return (
    <Badge variant="outline" className={`text-[11px] ${cls}`}>
      {label}
    </Badge>
  );
}
