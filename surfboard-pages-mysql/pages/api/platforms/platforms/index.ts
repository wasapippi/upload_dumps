import type { NextApiRequest, NextApiResponse } from "next";
import { execute, query } from "@/lib/db";
import { normalizeName } from "@/lib/normalize";

type Row = {
  id: number;
  name: string;
  vendorId: number;
  vendorName: string;
  hostTypeId: number | null;
};

const list = async () => {
  const rows = await query<Row>(
    `SELECT p.id, p.name, p.vendorId, v.name AS vendorName, htp.hostTypeId
     FROM Platform p
     INNER JOIN Vendor v ON v.id = p.vendorId
     LEFT JOIN HostTypePlatform htp ON htp.platformId = p.id
     ORDER BY p.name ASC, p.id ASC`
  );

  const map = new Map<number, { id: number; name: string; vendorId: number; vendor: { id: number; name: string }; hostTypeLinks: Array<{ hostTypeId: number }> }>();
  for (const row of rows) {
    if (!map.has(row.id)) {
      map.set(row.id, {
        id: row.id,
        name: row.name,
        vendorId: row.vendorId,
        vendor: { id: row.vendorId, name: row.vendorName },
        hostTypeLinks: []
      });
    }
    if (row.hostTypeId) map.get(row.id)!.hostTypeLinks.push({ hostTypeId: row.hostTypeId });
  }

  return Array.from(map.values());
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    return res.status(200).json(await list());
  }

  if (req.method === "POST") {
    const name = String(req.body?.name || "").trim();
    const vendorId = Number(req.body?.vendorId || 0);
    if (!name || !vendorId) return res.status(400).json({ error: "invalid payload" });
    await execute(
      "INSERT INTO Platform (name, normalizedName, vendorId, createdAt, updatedAt) VALUES (?, ?, ?, NOW(3), NOW(3))",
      [name, normalizeName(name), vendorId]
    );
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
