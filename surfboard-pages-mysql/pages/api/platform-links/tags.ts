import type { NextApiRequest, NextApiResponse } from "next";
import { query } from "@/lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const hostTypeId = Number(req.query.hostTypeId || 0) || null;
  const platformId = Number(req.query.platformId || 0) || null;

  const where: string[] = ["pl.deletedAt IS NULL", "t.kind='LINK'"];
  const params: unknown[] = [];

  if (hostTypeId) {
    where.push("pl.hostTypeId = ?");
    params.push(hostTypeId);
  }
  if (platformId) {
    where.push("(pl.platformId = ? OR pl.platformId IS NULL)");
    params.push(platformId);
  }

  const rows = await query<{ id: number; name: string }>(
    `SELECT DISTINCT t.id, t.name
     FROM PlatformLink pl
     INNER JOIN PlatformLinkTag plt ON plt.platformLinkId = pl.id
     INNER JOIN Tag t ON t.id = plt.tagId
     WHERE ${where.join(" AND ")}
     ORDER BY t.name ASC`,
    params
  );

  res.status(200).json(rows);
}
