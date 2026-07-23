"use client";

import { useState } from "react";;
import { Save, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  ErpConnection,
  UpdateErpConnectionPayload,
} from "@/services/erp-connection-service";

type ErpConnectionSettingsFormProps = {
  connection: ErpConnection;
  isSaving: boolean;
  onCancel: () => void;
  onSave: (payload: UpdateErpConnectionPayload) => void;
};

export function ErpConnectionSettingsForm({
  connection,
  isSaving,
  onCancel,
  onSave,
}: ErpConnectionSettingsFormProps) {
  const [formValues, setFormValues] = useState<UpdateErpConnectionPayload>({
    name: connection.name,
    description: connection.description,
    host: connection.host,
    companyCode: connection.companyCode,
  });

  function updateField(
    fieldName: keyof UpdateErpConnectionPayload,
    value: string
  ) {
    setFormValues((currentValues) => ({
      ...currentValues,
      [fieldName]: value,
    }));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bağlantı Ayarları</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm">
            <span className="font-medium">Bağlantı Adı</span>
            <input
              value={formValues.name}
              onChange={(event) => updateField("name", event.target.value)}
              className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-medium">Company Code</span>
            <input
              value={formValues.companyCode}
              onChange={(event) =>
                updateField("companyCode", event.target.value)
              }
              className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>
        </div>

        <label className="space-y-2 text-sm">
          <span className="font-medium">Host</span>
          <input
            value={formValues.host}
            onChange={(event) => updateField("host", event.target.value)}
            className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>

        <label className="space-y-2 text-sm">
          <span className="font-medium">Açıklama</span>
          <textarea
            value={formValues.description}
            onChange={(event) =>
              updateField("description", event.target.value)
            }
            rows={3}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>

        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            disabled={isSaving}
            onClick={() => onSave(formValues)}
          >
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "Kaydediliyor..." : "Kaydet"}
          </Button>

          <Button
            type="button"
            variant="outline"
            disabled={isSaving}
            onClick={onCancel}
          >
            <X className="mr-2 h-4 w-4" />
            Vazgeç
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}