"use client";

import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { useLang } from "@/lib/i18n/LanguageProvider";

const STRINGS = {
  ar: {
    welcome: "مرحباً بك في Armoray",
    subtitle: "وكيلك التسويقي الذكي — استنسخ أي إعلان ناجح لمنتجك",
    continueGoogle: "المتابعة عبر Google",
    emailPh: "البريد الإلكتروني",
    continueEmail: "المتابعة عبر البريد",
    or: "أو",
    checkEmail: "تفقد بريدك الإلكتروني",
    codeSent: "أرسلنا كوداً من 4 خانات إلى",
    enterBelow: "أدخله أدناه لتسجيل الدخول.",
    incorrect: "الكود غير صحيح. حاول مجدداً.",
    resend: "إعادة إرسال الكود",
    resendIn: "إعادة الإرسال بعد",
    back: "رجوع",
    privacy: "سياسة الخصوصية",
    terms: "شروط الخدمة",
    googleNote: "الدخول التجريبي — أي بريد يعمل والكود يظهر داخل البطاقة",
    demoCode: "كود الدخول التجريبي",
  },
  en: {
    welcome: "Welcome to Armoray",
    subtitle: "Your AI growth marketer — clone any winning ad for your product",
    continueGoogle: "Continue with Google",
    emailPh: "Email",
    continueEmail: "Continue with email",
    or: "or",
    checkEmail: "Check your email",
    codeSent: "We sent a 4-character code to",
    enterBelow: "Enter it below to sign in.",
    incorrect: "Incorrect code. Please try again.",
    resend: "Resend code",
    resendIn: "Resend in",
    back: "Back",
    privacy: "Privacy Policy",
    terms: "Terms of Service",
    googleNote: "Demo login — any email works, code shown inside the card",
    demoCode: "Demo login code",
  },
  fr: {
    welcome: "Bienvenue sur Armoray",
    subtitle: "Votre marketeur IA — clonez toute pub gagnante pour votre produit",
    continueGoogle: "Continuer avec Google",
    emailPh: "E-mail",
    continueEmail: "Continuer avec l'e-mail",
    or: "ou",
    checkEmail: "Vérifiez votre e-mail",
    codeSent: "Nous avons envoyé un code à 4 caractères à",
    enterBelow: "Saisissez-le ci-dessous pour vous connecter.",
    incorrect: "Code incorrect. Veuillez réessayer.",
    resend: "Renvoyer le code",
    resendIn: "Renvoyer dans",
    back: "Retour",
    privacy: "Politique de confidentialité",
    terms: "Conditions d'utilisation",
    googleNote: "Connexion démo — tout e-mail fonctionne, code affiché dans la carte",
    demoCode: "Code de connexion démo",
  },
};

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

