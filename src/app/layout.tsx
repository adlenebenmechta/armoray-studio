import type { Metadata } from "next";
import { Inter, Geist_Mono, Noto_Sans_Arabic } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoArabic = Noto_Sans_Arabic({
  variable: "--font-noto-arabic",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Armoray Studio — AI Ad Cloning Platform",
  description:
    "Clone any winning video ad for your product in minutes. Multilingual (العربية / English / Français) AI agents that analyze, rewrite and regenerate video ads for your brand.",
  keywords: ["AI ads", "video cloning", "ad generator", "UGC ads", "AI video", "إعلانات الذكاء الاصطناعي"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${geistMono.variable} ${notoArabic.variable} antialiased bg-background text-foreground`}
        style={{
          fontFamily:
            "var(--font-inter), var(--font-noto-arabic), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        }}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
