import type { Metadata } from "next";
import { Inter, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeApplier } from "@/components/portfolio/theme-applier";
import { db } from "@/lib/db";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const display = Instrument_Serif({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Ramathota Vinay — UI/UX Designer",
    template: "%s · Ramathota Vinay",
  },
  description:
    "UI/UX Designer with 3+ years of experience crafting intuitive, accessible digital products. Specializing in design systems, Figma, and user-centered design.",
  keywords: [
    "UI/UX Designer",
    "Ramathota Vinay",
    "Visual Designer",
    "Figma",
    "Design Systems",
    "User Experience",
    "Product Design",
  ],
  authors: [{ name: "Ramathota Vinay" }],
  openGraph: {
    title: "Ramathota Vinay — UI/UX Designer",
    description:
      "UI/UX Designer with 3+ years crafting intuitive, accessible digital products.",
    type: "profile",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ramathota Vinay — UI/UX Designer",
    description:
      "UI/UX Designer with 3+ years crafting intuitive, accessible digital products.",
  },
  robots: { index: true, follow: true },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Load theme settings from DB (server-side)
  const settings = await db.siteSetting.findUnique({ where: { id: 'singleton' } }).catch(() => null)
  const themeMode = settings?.themeMode || 'system'
  const themeAccent = settings?.themeAccent || null
  const themeSolidColor = settings?.themeSolidColor || null
  const themeGradient = settings?.themeGradient || null

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${display.variable} ${mono.variable} font-sans antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme={themeMode === 'system' ? 'system' : (themeMode as 'light' | 'dark' | 'system')}
          enableSystem
          disableTransitionOnChange
        >
          <ThemeApplier
            themeMode={themeMode}
            themeAccent={themeAccent}
            themeSolidColor={themeSolidColor}
            themeGradient={themeGradient}
          />
          {children}
          <Toaster />
          <SonnerToaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
