import type { NextApiRequest, NextApiResponse } from "next";
import { execute, query } from "@/lib/db";
import { normalizeName } from "@/lib/normalize";
import { resolveActorName } from "@/lib/auditActor";

const ensureTags = async (names: string[]) => {
  const uniq = Array.from(
    new Map(
      names
        .map((x) => x.trim())
        .filter(Boolean)
        .map((x) => [normalizeName(x), x])
    ).entries()
  )
    .filter(([normalizedName]) => Boolean(normalizedName))
    .map(([normalizedName, name]) => ({ normalizedName, name }));

  if (uniq.length === 0) return [] as Array<{ id: number }>;

  for (const t of uniq) {
    await execute(
      `INSERT INTO Tag (name, normalizedName, kind, createdAt, updatedAt)
       VALUES (?, ?, 'COMMAND', NOW(3), NOW(3))
       ON DUPLICATE KEY UPDATE name = VALUES(name), updatedAt = NOW(3)`,
      [t.name, t.normalizedName]
    );
  }

  return query<{ id: number }>(
    `SELECT id FROM Tag WHERE kind='COMMAND' AND normalizedName IN (${uniq.map(() => "?").join(",")})`,
    uniq.map((x) => x.normalizedName)
  );
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const actorName = resolveActorName(req);
  const id = Number(req.query.id);
  if (!id) return res.status(400).json({ error: "invalid id" });

  if (req.method === "GET") {
    const rows = await query(
      `SELECT c.*, ht.name AS hostTypeName, ht.categoryId, cat.name AS categoryName,
              p.name AS platformName, v.name AS vendorName
       FROM Command c
       INNER JOIN HostType ht ON ht.id = c.hostTypeId
       INNER JOIN Category cat ON cat.id = ht.categoryId
       LEFT JOIN Platform p ON p.id = c.platformId
       LEFT JOIN Vendor v ON v.id = c.vendorId
       WHERE c.id = ? AND c.deletedAt IS NULL`,
      [id]
    );
    if (!rows[0]) return res.status(404).json({ error: "not found" });

    const tags = await query<{ id: number; name: string }>(
      `SELECT t.id, t.name
       FROM CommandTag ct
       INNER JOIN Tag t ON t.id = ct.tagId
       WHERE ct.commandId = ? AND t.kind='COMMAND'`,
      [id]
    );

    const row: any = rows[0];
    return res.status(200).json({
      ...row,
      hostType: {
        id: row.hostTypeId,
        name: row.hostTypeName,
        categoryId: row.categoryId,
        category: { id: row.categoryId, name: row.categoryName }
      },
      platform: row.platformId ? { id: row.platformId, name: row.platformName } : null,
      vendor: row.vendorId ? { id: row.vendorId, name: row.vendorName } : null,
      tags: tags.map((t) => ({ tag: t }))
    });
  }

  if (req.method === "PUT") {
    const body = req.body || {};
    const hostTypeId = Number(body.hostTypeId || 0) || null;
    if (!hostTypeId || !String(body.title || "").trim() || !String(body.commandText || "").trim()) {
      return res.status(400).json({ error: "必須項目が不足しています。" });
    }

    const updated = await execute(
      `UPDATE Command
       SET title = ?, description = ?, commandText = ?, hostTypeId = ?, platformId = ?, vendorId = ?,
           deviceBindingMode = ?, danger = ?, updatedBy = ?, updatedAt = NOW(3)
       WHERE id = ? AND deletedAt IS NULL`,
      [
        String(body.title || "").trim(),
        body.description ? String(body.description) : null,
        String(body.commandText || "").trim(),
        hostTypeId,
        body.platformId ? Number(body.platformId) : null,
        body.vendorId ? Number(body.vendorId) : null,
        body.deviceBindingMode === "EXCLUDE_FROM_DEVICE" ? "EXCLUDE_FROM_DEVICE" : "INCLUDE_IN_DEVICE",
        body.danger ? 1 : 0,
        actorName,
        id
      ]
    );

    if (updated.affectedRows === 0) return res.status(404).json({ error: "not found" });

    await execute("DELETE FROM CommandTag WHERE commandId = ?", [id]);
    const tags = await ensureTags(Array.isArray(body.tags) ? body.tags : []);
    for (const t of tags) {
      await execute("INSERT IGNORE INTO CommandTag (commandId, tagId) VALUES (?, ?)", [id, t.id]);
    }

    return res.status(200).json({ ok: true });
  }

  if (req.method === "DELETE") {
    await execute("UPDATE Command SET deletedAt = NOW(3), updatedAt = NOW(3) WHERE id = ?", [id]);
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
