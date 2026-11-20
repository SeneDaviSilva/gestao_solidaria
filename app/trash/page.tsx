import { Suspense } from "react";
import { TrashClient } from "@/components/TrashClient";
import { getTrashItems } from "@/services/trash";

export default function TrashPage() {
  return (
    <Suspense
      fallback={
        <p className="text-sm text-zinc-500">Carregando lixeira...</p>
      }
    >
      <TrashContent />
    </Suspense>
  );
}

async function TrashContent() {
  const trashItems = await getTrashItems();
  return <TrashClient initialTrash={trashItems} />;
}
