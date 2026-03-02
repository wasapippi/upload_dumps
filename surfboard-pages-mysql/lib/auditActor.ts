const DEV_DEFAULT_ACTOR = "Guest";

type HeaderSource =
  | { headers: { get: (name: string) => string | null } }
  | { headers: Record<string, string | string[] | undefined> };

const pickHeader = (request: HeaderSource, name: string): string | undefined => {
  const headers: any = request.headers;
  if (typeof headers?.get === "function") {
    const value = headers.get(name);
    return value ?? undefined;
  }
  const raw = headers?.[name] ?? headers?.[name.toLowerCase()];
  if (Array.isArray(raw)) return raw[0];
  return raw;
};

export const resolveActorName = (request: HeaderSource) => {
  const candidates = [
    pickHeader(request, "x-actor-name"),
    pickHeader(request, "x-user-name"),
    pickHeader(request, "x-editor-name"),
    pickHeader(request, "x-forwarded-user"),
    pickHeader(request, "x-auth-request-user")
  ];

  for (const candidate of candidates) {
    const name = candidate?.trim();
    if (name) return name;
  }

  if (process.env.NODE_ENV === "development") {
    return DEV_DEFAULT_ACTOR;
  }

  return "Unknown";
};
