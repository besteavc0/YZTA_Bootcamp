import type { Metadata } from "next";
import { AppProviders } from "../components/providers/ReactQueryProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "ERPilot",
  description: "ERPilot Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}