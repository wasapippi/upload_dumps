export const resolveClientActor = (name?: string | null) => {
  const normalized = (name ?? "").trim();
  return normalized || "Guest";
};

export const buildActorHeader = (name?: string | null) => ({
  "x-surfboard-actor": encodeURIComponent(resolveClientActor(name))
});
