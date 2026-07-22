import type { ErpProvider } from "@/services/erp-connection-service";

type ErpProviderBadgeProps = {
  provider: ErpProvider;
};

const providerMap: Record<ErpProvider, string> = {
  sap: "SAP",
  logo: "Logo",
  mikro: "Mikro",
};

export function ErpProviderBadge({ provider }: ErpProviderBadgeProps) {
  return (
    <span className="inline-flex items-center rounded-md bg-muted px-2.5 py-1 text-xs font-medium">
      {providerMap[provider]}
    </span>
  );
}