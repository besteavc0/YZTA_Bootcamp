import { UserManagementPanel } from "@/components/users/UserManagementPanel";

export default function UserManagementPage() {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Kullanıcı Yönetimi
        </h1>
        <p className="text-muted-foreground">
          Kullanıcı rollerini, erişim durumlarını ve hesap aktivitelerini yönet.
        </p>
      </div>

      <UserManagementPanel />
    </section>
  );
}