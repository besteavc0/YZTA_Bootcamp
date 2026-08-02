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

const ERP_PROVIDER_OPTIONS: {
  value: ErpProvider;
  label: string;
  description: string;
}[] = [
  {
    value: "csv",
    label: "Demo CSV",
    description:
      "Demo veya test ortamında server üzerinde bulunan CSV dosyasından veri alır.",
  },
  {
    value: "sap_b1",
    label: "SAP Business One",
    description:
      "SAP Business One Service Layer üzerinden müşteri, sipariş ve stok verisi almak için kullanılır.",
  },
  {
    value: "erpnext",
    label: "ERPNext",
    description:
      "ERPNext API üzerinden ERP verilerini ERPilot'a aktarmak için kullanılır.",
  },
  {
    value: "dolibarr",
    label: "Dolibarr",
    description:
      "Dolibarr API üzerinden temel ERP kayıtlarını senkronize etmek için kullanılır.",
  },
  {
    value: "logo",
    label: "Logo",
    description:
      "Logo ERP entegrasyonu için bağlantı bilgilerini saklar.",
  },
];

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

function getProviderDescription(connectorType: ErpProvider) {
  return (
    ERP_PROVIDER_OPTIONS.find((provider) => provider.value === connectorType)
      ?.description ?? ""
  );
}

function getDefaultConnectionName(connectorType: ErpProvider) {
  if (connectorType === "sap_b1") {
    return "SAP Business One Bağlantısı";
  }

  if (connectorType === "erpnext") {
    return "ERPNext Bağlantısı";
  }

  if (connectorType === "dolibarr") {
    return "Dolibarr Bağlantısı";
  }

  if (connectorType === "logo") {
    return "Logo ERP Bağlantısı";
  }

  return "Demo CSV Bağlantısı";
}

