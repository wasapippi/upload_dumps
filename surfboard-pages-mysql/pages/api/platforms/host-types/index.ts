import type { NextApiRequest, NextApiResponse } from "next";
import { execute, query } from "@/lib/db";
import { normalizeName } from "@/lib/normalize";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    const rows = await query<{
      id: number;
      name: string;
      categoryId: number;
      groupOrderIndex: number;
      categoryName: string;
      categoryGroupOrderIndex: number;
    }>(
      `SELECT ht.id, ht.name, ht.categoryId, ht.groupOrderIndex, c.name AS categoryName, c.groupOrderIndex AS categoryGroupOrderIndex
       FROM HostType ht
       INNER JOIN Category c ON c.id = ht.categoryId
       ORDER BY ht.groupOrderIndex ASC, ht.id ASC`
    );
    return res.status(200).json(
      rows.map((x) => ({
        id: x.id,
        name: x.name,
        categoryId: x.categoryId,
        groupOrderIndex: x.groupOrderIndex,
        category: { id: x.categoryId, name: x.categoryName, groupOrderIndex: x.categoryGroupOrderIndex }
      }))
    );
  }

  if (req.method === "POST") {
    const name = String(req.body?.name || "").trim();
    const categoryId = Number(req.body?.categoryId || 0);
    if (!name || !categoryId) return res.status(400).json({ error: "invalid payload" });
    const groupOrderIndex = Number(req.body?.groupOrderIndex || 0);
    const r = await execute(
      "INSERT INTO HostType (name, normalizedName, categoryId, groupOrderIndex, createdAt, updatedAt) VALUES (?, ?, ?, ?, NOW(3), NOW(3))",
      [name, normalizeName(name), categoryId, groupOrderIndex]
    );
    return res.status(200).json({ id: r.insertId, name, categoryId, groupOrderIndex });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
