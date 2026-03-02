import type { NextApiRequest, NextApiResponse } from "next";
import { execute, query } from "@/lib/db";
import { normalizeName } from "@/lib/normalize";
import type { Command } from "@/types/domain";

type CommandRow = {
  id: number;
  title: string;
  description: string | null;
  commandText: string;
  danger: number;
  orderIndex: number;
  visibility: "PUBLIC" | "PRIVATE";
  ownerUserId: string | null;
  deviceBindingMode: "INCLUDE_IN_DEVICE" | "EXCLUDE_FROM_DEVICE";
  createdBy: string;
  updatedBy: string;
  updatedAt: string;
  hostTypeId: number;
  hostTypeName: string;
  categoryId: number;
  categoryName: string;
  platformId: number | null;
  platformName: string | null;
  vendorId: number | null;
  vendorName: string | null;
};

type TagRow = { commandId: number; id: number; name: string };

const ensureCommandTags = async (names: string[]) => {
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

  if (uniq.length === 0) return [] as Array<{ id: number; name: string }>;

  for (const t of uniq) {
    await execute(
      `INSERT INTO Tag (name, normalizedName, kind, createdAt, updatedAt)
       VALUES (?, ?, 'COMMAND', NOW(3), NOW(3))
       ON DUPLICATE KEY UPDATE name = VALUES(name), updatedAt = NOW(3)`,
      [t.name, t.normalizedName]
    );
  }

  const rows = await query<{ id: number; name: string }>(
    `SELECT id, name FROM Tag WHERE kind='COMMAND' AND normalizedName IN (${uniq.map(() => "?").join(",")})`,
    uniq.map((x) => x.normalizedName)
  );
  return rows;
};

