import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "CORAL — Research Lab", description: "Discover algorithms, compose research, and design an emergent software lab with evidence at every step.", icons: { icon: "/favicon.svg" } };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
