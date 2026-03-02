import { NextRequest } from "next/server";

const DEV_DEFAULT_ACTOR = "Guest";

export const resolveActorName = (request: NextRequest) => {
  const candidates = [
    request.headers.get("x-user-name"),
    request.headers.get("x-editor-name"),
    request.headers.get("x-forwarded-user"),
    request.headers.get("x-auth-request-user")
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