const listCommands = async (req: NextApiRequest) => {
  const q = String(req.query.q || "").trim();
  const categoryId = Number(req.query.categoryId || 0) || null;
  const hostTypeId = Number(req.query.hostTypeId || 0) || null;
  const platformId = Number(req.query.platformId || 0) || null;
  const vendorId = Number(req.query.vendorId || 0) || null;
  const scope = req.query.scope === "vendor" ? "vendor" : "normal";
  const forDevice = req.query.forDevice === "1";

  const where: string[] = ["c.deletedAt IS NULL"];
  const params: unknown[] = [];

  if (forDevice) where.push("c.deviceBindingMode = 'INCLUDE_IN_DEVICE'");

  if (q) {
    where.push("(c.title LIKE ? OR c.description LIKE ? OR c.commandText LIKE ?)");
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }

  if (scope === "vendor") {
    where.push("c.vendorId IS NOT NULL", "c.platformId IS NULL");
    if (vendorId) {
      where.push("c.vendorId = ?");
      params.push(vendorId);
    }
  } else {
    if (categoryId) {
      where.push("ht.categoryId = ?");
      params.push(categoryId);
    }
    if (hostTypeId) {
      where.push("c.hostTypeId = ?");
      params.push(hostTypeId);
    }
    if (platformId) {
      const selectedPlatform = await query<{ vendorId: number }>("SELECT vendorId FROM Platform WHERE id = ?", [platformId]);
      const selectedVendorId = selectedPlatform[0]?.vendorId ?? null;
      where.push(
        `(
          c.platformId = ?
          OR (c.platformId IS NULL AND c.vendorId IS NULL)
          ${selectedVendorId ? "OR (c.platformId IS NULL AND c.vendorId = ?)" : ""}
        )`
      );
      params.push(platformId);
      if (selectedVendorId) params.push(selectedVendorId);
    }
  }

  const rows = await query<CommandRow>(
    `SELECT
      c.id, c.title, c.description, c.commandText, c.danger, c.orderIndex,
      c.visibility, c.ownerUserId, c.deviceBindingMode, c.createdBy, c.updatedBy, c.updatedAt,
      c.hostTypeId, ht.name AS hostTypeName, ht.categoryId, cat.name AS categoryName,
      c.platformId, p.name AS platformName,
      c.vendorId, v.name AS vendorName
    FROM Command c
    INNER JOIN HostType ht ON ht.id = c.hostTypeId
    INNER JOIN Category cat ON cat.id = ht.categoryId
    LEFT JOIN Platform p ON p.id = c.platformId
    LEFT JOIN Vendor v ON v.id = c.vendorId
    WHERE ${where.join(" AND ")}
    ORDER BY ht.groupOrderIndex ASC, c.platformId ASC, c.orderIndex ASC, c.id ASC`,
    params
  );

  if (rows.length === 0) return [] as Command[];

  const ids = rows.map((x) => x.id);
  const tagRows = await query<TagRow>(
    `SELECT ct.commandId, t.id, t.name
     FROM CommandTag ct
     INNER JOIN Tag t ON t.id = ct.tagId
     WHERE ct.commandId IN (${ids.map(() => "?").join(",")}) AND t.kind = 'COMMAND'`,
    ids
  );

  const tagMap = new Map<number, Array<{ id: number; name: string }>>();
  for (const tr of tagRows) {
    if (!tagMap.has(tr.commandId)) tagMap.set(tr.commandId, []);
    tagMap.get(tr.commandId)!.push({ id: tr.id, name: tr.name });
  }

  return rows.map((r) => ({
    danger: r.danger === 1,
    id: r.id,
    title: r.title,
    description: r.description,
    commandText: r.commandText,
    orderIndex: r.orderIndex,
    visibility: r.visibility,
    ownerUserId: r.ownerUserId,
    deviceBindingMode: r.deviceBindingMode,
    createdBy: r.createdBy,
    updatedBy: r.updatedBy,
    updatedAt: r.updatedAt,
    hostTypeId: r.hostTypeId,
    platformId: r.platformId,
    vendorId: r.vendorId,
    hostType: {
      id: r.hostTypeId,
      name: r.hostTypeName,
      categoryId: r.categoryId,
      groupOrderIndex: 0,
      category: {
        id: r.categoryId,
        name: r.categoryName
      }
    },
    platform: r.platformId ? { id: r.platformId, name: r.platformName ?? "" } : null,
    vendor: r.vendorId ? { id: r.vendorId, name: r.vendorName ?? "" } : null,
    variables: [],
    tags: (tagMap.get(r.id) || []).map((t) => ({ tag: t }))
  })) as unknown as Command[];
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    const data = await listCommands(req);
    return res.status(200).json(data);
  }

  if (req.method === "POST") {
    const body = req.body || {};
    const hostTypeId = Number(body.hostTypeId || 0) || null;
    const platformId = body.platformId ? Number(body.platformId) : null;
    const vendorId = body.vendorId ? Number(body.vendorId) : null;

    if (!hostTypeId || !String(body.title || "").trim() || !String(body.commandText || "").trim()) {
      return res.status(400).json({ error: "必須項目が不足しています。" });
    }

    const maxRows = await query<{ maxOrder: number | null }>(
      "SELECT MAX(orderIndex) AS maxOrder FROM Command WHERE hostTypeId = ? AND ((platformId <=> ?) AND (vendorId <=> ?)) AND deletedAt IS NULL",
      [hostTypeId, platformId, vendorId]
    );
    const orderIndex = Number(maxRows[0]?.maxOrder ?? 0) + 1;

    const result = await execute(
      `INSERT INTO Command
       (title, description, commandText, hostTypeId, platformId, vendorId, visibility, ownerUserId, deviceBindingMode, danger, orderIndex, createdBy, updatedBy, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, 'PUBLIC', NULL, ?, ?, ?, 'Guest', 'Guest', NOW(3), NOW(3))`,
      [
        String(body.title || "").trim(),
        body.description ? String(body.description) : null,
        String(body.commandText || "").trim(),
        hostTypeId,
        platformId,
        vendorId,
        body.deviceBindingMode === "EXCLUDE_FROM_DEVICE" ? "EXCLUDE_FROM_DEVICE" : "INCLUDE_IN_DEVICE",
        body.danger ? 1 : 0,
        orderIndex
      ]
    );

    const commandId = result.insertId;
    const tags = await ensureCommandTags(Array.isArray(body.tags) ? body.tags : []);
    for (const t of tags) {
      await execute(
        "INSERT IGNORE INTO CommandTag (commandId, tagId) VALUES (?, ?)",
        [commandId, t.id]
      );
    }

    return res.status(200).json({ id: commandId });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
