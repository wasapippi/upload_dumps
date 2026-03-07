import type { NextApiRequest, NextApiResponse } from "next";
import { query } from "@/lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const hostTypeId = Number(req.query.hostTypeId || 0) || null;
  const platformId = Number(req.query.platformId || 0) || null;

  const where: string[] = ["c.deletedAt IS NULL", "t.kind='COMMAND'"];
  const params: unknown[] = [];

  if (hostTypeId) {
    where.push("c.hostTypeId = ?");
    params.push(hostTypeId);
  }
  if (platformId) {
    where.push("(c.platformId = ? OR c.platformId IS NULL)");
    params.push(platformId);
  }

  const rows = await query<{ id: number; name: string }>(
    `SELECT DISTINCT t.id, t.name
     FROM Command c
     INNER JOIN CommandTag ct ON ct.commandId = c.id
     INNER JOIN Tag t ON t.id = ct.tagId
     WHERE ${where.join(" AND ")}
     ORDER BY t.name ASC`,
    params
  );

  res.status(200).json(rows);
}