export default function LoginScreen({ onLogin }: { onLogin: (email: string) => void }) {
  const { locale } = useLang();
  const t = STRINGS[locale] ?? STRINGS.en;
  const dir = locale === "ar" ? "rtl" : "ltr";

  const [stage, setStage] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState(["", "", "", ""]);
  const [codeError, setCodeError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [expectedCode, setExpectedCode] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const codeRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const id = setTimeout(() => setResendTimer((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [resendTimer]);

  function generateCode() {
    // demo code (email delivery not configured — shown in the card)
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    return Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  }

  function handleContinueEmail() {
    if (!email.includes("@")) return;
    setBusy(true);
    const c = generateCode();
    setTimeout(() => {
      setExpectedCode(c);
      setCode(["", "", "", ""]);
      setCodeError(false);
      setStage("code");
      setResendTimer(30);
      setBusy(false);
    }, 700);
  }

  function handleResend() {
    if (resendTimer > 0) return;
    const c = generateCode();
    setExpectedCode(c);
    setCode(["", "", "", ""]);
    setCodeError(false);
    setResendTimer(30);
  }

  function handleCodeChange(idx: number, value: string) {
    const v = value.replace(/[^a-zA-Z0-9]/g, "").slice(-1);
    if (!v) return;
    const next = [...code];
    next[idx] = v.toUpperCase();
    setCode(next);
    setCodeError(false);
    if (idx < 3) {
      codeRefs.current[idx + 1]?.focus();
    }
    const joined = next.join("");
    if (joined.length === 4 && !next.includes("")) {
      if (joined === expectedCode) {
        setBusy(true);
        setTimeout(() => onLogin(email), 500);
      } else {
        setCodeError(true);
        setTimeout(() => setCode(["", "", "", ""]), 600);
        codeRefs.current[0]?.focus();
      }
    }
  }

  function handleKeyDown(idx: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !code[idx] && idx > 0) {
      codeRefs.current[idx - 1]?.focus();
      const next = [...code];
      next[idx - 1] = "";
      setCode(next);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4" dir={dir}>
      <div className="w-full max-w-[440px] bg-card rounded-2xl p-10 flex flex-col gap-6 shadow-[0_2px_16px_rgba(0,0,0,0.04)]">
        {stage === "email" ? (
          <>
            {/* header */}
            <div className="flex flex-col gap-1 items-center w-full text-center">
              <div className="w-10 h-10 rounded-xl mb-2 flex items-center justify-center bg-gradient-to-br from-[#593dfa] via-[#2563eb] to-[#c026d3]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M13 2L4.5 13.5H11L10 22L19.5 10H13L13 2Z" fill="white" />
                </svg>
              </div>
              <h1 className="text-3xl font-extrabold text-foreground leading-tight">{t.welcome}</h1>
              <p className="text-[15px] text-muted-foreground leading-snug">{t.subtitle}</p>
            </div>

            {/* Google button — GSI replica (360x44) */}
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => onLogin("demo@gmail.com")}
                className="w-[360px] max-w-full h-11 bg-white border border-[#dadce0] rounded-[4px] flex items-center justify-center gap-3 text-[#3c4043] text-sm font-medium hover:bg-[#f8f9fa] hover:shadow-[0_1px_2px_rgba(60,64,67,0.3)] transition-all"
              >
                <GoogleIcon />
                {t.continueGoogle}
              </button>
            </div>

            {/* divider */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="h-px flex-1 bg-border" />
              {t.or}
              <div className="h-px flex-1 bg-border" />
            </div>

            {/* email */}
            <div className="flex flex-col gap-3">
              <Input
                type="email"
                dir="ltr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleContinueEmail()}
                placeholder={t.emailPh}
                className="h-14 rounded-lg bg-muted border-input text-[16px] px-4 focus-visible:ring-2 focus-visible:ring-ring"
              />
              <Button
                onClick={handleContinueEmail}
                disabled={!email.includes("@") || busy}
                className="btn-pill h-12 w-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : t.continueEmail}
              </Button>
              <p className="text-[11px] text-muted-foreground text-center">{t.googleNote}</p>
            </div>
          </>
        ) : (
          <>
            {/* header */}
            <div className="flex flex-col gap-1 items-center w-full text-center">
              <h1 className="text-3xl font-extrabold text-foreground leading-tight">{t.checkEmail}</h1>
              <p className="text-[15px] text-muted-foreground leading-snug">
                {t.codeSent} <span dir="ltr" className="font-medium text-foreground">{email}</span>. {t.enterBelow}
              </p>
            </div>

            {/* OTP boxes — 4 separate square inputs like Notch */}
            <div className="flex gap-2 items-center justify-center w-full" dir="ltr">
              {code.map((c, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    codeRefs.current[i] = el;
                  }}
                  value={c}
                  onChange={(e) => handleCodeChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  inputMode="text"
                  maxLength={1}
                  autoFocus={i === 0}
                  className={`w-12 h-14 rounded-lg text-center text-lg font-semibold border bg-muted outline-none transition-all
                    ${codeError ? "border-destructive text-destructive" : c ? "border-foreground/40 text-foreground" : "border-input text-foreground"}
                    focus:border-foreground focus:ring-2 focus:ring-ring`}
                />
              ))}
            </div>

            {codeError && <p className="text-sm text-destructive text-center">{t.incorrect}</p>}

            {/* demo code hint */}
            <div className="rounded-lg bg-muted border border-border p-3 text-center">
              <div className="text-[11px] text-muted-foreground mb-0.5">{t.demoCode}</div>
              <div dir="ltr" className="text-xl font-extrabold tracking-[0.4em] text-foreground">{expectedCode}</div>
            </div>

            {/* actions */}
            <div className="flex flex-col gap-2">
              <Button
                onClick={() => code.join("") === expectedCode && onLogin(email)}
                disabled={busy || code.includes("")}
                className="btn-pill h-12 w-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : t.continueEmail}
              </Button>
              <div className="flex items-center justify-between text-sm">
                <button onClick={() => setStage("email")} className="text-muted-foreground hover:text-foreground transition-colors">
                  ← {t.back}
                </button>
                <button
                  onClick={handleResend}
                  disabled={resendTimer > 0}
                  className="text-foreground font-medium hover:underline disabled:text-muted-foreground disabled:no-underline"
                >
                  {resendTimer > 0 ? `${t.resendIn} ${resendTimer}s` : t.resend}
                </button>
              </div>
            </div>
          </>
        )}

        {/* footer links */}
        <div className="flex items-center justify-center gap-5 pt-2">
          <span className="text-[13px] text-muted-foreground hover:text-foreground cursor-pointer transition-colors">{t.privacy}</span>
          <span className="text-[13px] text-muted-foreground hover:text-foreground cursor-pointer transition-colors">{t.terms}</span>
        </div>
      </div>
    </div>
  );
}
