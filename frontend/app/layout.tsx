import type { Metadata, Viewport } from "next";
import { Outfit, Inter } from "next/font/google";
import { SessionProvider } from "@/context/SessionContext";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "What Should We Watch - Real-Time Movie Matcher",
  description: "Swipe, match, and decide on movies with your group in real-time.",
  applicationName: "What Should We Watch",
  keywords: ["movie picker", "tinder for movies", "group decision", "tmdb", "film night"],
  authors: [{ name: "What Should We Watch Team" }],
};

export const viewport: Viewport = {
  themeColor: "#0a0d14",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${outfit.variable} ${inter.variable} h-full antialiased dark`}
    >
      <body
        suppressHydrationWarning
        className="min-h-full flex flex-col cinema-ambient-bg text-text-main bg-bg-base font-sans selection:bg-brand-indigo/30 selection:text-white"
      >
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
