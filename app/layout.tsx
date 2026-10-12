import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "CORAL — Research Lab", description: "A real-time Vancouver research console for algorithms, paper composition, lab architecture, findings, and traces.", icons: { icon: "/favicon.svg" } };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
