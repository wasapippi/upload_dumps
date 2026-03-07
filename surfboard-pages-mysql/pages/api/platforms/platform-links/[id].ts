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
       VALUES (?, ?, 'LINK', NOW(3), NOW(3))
       ON DUPLICATE KEY UPDATE name = VALUES(name), updatedAt = NOW(3)`,
      [t.name, t.normalizedName]
    );
  }

  return query<{ id: number }>(
    `SELECT id FROM Tag WHERE kind='LINK' AND normalizedName IN (${uniq.map(() => "?").join(",")})`,
    uniq.map((x) => x.normalizedName)
  );
};

const resolveHostTypeIdWithCommonFallback = async (rawHostTypeId: unknown) => {
  const parsed = Number(rawHostTypeId || 0) || null;
  if (parsed) return parsed;
  const rows = await query<{ id: number }>("SELECT id FROM HostType WHERE name = ? ORDER BY id ASC LIMIT 1", ["共通"]);
  return rows[0]?.id ?? null;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const actorName = resolveActorName(req);
  const id = Number(req.query.id);
  if (!id) return res.status(400).json({ error: "invalid id" });

  if (req.method === "PUT") {
    try {
      const body = req.body || {};
      if (body.delete === true) {
        await execute("UPDATE PlatformLink SET deletedAt = NOW(3), updatedAt = NOW(3), updatedBy = ? WHERE id = ?", [actorName, id]);
        return res.status(200).json({ ok: true });
      }
      const resolvedHostTypeId = await resolveHostTypeIdWithCommonFallback(body.hostTypeId);
      if (!resolvedHostTypeId) return res.status(400).json({ error: "共通ホスト種別が見つかりません。" });
      await execute(
        `UPDATE PlatformLink
         SET title=?, urlTemplate=?, commentTemplate=?, platformId=?, vendorId=?, hostTypeId=?, deviceBindingMode=?, updatedBy=?, updatedAt=NOW(3)
         WHERE id = ? AND deletedAt IS NULL`,
        [
          String(body.title || "").trim(),
          String(body.urlTemplate || "").trim(),
          body.commentTemplate ? String(body.commentTemplate) : null,
          body.platformId ? Number(body.platformId) : null,
          body.vendorId ? Number(body.vendorId) : null,
          resolvedHostTypeId,
          body.deviceBindingMode === "EXCLUDE_FROM_DEVICE" ? "EXCLUDE_FROM_DEVICE" : "INCLUDE_IN_DEVICE",
          actorName,
          id
        ]
      );

      await execute("DELETE FROM PlatformLinkTag WHERE platformLinkId = ?", [id]);
      const tags = await ensureTags(Array.isArray(body.tags) ? body.tags : []);
      for (const t of tags) {
        await execute("INSERT IGNORE INTO PlatformLinkTag (platformLinkId, tagId) VALUES (?, ?)", [id, t.id]);
      }

      return res.status(200).json({ ok: true });
    } catch (error: any) {
      if (error?.code === "ER_DATA_TOO_LONG" || error?.errno === 1406) {
        return res.status(400).json({ error: "URLまたはコメントが長すぎます。DBカラム長を拡張してください。" });
      }
      throw error;
    }
  }

  if (req.method === "DELETE") {
    await execute("UPDATE PlatformLink SET deletedAt = NOW(3), updatedAt = NOW(3) WHERE id = ?", [id]);
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
