import { Sidebar } from "@/components/layout/Sidebar";
import { AuthReadyGate } from "@/components/auth/AuthReadyGate";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthReadyGate>
    <div className="flex min-h-screen bg-muted/30">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl p-8">{children}</div>
      </main>
    </div>
    </AuthReadyGate>
  );
}