import { ShieldCheck, UserCheck, Users, UserX } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import type { ManagedUser } from "@/services/user-management-service";

type UserManagementSummaryCardsProps = {
  users: ManagedUser[];
};

export function UserManagementSummaryCards({
  users,
}: UserManagementSummaryCardsProps) {
  const totalCount = users.length;
  const adminCount = users.filter((user) => user.role === "admin").length;
  const activeCount = users.filter((user) => user.status === "active").length;
  const inactiveCount = users.filter(
    (user) => user.status === "inactive"
  ).length;

  const cards = [
    {
      title: "Toplam Kullanıcı",
      value: totalCount,
      description: "Sistemde kayıtlı kullanıcı",
      icon: Users,
    },
    {
      title: "Admin",
      value: adminCount,
      description: "Yönetici yetkili hesap",
      icon: ShieldCheck,
    },
    {
      title: "Aktif",
      value: activeCount,
      description: "Erişimi açık hesap",
      icon: UserCheck,
    },
    {
      title: "Pasif",
      value: inactiveCount,
      description: "Erişimi kapalı hesap",
      icon: UserX,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <Card key={card.title}>
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-sm text-muted-foreground">{card.title}</p>
                <p className="mt-2 text-3xl font-bold">{card.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {card.description}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted">
                <Icon className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}