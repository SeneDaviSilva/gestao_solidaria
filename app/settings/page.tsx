import { Suspense } from "react";
import { SettingsClient } from "@/components/SettingsClient";
import { getOrganizationSettings } from "@/services/settings";
import { getSupportTypes } from "@/services/supportTypes";

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="py-8 text-center text-sm text-zinc-500">
          Carregando configurações...
        </div>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}

async function SettingsContent() {
  const [supportTypes, orgSettings] = await Promise.all([
    getSupportTypes(),
    getOrganizationSettings(),
  ]);

  return (
    <SettingsClient
      initialOrgSettings={orgSettings}
      initialSupportTypes={supportTypes}
    />
  );
}
