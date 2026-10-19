import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Skiggo — Get It Done.", template: "%s | Skiggo" },
  description: "Find the right professional for your job, compare your options, and get the work done with Skiggo.",
  applicationName: "Skiggo",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
