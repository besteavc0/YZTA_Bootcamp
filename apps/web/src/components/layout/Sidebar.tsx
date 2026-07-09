"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton, useUser } from "@clerk/nextjs";
import {
  AlertTriangle,
  BarChart3,
  Bot,
  ClipboardList,
  FileSpreadsheet,
  Home,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";

const mainNavItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: Home,
  },
  {
    title: "AI Asistan",
    href: "/chat",
    icon: Bot,
  },
  {
    title: "Anomaliler",
    href: "/anomalies",
    icon: AlertTriangle,
  },
  {
    title: "Günlük Özet",
    href: "/digest",
    icon: ClipboardList,
  },
  {
    title: "Excel Karşılaştır",
    href: "/excel-compare",
    icon: FileSpreadsheet,
  },
];

const adminNavItems = [
  {
    title: "ERP Ayarları",
    href: "/settings/erp",
    icon: Settings,
  },
  {
    title: "Kullanıcılar",
    href: "/settings/users",
    icon: Users,
  },
  {
    title: "Audit Logları",
    href: "/admin/audit",
    icon: ShieldCheck,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useUser();

  const role = user?.publicMetadata?.role ?? "user";
  const isAdmin = role === "admin";

  return (
    <aside className="flex h-screen w-72 flex-col border-r bg-background">
      <div className="flex h-16 items-center gap-3 border-b px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <BarChart3 className="h-5 w-5" />
        </div>

        <div>
          <p className="text-sm font-semibold">ERPilot</p>
          <p className="text-xs text-muted-foreground">AI ERP Assistant</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {mainNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              ].join(" ")}
            >
              <Icon className="h-4 w-4" />
              {item.title}
            </Link>
          );
        })}

        {isAdmin && (
          <div className="pt-4">
            <p className="px-3 pb-2 text-xs font-medium uppercase text-muted-foreground">
              Admin
            </p>

            {adminNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  ].join(" ")}
                >
                  <Icon className="h-4 w-4" />
                  {item.title}
                </Link>
              );
            })}
          </div>
        )}
      </nav>

      <div className="border-t p-4">
        <div className="flex items-center gap-3">
          <UserButton />

          <div className="min-w-0">
            <p className="truncate text-sm font-medium">
              {user?.fullName ?? "Kullanıcı"}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {user?.primaryEmailAddress?.emailAddress ?? "email yok"}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}