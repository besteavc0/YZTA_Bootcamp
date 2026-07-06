import { UserButton } from "@clerk/nextjs";

export default function DashboardPage() {
  return (
    <main className="min-h-screen p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">ERPilot Dashboard</h1>
        <UserButton />
      </div>

      <p className="mt-4 text-muted-foreground">
        Frontend altyapısı hazır. Sonraki adım: layout ve sidebar.
      </p>
    </main>
  );
}