"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Play,
  Upload,
  BrainCircuit,
  Wand2,
  Film,
  ShieldCheck,
  ArrowRight,
  Check,
  Globe,
  MessageSquare,
  Bot,
  Camera,
  Scissors,
} from "lucide-react";
import { useLang } from "@/lib/i18n/LanguageProvider";

export default function Landing({ onEnter }: { onEnter: () => void }) {
  const { dict, locale, setLocale } = useLang();
  const t = dict;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* navbar — Notch style: light, minimal, black pill CTA */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex items-center gap-4 px-4 md:px-6 h-16">
          <a href="#top" className="flex items-center gap-2 font-extrabold text-lg tracking-tight">
            <span className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-[#593dfa] via-[#2563eb] to-[#c026d3]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M13 2L4.5 13.5H11L10 22L19.5 10H13L13 2Z" fill="white" />
              </svg>
            </span>
            Armoray<span className="notch-gradient">Studio</span>
          </a>
          <nav className="hidden md:flex items-center gap-6 ms-8 text-sm text-muted-foreground font-medium">
            <a href="#features" className="hover:text-foreground transition-colors">{t.nav.features}</a>
            <a href="#how" className="hover:text-foreground transition-colors">{t.nav.how}</a>
            <a href="#agents" className="hover:text-foreground transition-colors">{t.nav.agents}</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">{t.nav.pricing}</a>
          </nav>
          <div className="ms-auto flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-full bg-card border border-border p-1">
              <Globe className="w-3.5 h-3.5 text-muted-foreground ms-2" />
              {(["ar", "en", "fr"] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setLocale(l)}
                  className={`text-xs px-2.5 py-1 rounded-full transition-colors font-semibold ${
                    locale === l ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
            <Button
              onClick={onEnter}
              className="btn-pill h-10 px-6 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {t.nav.getStarted}
              <ArrowRight className="w-4 h-4 ms-1 rtl:rotate-180" />
            </Button>
          </div>
        </div>
      </header>

      <main id="top" className="flex-1">
        {/* hero — light, centered, extrabold like usenotch.ai */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(50%_40%_at_50%_0%,rgba(89,61,250,0.07),transparent)]" />
          <div className="relative max-w-6xl mx-auto px-4 md:px-6 pt-16 md:pt-28 pb-16 md:pb-24 text-center">
            <Badge variant="outline" className="mb-6 border-border bg-card text-muted-foreground gap-1.5 rounded-full px-3 py-1">
              <Sparkles className="w-3.5 h-3.5 text-[#593dfa]" />
              {t.hero.badge}
            </Badge>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.08] max-w-4xl mx-auto">
              {t.hero.titleA}{" "}
              <span className="notch-gradient">{t.hero.titleB}</span>
            </h1>
            <p className="mt-6 text-muted-foreground text-base md:text-lg max-w-2xl mx-auto leading-relaxed">{t.hero.subtitle}</p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                size="lg"
                onClick={onEnter}
                className="btn-pill h-14 px-9 bg-primary text-primary-foreground hover:bg-primary/90 text-base"
              >
                {t.hero.ctaPrimary}
                <ArrowRight className="w-5 h-5 ms-2 rtl:rotate-180" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="btn-pill h-14 px-9 bg-card border-border hover:bg-accent text-base"
                asChild
              >
                <a href="#how">
                  <Play className="w-5 h-5 me-2" />
                  {t.hero.ctaSecondary}
                </a>
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">{t.hero.demoLabel}</p>

            {/* product preview card — white rounded-2xl like Notch app surfaces */}
            <div className="mt-14 mx-auto max-w-3xl rounded-2xl bg-card border border-border shadow-[0_8px_40px_rgba(0,0,0,0.06)] p-6 md:p-8 text-start">
              <div className="flex items-center gap-3 pb-4 border-b border-border">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#593dfa] to-[#c026d3] flex items-center justify-center text-white text-sm font-bold">
                  N
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold">Nova</div>
                  <div className="text-xs text-muted-foreground">{t.studio.chat.agentRole} · online</div>
                </div>
                <Badge variant="outline" className="ms-auto rounded-full text-[11px] border-border text-muted-foreground">
                  {t.studio.status.analyzed}
                </Badge>
              </div>
              <div className="pt-4 space-y-3">
                <div className="max-w-[80%] rounded-2xl rounded-ts-sm bg-muted px-4 py-3 text-sm">
                  {t.studio.chat.videoAttached} 🎬 → “{t.studio.chat.suggestions.recreate}”
                </div>
                <div className="ms-auto max-w-[80%] rounded-2xl rounded-te-sm bg-primary text-primary-foreground px-4 py-3 text-sm font-medium">
                  {t.studio.chat.analyzedIntro}
                </div>
                <div className="rounded-xl border border-border bg-background p-3">
                  <div className="flex h-8 rounded-lg overflow-hidden border border-border text-[10px] font-bold" dir="ltr">
                    <div className="bg-[#593dfa] text-white flex items-center justify-center" style={{ width: "30%" }}>Hook</div>
                    <div className="bg-[#2563eb] text-white flex items-center justify-center" style={{ width: "45%" }}>Demo</div>
                    <div className="bg-[#c026d3] text-white flex items-center justify-center" style={{ width: "25%" }}>CTA</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-12 grid grid-cols-3 gap-3 md:gap-4 max-w-2xl mx-auto">
              {t.hero.stats.map((s, i) => (
                <div key={i} className="rounded-2xl bg-card border border-border py-5 px-2">
                  <div className="text-xl md:text-3xl font-extrabold">{s.value}</div>
                  <div className="text-[11px] md:text-xs text-muted-foreground mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* how it works — numbered white cards */}
        <section id="how" className="border-t border-border/60 bg-card/50">
          <div className="max-w-6xl mx-auto px-4 md:px-6 py-16 md:py-24">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">{t.how.title}</h2>
              <p className="text-muted-foreground mt-3 max-w-xl mx-auto">{t.how.subtitle}</p>
            </div>
            <div className="grid md:grid-cols-3 gap-5">
              {t.how.steps.map((step, i) => (
                <div key={i} className="relative rounded-2xl bg-card border border-border p-6 md:p-8 hover:shadow-[0_8px_30px_rgba(0,0,0,0.05)] transition-shadow">
                  <div className="w-11 h-11 rounded-xl bg-muted border border-border flex items-center justify-center mb-4 text-foreground">
                    {i === 0 ? <Upload className="w-5 h-5" /> : i === 1 ? <BrainCircuit className="w-5 h-5" /> : <Film className="w-5 h-5" />}
                  </div>
                  <div className="text-xs font-extrabold text-muted-foreground mb-1">{String(i + 1).padStart(2, "0")}</div>
                  <h3 className="font-extrabold text-lg mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* features — 2x2 grid */}
        <section id="features" className="border-t border-border/60">
          <div className="max-w-6xl mx-auto px-4 md:px-6 py-16 md:py-24">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">{t.features.title}</h2>
              <p className="text-muted-foreground mt-3 max-w-xl mx-auto">{t.features.subtitle}</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-5">
              {t.features.items.map((f, i) => (
                <div key={i} className="rounded-2xl bg-card border border-border p-6 md:p-8 hover:shadow-[0_8px_30px_rgba(0,0,0,0.05)] transition-shadow">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 text-white"
                    style={{
                      background: [
                        "linear-gradient(135deg,#593dfa,#2563eb)",
                        "linear-gradient(135deg,#2563eb,#c026d3)",
                        "linear-gradient(135deg,#c026d3,#d54123)",
                        "linear-gradient(135deg,#d54123,#f59e0b)",
                      ][i % 4],
                    }}
                  >
                    {i === 0 ? <BrainCircuit className="w-5 h-5" /> : i === 1 ? <Wand2 className="w-5 h-5" /> : i === 2 ? <Film className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                  </div>
                  <h3 className="font-extrabold text-lg mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* agents — centered cards */}
        <section id="agents" className="border-t border-border/60 bg-card/50">
          <div className="max-w-6xl mx-auto px-4 md:px-6 py-16 md:py-24">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">{t.agents.title}</h2>
              <p className="text-muted-foreground mt-3 max-w-xl mx-auto">{t.agents.subtitle}</p>
            </div>
            <div className="grid md:grid-cols-3 gap-5">
              {t.agents.items.map((a, i) => (
                <div key={i} className="rounded-2xl bg-card border border-border p-6 text-center hover:shadow-[0_8px_30px_rgba(0,0,0,0.05)] transition-shadow">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-muted border border-border flex items-center justify-center text-foreground mb-4">
                    {i === 0 ? <Bot className="w-7 h-7" /> : i === 1 ? <Camera className="w-7 h-7" /> : <Scissors className="w-7 h-7" />}
                  </div>
                  <h3 className="font-extrabold text-lg">{a.name}</h3>
                  <div className="text-xs font-bold mt-0.5 mb-3" style={{ color: ["#593dfa", "#2563eb", "#c026d3"][i % 3] }}>
                    {a.role}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{a.desc}</p>
                </div>
              ))}
            </div>
            <div className="mt-10 flex justify-center">
              <Button size="lg" onClick={onEnter} className="btn-pill h-13 px-8 bg-primary text-primary-foreground hover:bg-primary/90 py-3.5">
                <MessageSquare className="w-5 h-5 me-2" />
                {t.nav.getStarted}
              </Button>
            </div>
          </div>
        </section>

        {/* testimonials */}
        <section className="border-t border-border/60">
          <div className="max-w-6xl mx-auto px-4 md:px-6 py-16 md:py-24">
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-center mb-12">{t.testimonials.title}</h2>
            <div className="grid md:grid-cols-3 gap-5">
              {t.testimonials.items.map((tst, i) => (
                <figure key={i} className="rounded-2xl bg-card border border-border p-6 flex flex-col">
                  <blockquote className="text-sm text-muted-foreground leading-relaxed flex-1">“{tst.quote}”</blockquote>
                  <figcaption className="mt-5 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-muted border border-border flex items-center justify-center text-foreground text-sm font-bold">
                      {tst.author.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-bold">{tst.author}</div>
                      <div className="text-xs text-muted-foreground">{tst.role}</div>
                    </div>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        {/* pricing — popular card elevated */}
        <section id="pricing" className="border-t border-border/60 bg-card/50">
          <div className="max-w-6xl mx-auto px-4 md:px-6 py-16 md:py-24">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">{t.pricing.title}</h2>
              <p className="text-muted-foreground mt-3">{t.pricing.subtitle}</p>
            </div>
            <div className="grid md:grid-cols-3 gap-5 items-stretch">
              {t.pricing.plans.map((plan, i) => (
                <div
                  key={i}
                  className={`relative rounded-2xl border p-6 md:p-8 flex flex-col ${
                    plan.popular
                      ? "border-foreground bg-card shadow-[0_16px_60px_rgba(0,0,0,0.1)] md:-translate-y-2"
                      : "border-border bg-card"
                  }`}
                >
                  {plan.popular && (
                    <Badge className="absolute -top-3 start-1/2 -translate-x-1/2 rtl:translate-x-1/2 rounded-full bg-primary text-primary-foreground font-bold hover:bg-primary">
                      ★
                    </Badge>
                  )}
                  <h3 className="font-extrabold text-lg">{plan.name}</h3>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold">{plan.price}</span>
                    <span className="text-sm text-muted-foreground">{plan.period}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">{plan.desc}</p>
                  <ul className="mt-6 space-y-2.5 flex-1">
                    {plan.features.map((f, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Check className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "#593dfa" }} />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    onClick={onEnter}
                    className={`mt-8 w-full btn-pill h-12 ${
                      plan.popular
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "bg-secondary text-foreground hover:bg-accent"
                    }`}
                  >
                    {plan.cta}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* footer */}
      <footer className="border-t border-border/60 bg-card/60 mt-auto">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 font-extrabold">
                <span className="w-7 h-7 rounded-lg flex items-center justify-center bg-gradient-to-br from-[#593dfa] via-[#2563eb] to-[#c026d3]">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M13 2L4.5 13.5H11L10 22L19.5 10H13L13 2Z" fill="white" />
                  </svg>
                </span>
                Armoray<span className="notch-gradient">Studio</span>
              </div>
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{t.footer.tagline}</p>
            </div>
            {t.footer.cols.map((col, i) => (
              <div key={i}>
                <div className="text-sm font-bold mb-3">{col.title}</div>
                <ul className="space-y-2">
                  {col.links.map((link, j) => (
                    <li key={j}>
                      <span className="text-sm text-muted-foreground hover:text-foreground cursor-pointer transition-colors">{link}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-10 pt-6 border-t border-border/60 text-xs text-muted-foreground text-center">
            © {new Date().getFullYear()} Armoray Studio — {t.footer.rights}
          </div>
        </div>
      </footer>
    </div>
  );
}
