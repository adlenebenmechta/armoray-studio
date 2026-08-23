"use client";

import { useState, useSyncExternalStore } from "react";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import Landing from "@/components/landing/Landing";
import StudioApp from "@/components/studio/StudioApp";

const noopSubscribe = () => () => {};

export default function Home() {
  // hydration-safe: false during SSR and the very first client render, true after
  const hydrated = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  );

  const [userMode, setUserMode] = useState<"landing" | "studio" | null>(null);

  const urlMode =
    hydrated && typeof window !== "undefined" && new URLSearchParams(window.location.search).get("studio") === "1"
      ? ("studio" as const)
      : null;

  const mode: "landing" | "studio" = userMode ?? urlMode ?? "landing";

  return (
    <LanguageProvider>
      {mode === "landing" ? (
        <Landing onEnter={() => setUserMode("studio")} />
      ) : (
        <StudioApp onExit={() => setUserMode("landing")} />
      )}
    </LanguageProvider>
  );
}
