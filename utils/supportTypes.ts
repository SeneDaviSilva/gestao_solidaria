export function sortSupportTypes<T extends { name: string }>(
  supportTypes: readonly T[],
): T[] {
  return [...supportTypes].sort((first, second) => {
    const firstIsOther =
      first.name.trim().toLocaleLowerCase("pt-BR") === "outros";
    const secondIsOther =
      second.name.trim().toLocaleLowerCase("pt-BR") === "outros";

    if (firstIsOther !== secondIsOther) {
      return firstIsOther ? 1 : -1;
    }

    return first.name.localeCompare(second.name, "pt-BR", {
      sensitivity: "base",
    });
  });
}
