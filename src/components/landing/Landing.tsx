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
  const { dict, locale, setLocale, localeNames } = useLang();
  const t = dict;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* navbar */}
      <header className="sticky top-0 z-50 border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur">
        <div className="max-w-6xl mx-auto flex items-center gap-4 px-4 md:px-6 h-16">
          <a href="#top" className="flex items-center gap-2 font-bold text-lg tracking-tight">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-zinc-950 font-extrabold">
              A
            </span>
            Armoray<span className="text-emerald-400">Studio</span>
          </a>
          <nav className="hidden md:flex items-center gap-6 ms-8 text-sm text-zinc-400">
            <a href="#features" className="hover:text-zinc-100 transition-colors">{t.nav.features}</a>
            <a href="#how" className="hover:text-zinc-100 transition-colors">{t.nav.how}</a>
            <a href="#agents" className="hover:text-zinc-100 transition-colors">{t.nav.agents}</a>
            <a href="#pricing" className="hover:text-zinc-100 transition-colors">{t.nav.pricing}</a>
          </nav>
          <div className="ms-auto flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg bg-zinc-900 border border-zinc-800 p-1">
              <Globe className="w-3.5 h-3.5 text-zinc-500 ms-1" />
              {(["ar", "en", "fr"] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setLocale(l)}
                  className={`text-xs px-2 py-1 rounded-md transition-colors ${
                    locale === l ? "bg-emerald-500/20 text-emerald-400 font-semibold" : "text-zinc-400 hover:text-zinc-100"
                  }`}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
            <Button
              onClick={onEnter}
              className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold hidden sm:inline-flex"
            >
              {t.nav.getStarted}
              <ArrowRight className="w-4 h-4 ms-1 rtl:rotate-180" />
            </Button>
          </div>
        </div>
      </header>

      <main id="top" className="flex-1">
        {/* hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(16,185,129,0.12),transparent)]" />
          <div className="relative max-w-6xl mx-auto px-4 md:px-6 pt-16 md:pt-28 pb-16 md:pb-24 text-center">
            <Badge variant="outline" className="mb-6 border-emerald-500/40 bg-emerald-500/10 text-emerald-400 gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              {t.hero.badge}
            </Badge>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.08] max-w-4xl mx-auto">
              {t.hero.titleA}{" "}
              <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                {t.hero.titleB}
              </span>
            </h1>
            <p className="mt-6 text-zinc-400 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">{t.hero.subtitle}</p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                size="lg"
                onClick={onEnter}
                className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-base px-8 h-12"
              >
                {t.hero.ctaPrimary}
                <ArrowRight className="w-5 h-5 ms-2 rtl:rotate-180" />
              </Button>
              <Button size="lg" variant="outline" className="border-zinc-700 hover:bg-zinc-900 text-base px-8 h-12" asChild>
                <a href="#how">
                  <Play className="w-5 h-5 me-2" />
                  {t.hero.ctaSecondary}
                </a>
              </Button>
            </div>
            <p className="mt-4 text-xs text-zinc-500">{t.hero.demoLabel}</p>

            <div className="mt-14 grid grid-cols-3 gap-4 max-w-2xl mx-auto">
              {t.hero.stats.map((s, i) => (
                <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-900/50 py-4 px-2">
                  <div className="text-xl md:text-3xl font-extrabold text-emerald-400">{s.value}</div>
                  <div className="text-[11px] md:text-xs text-zinc-400 mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* how it works */}
        <section id="how" className="border-t border-zinc-800/60 bg-zinc-900/20">
          <div className="max-w-6xl mx-auto px-4 md:px-6 py-16 md:py-24">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">{t.how.title}</h2>
              <p className="text-zinc-400 mt-3 max-w-xl mx-auto">{t.how.subtitle}</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {t.how.steps.map((step, i) => (
                <div key={i} className="relative rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 hover:border-emerald-500/30 transition-colors">
                  <div className="w-11 h-11 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mb-4 text-emerald-400">
                    {i === 0 ? <Upload className="w-5 h-5" /> : i === 1 ? <BrainCircuit className="w-5 h-5" /> : <Film className="w-5 h-5" />}
                  </div>
                  <div className="text-xs font-bold text-emerald-400 mb-1">{String(i + 1).padStart(2, "0")}</div>
                  <h3 className="font-bold text-lg mb-2">{step.title}</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* features */}
        <section id="features" className="border-t border-zinc-800/60">
          <div className="max-w-6xl mx-auto px-4 md:px-6 py-16 md:py-24">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">{t.features.title}</h2>
              <p className="text-zinc-400 mt-3 max-w-xl mx-auto">{t.features.subtitle}</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-6">
              {t.features.items.map((f, i) => (
                <div key={i} className="rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900/80 to-zinc-950 p-6 md:p-8 hover:border-emerald-500/30 transition-colors">
                  <div className="w-11 h-11 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mb-4 text-emerald-400">
                    {i === 0 ? <BrainCircuit className="w-5 h-5" /> : i === 1 ? <Wand2 className="w-5 h-5" /> : i === 2 ? <Film className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                  </div>
                  <h3 className="font-bold text-lg mb-2">{f.title}</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* agents */}
        <section id="agents" className="border-t border-zinc-800/60 bg-zinc-900/20">
          <div className="max-w-6xl mx-auto px-4 md:px-6 py-16 md:py-24">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">{t.agents.title}</h2>
              <p className="text-zinc-400 mt-3 max-w-xl mx-auto">{t.agents.subtitle}</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {t.agents.items.map((a, i) => (
                <div key={i} className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 text-center hover:border-emerald-500/30 transition-colors">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-emerald-400/20 to-teal-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4">
                    {i === 0 ? <Bot className="w-7 h-7" /> : i === 1 ? <Camera className="w-7 h-7" /> : <Scissors className="w-7 h-7" />}
                  </div>
                  <h3 className="font-bold text-lg">{a.name}</h3>
                  <div className="text-xs text-emerald-400 font-semibold mt-0.5 mb-3">{a.role}</div>
                  <p className="text-sm text-zinc-400 leading-relaxed">{a.desc}</p>
                </div>
              ))}
            </div>
            <div className="mt-10 flex justify-center">
              <Button size="lg" onClick={onEnter} variant="outline" className="border-zinc-700 hover:bg-zinc-900">
                <MessageSquare className="w-5 h-5 me-2" />
                {t.nav.getStarted}
              </Button>
            </div>
          </div>
        </section>

        {/* testimonials */}
        <section className="border-t border-zinc-800/60">
          <div className="max-w-6xl mx-auto px-4 md:px-6 py-16 md:py-24">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-center mb-12">{t.testimonials.title}</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {t.testimonials.items.map((tst, i) => (
                <figure key={i} className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 flex flex-col">
                  <blockquote className="text-sm text-zinc-300 leading-relaxed flex-1">“{tst.quote}”</blockquote>
                  <figcaption className="mt-5 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-sm font-bold">
                      {tst.author.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-semibold">{tst.author}</div>
                      <div className="text-xs text-zinc-500">{tst.role}</div>
                    </div>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        {/* pricing */}
        <section id="pricing" className="border-t border-zinc-800/60 bg-zinc-900/20">
          <div className="max-w-6xl mx-auto px-4 md:px-6 py-16 md:py-24">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">{t.pricing.title}</h2>
              <p className="text-zinc-400 mt-3">{t.pricing.subtitle}</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6 items-stretch">
              {t.pricing.plans.map((plan, i) => (
                <div
                  key={i}
                  className={`relative rounded-2xl border p-6 md:p-8 flex flex-col ${
                    plan.popular
                      ? "border-emerald-500/50 bg-gradient-to-b from-emerald-500/10 to-zinc-950 shadow-[0_0_60px_-20px_rgba(16,185,129,0.3)]"
                      : "border-zinc-800 bg-zinc-900/50"
                  }`}
                >
                  {plan.popular && (
                    <Badge className="absolute -top-3 start-1/2 -translate-x-1/2 rtl:translate-x-1/2 bg-emerald-500 text-zinc-950 font-bold hover:bg-emerald-500">
                      ★
                    </Badge>
                  )}
                  <h3 className="font-bold text-lg">{plan.name}</h3>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold">{plan.price}</span>
                    <span className="text-sm text-zinc-500">{plan.period}</span>
                  </div>
                  <p className="text-sm text-zinc-400 mt-2">{plan.desc}</p>
                  <ul className="mt-6 space-y-2.5 flex-1">
                    {plan.features.map((f, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-zinc-300">
                        <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    onClick={onEnter}
                    className={`mt-8 w-full font-semibold ${
                      plan.popular
                        ? "bg-emerald-500 hover:bg-emerald-400 text-zinc-950"
                        : "bg-zinc-800 hover:bg-zinc-700 text-zinc-100"
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
      <footer className="border-t border-zinc-800/60 bg-zinc-950 mt-auto">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 font-bold">
                <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-zinc-950 font-extrabold text-sm">
                  A
                </span>
                Armoray<span className="text-emerald-400">Studio</span>
              </div>
              <p className="text-sm text-zinc-500 mt-3 leading-relaxed">{t.footer.tagline}</p>
            </div>
            {t.footer.cols.map((col, i) => (
              <div key={i}>
                <div className="text-sm font-semibold mb-3">{col.title}</div>
                <ul className="space-y-2">
                  {col.links.map((link, j) => (
                    <li key={j}>
                      <span className="text-sm text-zinc-500 hover:text-zinc-300 cursor-pointer transition-colors">{link}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-10 pt-6 border-t border-zinc-800/60 text-xs text-zinc-600 text-center">
            © {new Date().getFullYear()} Armoray Studio — {t.footer.rights}
          </div>
        </div>
      </footer>
    </div>
  );
}