export function ErpConnectionCreateForm({
  defaultTenantId,
  isSaving,
  onCancel,
  onSave,
}: ErpConnectionCreateFormProps) {
  const [name, setName] = useState("Demo CSV Bağlantısı");
  const [connectorType, setConnectorType] = useState<ErpProvider>("csv");

  const [entityType, setEntityType] = useState<EntityType>("orders");
  const [filePath, setFilePath] = useState("/tmp/demo-orders.csv");
  const [source, setSource] = useState("csv");

  const [serviceLayerUrl, setServiceLayerUrl] = useState("");
  const [companyDb, setCompanyDb] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [baseUrl, setBaseUrl] = useState("");
  const [apiKey, setApiKey] = useState("");

  function handleConnectorTypeChange(nextConnectorType: ErpProvider) {
    setConnectorType(nextConnectorType);
    setName(getDefaultConnectionName(nextConnectorType));
  }

  function buildConfig() {
    if (connectorType === "csv") {
      return {
        file_path: filePath.trim(),
        entity_type: entityType,
        source: source.trim() || "csv",
        column_mapping: getDefaultColumnMapping(entityType),
      };
    }

    if (connectorType === "sap_b1") {
      return {
        service_layer_url: serviceLayerUrl.trim(),
        company_db: companyDb.trim(),
        username: username.trim(),
        password,
        sync_entities: ["customers", "orders", "inventory"],
      };
    }

    return {
      base_url: baseUrl.trim(),
      api_key: apiKey.trim(),
      sync_entities: ["customers", "orders", "inventory"],
    };
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    onSave({
      tenantId: defaultTenantId.trim(),
      name: name.trim(),
      connectorType,
      config: buildConfig(),
    });
  }

  const isCsvConnection = connectorType === "csv";
  const isSapBusinessOneConnection = connectorType === "sap_b1";
  const isGenericApiConnection =
    connectorType === "erpnext" ||
    connectorType === "dolibarr" ||
    connectorType === "logo";

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-lg border bg-card p-5"
    >
      <div>
        <h2 className="text-lg font-semibold">Yeni ERP Bağlantısı</h2>
        <p className="text-sm text-muted-foreground">
          ERPilot sistemine bağlanacak veri kaynağını seç ve bağlantı bilgilerini gir.
        </p>
      </div>

      <div className="rounded-lg border bg-muted/30 p-4 text-sm">
        <p className="font-medium">Tenant bilgisi otomatik alınır</p>
        <p className="mt-1 text-muted-foreground">
          Bu bağlantı, oturum açan kullanıcının şirket hesabına otomatik
          kaydedilir. Kullanıcının Tenant ID girmesine gerek yoktur.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm">
          <span className="font-medium">Bağlantı Adı</span>
          <input
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Örn: SAP Business One Üretim"
            className="w-full rounded-md border bg-background px-3 py-2"
          />
        </label>

        <label className="space-y-2 text-sm">
          <span className="font-medium">ERP Sistemi</span>
          <select
            value={connectorType}
            onChange={(event) =>
              handleConnectorTypeChange(event.target.value as ErpProvider)
            }
            className="w-full rounded-md border bg-background px-3 py-2"
          >
            {ERP_PROVIDER_OPTIONS.map((provider) => (
              <option key={provider.value} value={provider.value}>
                {provider.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="rounded-lg border bg-background p-4 text-sm">
        <p className="font-medium">
          {ERP_PROVIDER_OPTIONS.find(
            (provider) => provider.value === connectorType
          )?.label ?? "ERP Bağlantısı"}
        </p>
        <p className="mt-1 text-muted-foreground">
          {getProviderDescription(connectorType)}
        </p>
      </div>

      {isCsvConnection ? (
        <div className="space-y-4 rounded-lg border p-4">
          <div>
            <h3 className="text-sm font-semibold">Demo CSV Ayarları</h3>
            <p className="text-sm text-muted-foreground">
              CSV bağlantısı, backend sunucusunun erişebildiği bir dosya
              yolundan veri okur. Demo ortamında örnek yol kullanılabilir.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="font-medium">Veri Tipi</span>
              <select
                value={entityType}
                onChange={(event) =>
                  setEntityType(event.target.value as EntityType)
                }
                className="w-full rounded-md border bg-background px-3 py-2"
              >
                <option value="orders">Siparişler</option>
                <option value="customers">Müşteriler</option>
                <option value="inventory">Stok</option>
              </select>
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-medium">Source</span>
              <input
                value={source}
                onChange={(event) => setSource(event.target.value)}
                placeholder="csv"
                className="w-full rounded-md border bg-background px-3 py-2"
              />
            </label>

            <label className="space-y-2 text-sm md:col-span-2">
              <span className="font-medium">CSV Dosya Yolu</span>
              <input
                required
                value={filePath}
                onChange={(event) => setFilePath(event.target.value)}
                placeholder="/tmp/demo-orders.csv"
                className="w-full rounded-md border bg-background px-3 py-2"
              />
              <span className="block text-xs text-muted-foreground">
                Bu alan kullanıcının bilgisayarındaki dosya yolu değildir.
                Backend sunucusunun erişebildiği server-side CSV dosya yoludur.
                Demo örnek: /tmp/demo-orders.csv
              </span>
            </label>
          </div>
        </div>
      ) : null}

      {isSapBusinessOneConnection ? (
        <div className="space-y-4 rounded-lg border p-4">
          <div>
            <h3 className="text-sm font-semibold">
              SAP Business One Ayarları
            </h3>
            <p className="text-sm text-muted-foreground">
              SAP Business One Service Layer bilgilerini gir. Şifre ve bağlantı
              bilgileri backend tarafında şifreli olarak saklanır.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm md:col-span-2">
              <span className="font-medium">Service Layer URL</span>
              <input
                required
                value={serviceLayerUrl}
                onChange={(event) => setServiceLayerUrl(event.target.value)}
                placeholder="https://sap-server.example.com:50000/b1s/v1"
                className="w-full rounded-md border bg-background px-3 py-2"
              />
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-medium">Company DB</span>
              <input
                required
                value={companyDb}
                onChange={(event) => setCompanyDb(event.target.value)}
                placeholder="SBODEMO"
                className="w-full rounded-md border bg-background px-3 py-2"
              />
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-medium">Kullanıcı Adı</span>
              <input
                required
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="manager"
                className="w-full rounded-md border bg-background px-3 py-2"
              />
            </label>

            <label className="space-y-2 text-sm md:col-span-2">
              <span className="font-medium">Şifre</span>
              <input
                required
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="SAP Business One kullanıcı şifresi"
                className="w-full rounded-md border bg-background px-3 py-2"
              />
            </label>
          </div>
        </div>
      ) : null}

      {isGenericApiConnection ? (
        <div className="space-y-4 rounded-lg border p-4">
          <div>
            <h3 className="text-sm font-semibold">API Bağlantı Ayarları</h3>
            <p className="text-sm text-muted-foreground">
              Seçilen ERP sistemi için API URL ve erişim anahtarı bilgilerini
              gir.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm md:col-span-2">
              <span className="font-medium">API Base URL</span>
              <input
                required
                value={baseUrl}
                onChange={(event) => setBaseUrl(event.target.value)}
                placeholder="https://erp.example.com/api"
                className="w-full rounded-md border bg-background px-3 py-2"
              />
            </label>

            <label className="space-y-2 text-sm md:col-span-2">
              <span className="font-medium">API Key / Token</span>
              <input
                required
                type="password"
                value={apiKey}
                onChange={(event) => setApiKey(event.target.value)}
                placeholder="API erişim anahtarı"
                className="w-full rounded-md border bg-background px-3 py-2"
              />
            </label>
          </div>
        </div>
      ) : null}

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