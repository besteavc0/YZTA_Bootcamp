"use client";

import { useState } from "react";

import type {
  CreateErpConnectionPayload,
  ErpProvider,
} from "@/services/erp-connection-service";

type EntityType = "orders" | "customers" | "inventory";

type ErpConnectionCreateFormProps = {
  defaultTenantId: string;
  isSaving: boolean;
  onCancel: () => void;
  onSave: (payload: CreateErpConnectionPayload) => void;
};

function getDefaultColumnMapping(entityType: EntityType) {
  if (entityType === "customers") {
    return {
      external_id: "external_id",
      name: "name",
      city: "city",
      segment: "segment",
    };
  }

  if (entityType === "inventory") {
    return {
      external_id: "external_id",
      product_name: "product_name",
      warehouse: "warehouse",
      quantity: "quantity",
      reorder_level: "reorder_level",
    };
  }

  return {
    external_id: "external_id",
    customer_external_id: "customer_external_id",
    order_date: "order_date",
    total_amount: "total_amount",
    status: "status",
  };
}

export function ErpConnectionCreateForm({
  defaultTenantId,
  isSaving,
  onCancel,
  onSave,
}: ErpConnectionCreateFormProps) {
  const [name, setName] = useState("CSV Demo Orders");
  const [tenantId, setTenantId] = useState(defaultTenantId);
  const [connectorType, setConnectorType] = useState<ErpProvider>("csv");
  const [entityType, setEntityType] = useState<EntityType>("orders");
  const [filePath, setFilePath] = useState("/tmp/demo-orders.csv");
  const [source, setSource] = useState("csv");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    onSave({
      tenantId: tenantId.trim(),
      name: name.trim(),
      connectorType,
      config: {
        file_path: filePath.trim(),
        entity_type: entityType,
        source: source.trim() || "csv",
        column_mapping: getDefaultColumnMapping(entityType),
      },
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-lg border bg-card p-5"
    >
      <div>
        <h2 className="text-lg font-semibold">Yeni ERP Bağlantısı</h2>
        <p className="text-sm text-muted-foreground">
          Demo ortamı için CSV tabanlı ERP bağlantısı oluştur.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm">
          <span className="font-medium">Bağlantı Adı</span>
          <input
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2"
          />
        </label>

        <label className="space-y-2 text-sm">
          <span className="font-medium">Tenant ID</span>
          <input
            required
            value={tenantId}
            onChange={(event) => setTenantId(event.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2"
          />
        </label>

        <label className="space-y-2 text-sm">
          <span className="font-medium">Connector Tipi</span>
          <select
            value={connectorType}
            onChange={(event) => setConnectorType(event.target.value as ErpProvider)}
            className="w-full rounded-md border bg-background px-3 py-2"
          >
            <option value="csv">CSV</option>
            <option value="sap_b1">SAP B1</option>
            <option value="logo">Logo</option>
            <option value="erpnext">ERPNext</option>
            <option value="dolibarr">Dolibarr</option>
          </select>
        </label>

        <label className="space-y-2 text-sm">
          <span className="font-medium">Entity Type</span>
          <select
            value={entityType}
            onChange={(event) => setEntityType(event.target.value as EntityType)}
            className="w-full rounded-md border bg-background px-3 py-2"
          >
            <option value="orders">Siparişler</option>
            <option value="customers">Müşteriler</option>
            <option value="inventory">Stok</option>
          </select>
        </label>

        <label className="space-y-2 text-sm md:col-span-2">
          <span className="font-medium">Dosya Yolu</span>
          <input
            required
            value={filePath}
            onChange={(event) => setFilePath(event.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2"
          />
        </label>

        <label className="space-y-2 text-sm">
          <span className="font-medium">Source</span>
          <input
            value={source}
            onChange={(event) => setSource(event.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2"
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {isSaving ? "Kaydediliyor..." : "Bağlantı Ekle"}
        </button>

        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border px-4 py-2 text-sm font-medium"
        >
          Vazgeç
        </button>
      </div>
    </form>
  );
}