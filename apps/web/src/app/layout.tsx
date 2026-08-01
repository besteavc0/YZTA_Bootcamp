import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { ReactQueryProvider } from "@/components/providers/ReactQueryProvider";

export const metadata: Metadata = {
  title: "ERPilot",
  description: "AI-powered ERP intelligence layer",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider afterSignOutUrl="/login">
      <html lang="tr">
        <body>
  <ReactQueryProvider>{children}</ReactQueryProvider>
</body>
      </html>
    </ClerkProvider>
  );
}