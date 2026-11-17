export type OrganizationExcelSettings = {
  org_name?: string;
  cnpj?: string;
  city?: string;
};

export function getOrganizationHeaderRows(
  orgSettings?: OrganizationExcelSettings,
): (string | number | boolean)[][] {
  const orgName = orgSettings?.org_name?.trim();
  const cnpj = orgSettings?.cnpj?.trim();
  const city = orgSettings?.city?.trim();

  if (!orgName && !cnpj && !city) {
    return [];
  }

  return [
    [orgName || "Gestão Solidária"],
    [
      `CNPJ: ${cnpj || "Não informado"} | Cidade: ${
        city || "Não informada"
      } | Emitido em: ${new Date().toLocaleDateString("pt-BR")}`,
    ],
    [],
  ];
}
