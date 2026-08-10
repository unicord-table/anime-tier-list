import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Tierist — anime tier lists",
  description:
    "Build, save, and share anime tier lists. Search AniList or import a public list, drag titles into tiers, export a save file.",
};

/**
 * `overflow-hidden` used to live on `<body>` because the only route was the
 * editor, an app shell that must not scroll. The landing page is a scrolling
 * document, so the clip moved down to the editor's own root element in
 * `TierListApp` — a nested layout cannot restyle `<body>`, and a route group
 * whose only job is one class is a directory for nothing.
 */

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="h-full">
        <ConvexClientProvider>{children}</ConvexClientProvider>
        <Analytics />
      </body>
    </html>
  );
}
