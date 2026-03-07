import type { NextApiRequest, NextApiResponse } from "next";
import { execute } from "@/lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const hostTypeId = Number(req.body?.hostTypeId || 0);
  const platformIds = Array.isArray(req.body?.platformIds)
    ? req.body.platformIds.map(Number).filter(Boolean)
    : [];

  if (!hostTypeId) return res.status(400).json({ error: "invalid hostTypeId" });

  await execute("DELETE FROM HostTypePlatform WHERE hostTypeId = ?", [hostTypeId]);
  for (const platformId of platformIds) {
    await execute("INSERT INTO HostTypePlatform (hostTypeId, platformId) VALUES (?, ?)", [hostTypeId, platformId]);
  }

  res.status(200).json({ ok: true });
}
