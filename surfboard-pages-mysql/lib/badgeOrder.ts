type WithName = { name: string };
type WithGroupOrder = { groupOrderIndex?: number | null };

const collator = new Intl.Collator("ja");

const compareName = (a: WithName, b: WithName) => collator.compare(a.name, b.name);

export const sortByBadgeOrder = <T extends WithName & WithGroupOrder>(items: T[]) =>
  [...items].sort((a, b) => {
    const aOrder = Number.isFinite(a.groupOrderIndex) ? Number(a.groupOrderIndex) : Number.MAX_SAFE_INTEGER;
    const bOrder = Number.isFinite(b.groupOrderIndex) ? Number(b.groupOrderIndex) : Number.MAX_SAFE_INTEGER;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return compareName(a, b);
  });

export const sortByName = <T extends WithName>(items: T[]) => [...items].sort(compareName);
