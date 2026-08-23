"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import Landing from "@/components/landing/Landing";
import StudioApp from "@/components/studio/StudioApp";
import LoginScreen from "@/components/auth/LoginScreen";

const noopSubscribe = () => () => {};

export default function Home() {
  // hydration-safe: false during SSR and the very first client render, true after
  const hydrated = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  );

  // restore session — hydration-safe via useSyncExternalStore snapshot
  const savedAuth = useSyncExternalStore(
    noopSubscribe,
    () => (typeof window !== "undefined" ? window.localStorage.getItem("armoray-auth") : null),
    () => null
  );

  const [userMode, setUserMode] = useState<"landing" | "login" | "studio" | null>(null);

  const handleLogin = useCallback((email: string) => {
    try {
      window.localStorage.setItem("armoray-auth", email);
    } catch {}
    setUserMode("studio");
  }, []);

  const handleLogout = useCallback(() => {
    try {
      window.localStorage.removeItem("armoray-auth");
    } catch {}
    setUserMode("landing");
  }, []);

  const urlMode =
    hydrated && typeof window !== "undefined" && new URLSearchParams(window.location.search).get("studio") === "1"
      ? ("studio" as const)
      : null;

  const activeMode: "landing" | "login" | "studio" =
    userMode ?? (savedAuth ? "studio" : null) ?? urlMode ?? "landing";

  return (
    <LanguageProvider>
      {activeMode === "landing" ? (
        <Landing onEnter={() => setUserMode("login")} />
      ) : activeMode === "login" ? (
        <LoginScreen onLogin={handleLogin} />
      ) : (
        <StudioApp onExit={handleLogout} />
      )}
    </LanguageProvider>
  );
}
