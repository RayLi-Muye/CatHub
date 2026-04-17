import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import {
  CatPawOverlay,
  GlassOverlay,
} from "@/components/layout/cat-paw-overlay";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CatHub — AI Cat Digital Twin",
  description:
    "Create a digital identity for your cat. Track health, share stories, build a virtual twin.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full">
        <CatPawOverlay />
        <GlassOverlay />
        <div className="relative z-10 min-h-full flex flex-col" style={{ minHeight: "100dvh" }}>
          <Providers>
            <Navbar />
            <main className="flex-1 flex flex-col">{children}</main>
            <Footer />
          </Providers>
        </div>
      </body>
    </html>
  );
}
