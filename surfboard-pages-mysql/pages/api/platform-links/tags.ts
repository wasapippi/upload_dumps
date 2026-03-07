import type { NextApiRequest, NextApiResponse } from "next";
import { query } from "@/lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const scope = req.query.scope === "common" ? "common" : req.query.scope === "vendor" ? "vendor" : "normal";
  const hostTypeId = Number(req.query.hostTypeId || 0) || null;
  const platformId = Number(req.query.platformId || 0) || null;
  const vendorId = Number(req.query.vendorId || 0) || null;

  const where: string[] = ["pl.deletedAt IS NULL", "t.kind='LINK'"];
  const params: unknown[] = [];

  if (hostTypeId) {
    where.push("pl.hostTypeId = ?");
    params.push(hostTypeId);
  }
  if (scope === "vendor") {
    where.push("pl.vendorId IS NOT NULL", "pl.platformId IS NULL");
    if (vendorId) {
      where.push("pl.vendorId = ?");
      params.push(vendorId);
    }
  } else if (scope === "common") {
    where.push("pl.platformId IS NULL", "pl.vendorId IS NULL");
  } else if (platformId) {
    where.push("(pl.platformId = ? OR pl.platformId IS NULL)");
    params.push(platformId);
  } else if (vendorId) {
    where.push("pl.vendorId = ?", "pl.platformId IS NULL");
    params.push(vendorId);
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
