import type { ErpProvider } from "@/services/erp-connection-service";

type ErpProviderBadgeProps = {
  provider: ErpProvider;
};

const providerMap: Record<ErpProvider, string> = {
  csv: "CSV",
  sap: "SAP",
  sap_b1: "SAP B1",
  logo: "Logo",
  mikro: "Mikro",
  erpnext: "ERPNext",
  dolibarr: "Dolibarr",
};

export function ErpProviderBadge({ provider }: ErpProviderBadgeProps) {
  return (
    <span className="inline-flex items-center rounded-md bg-muted px-2.5 py-1 text-xs font-medium">
      {providerMap[provider]}
    </span>
  );
}