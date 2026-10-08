import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OmniSupport AI - Next-Gen Customer Support & Agent Platform",
  description: "Enterprise-grade AI customer support platform with human escalation, agent desk, and RAG knowledge base.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-emerald-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
