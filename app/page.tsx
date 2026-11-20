import { Suspense } from "react";
import { DashboardInteractive } from "@/components/DashboardInteractive";
import { getAttendances } from "@/services/attendances";
import { getBeneficiaries } from "@/services/beneficiaries";
import { getSupportTypes } from "@/services/supportTypes";

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <p className="text-sm text-zinc-500">Carregando indicadores...</p>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}

async function DashboardContent() {
  const [beneficiaries, attendances, supportTypes] = await Promise.all([
    getBeneficiaries(),
    getAttendances(),
    getSupportTypes(),
  ]);

  const dashboardAttendances = attendances
    .slice()
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
    .map((attendance) => ({
      id: attendance.id,
      type: attendance.type,
      date: attendance.date,
      created_at: attendance.created_at,
      description: attendance.description,
      created_by_name: attendance.created_by_name,
      beneficiaries: attendance.beneficiaries,
    }));

  return (
    <DashboardInteractive
      attendances={dashboardAttendances}
      beneficiaries={beneficiaries.map((beneficiary) => ({
        id: beneficiary.id,
        name: beneficiary.name,
        created_at: beneficiary.created_at,
      }))}
      supportTypes={supportTypes}
    />
  );
}
