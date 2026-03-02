import type { NextApiRequest, NextApiResponse } from "next";
import { execute, query } from "@/lib/db";
import { normalizeName } from "@/lib/normalize";

type Row = {
  id: number;
  title: string;
  urlTemplate: string;
  commentTemplate: string | null;
  platformId: number | null;
  platformName: string | null;
  vendorId: number | null;
  vendorName: string | null;
  hostTypeId: number;
  hostTypeName: string;
  hostTypeCategoryId: number;
  hostTypeCategoryName: string;
  orderIndex: number;
  deviceBindingMode: "INCLUDE_IN_DEVICE" | "EXCLUDE_FROM_DEVICE";
  visibility: "PUBLIC" | "PRIVATE";
  updatedAt: string;
  updatedBy: string;
};

type TagRow = { platformLinkId: number; id: number; name: string };

const ensureLinkTags = async (names: string[]) => {
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

const listLinks = async (req: NextApiRequest) => {
  const q = String(req.query.q || "").trim();
  const hostTypeId = Number(req.query.hostTypeId || 0) || null;
  const platformId = Number(req.query.platformId || 0) || null;
  const vendorId = Number(req.query.vendorId || 0) || null;

  const where: string[] = ["pl.deletedAt IS NULL"];
  const params: unknown[] = [];

  if (q) {
    where.push("(pl.title LIKE ? OR pl.urlTemplate LIKE ? OR pl.commentTemplate LIKE ?)");
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }
  if (hostTypeId) {
    where.push("pl.hostTypeId = ?");
    params.push(hostTypeId);
  }
  if (platformId) {
    const selectedPlatform = await query<{ vendorId: number }>("SELECT vendorId FROM Platform WHERE id = ?", [platformId]);
    const selectedVendorId = selectedPlatform[0]?.vendorId ?? null;
    where.push(
      `(
        pl.platformId = ?
        OR (pl.platformId IS NULL AND pl.vendorId IS NULL)
        ${selectedVendorId ? "OR (pl.platformId IS NULL AND pl.vendorId = ?)" : ""}
      )`
    );
    params.push(platformId);
    if (selectedVendorId) params.push(selectedVendorId);
  } else if (vendorId) {
    where.push("pl.vendorId = ?", "pl.platformId IS NULL");
    params.push(vendorId);
  }

  const rows = await query<Row>(
    `SELECT
      pl.id, pl.title, pl.urlTemplate, pl.commentTemplate,
      pl.platformId, p.name AS platformName,
      pl.vendorId, v.name AS vendorName,
      pl.hostTypeId, ht.name AS hostTypeName, ht.categoryId AS hostTypeCategoryId, c.name AS hostTypeCategoryName,
      pl.orderIndex, pl.deviceBindingMode, pl.visibility, pl.updatedAt, pl.updatedBy
     FROM PlatformLink pl
     INNER JOIN HostType ht ON ht.id = pl.hostTypeId
     INNER JOIN Category c ON c.id = ht.categoryId
     LEFT JOIN Platform p ON p.id = pl.platformId
     LEFT JOIN Vendor v ON v.id = pl.vendorId
     WHERE ${where.join(" AND ")}
     ORDER BY ht.groupOrderIndex ASC, pl.platformId ASC, pl.orderIndex ASC, pl.id ASC`,
    params
  );

  if (rows.length === 0) return [];

  const ids = rows.map((x) => x.id);
  const tagRows = await query<TagRow>(
    `SELECT plt.platformLinkId, t.id, t.name
     FROM PlatformLinkTag plt
     INNER JOIN Tag t ON t.id = plt.tagId
     WHERE plt.platformLinkId IN (${ids.map(() => "?").join(",")}) AND t.kind = 'LINK'`,
    ids
  );

  const tagMap = new Map<number, Array<{ id: number; name: string }>>();
  for (const tr of tagRows) {
    if (!tagMap.has(tr.platformLinkId)) tagMap.set(tr.platformLinkId, []);
    tagMap.get(tr.platformLinkId)!.push({ id: tr.id, name: tr.name });
  }

  return rows.map((r) => ({
    ...r,
    hostType: {
      id: r.hostTypeId,
      name: r.hostTypeName,
      categoryId: r.hostTypeCategoryId,
      groupOrderIndex: 0,
      category: {
        id: r.hostTypeCategoryId,
        name: r.hostTypeCategoryName
      }
    },
    platform: r.platformId ? { id: r.platformId, name: r.platformName } : null,
    vendor: r.vendorId ? { id: r.vendorId, name: r.vendorName } : null,
    tags: (tagMap.get(r.id) || []).map((tag) => ({ tag })),
    resolvedUrl: r.urlTemplate,
    resolvedComment: r.commentTemplate
  }));
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    return res.status(200).json(await listLinks(req));
  }

  if (req.method === "POST") {
    const body = req.body || {};
    const hostTypeId = Number(body.hostTypeId || 0) || null;
    const platformId = body.platformId ? Number(body.platformId) : null;
    const vendorId = body.vendorId ? Number(body.vendorId) : null;
    if (!hostTypeId || (!platformId && !vendorId)) {
      return res.status(400).json({ error: "hostTypeId と platformId または vendorId は必須です。" });
    }

    const maxRows = await query<{ maxOrder: number | null }>(
      "SELECT MAX(orderIndex) AS maxOrder FROM PlatformLink WHERE hostTypeId = ? AND ((platformId <=> ?) AND (vendorId <=> ?)) AND deletedAt IS NULL",
      [hostTypeId, platformId, vendorId]
    );

    const result = await execute(
      `INSERT INTO PlatformLink
       (title, urlTemplate, commentTemplate, platformId, vendorId, hostTypeId, visibility, ownerUserId, deviceBindingMode, orderIndex, createdBy, updatedBy, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, 'PUBLIC', NULL, ?, ?, 'Guest', 'Guest', NOW(3), NOW(3))`,
      [
        String(body.title || "").trim(),
        String(body.urlTemplate || "").trim(),
        body.commentTemplate ? String(body.commentTemplate) : null,
        platformId,
        vendorId,
        hostTypeId,
        body.deviceBindingMode === "EXCLUDE_FROM_DEVICE" ? "EXCLUDE_FROM_DEVICE" : "INCLUDE_IN_DEVICE",
        Number(maxRows[0]?.maxOrder ?? 0) + 1
      ]
    );

    const tags = await ensureLinkTags(Array.isArray(body.tags) ? body.tags : []);
    for (const t of tags) {
      await execute("INSERT IGNORE INTO PlatformLinkTag (platformLinkId, tagId) VALUES (?, ?)", [result.insertId, t.id]);
    }

    return res.status(200).json({ id: result.insertId });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
