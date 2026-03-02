import type { NextApiRequest, NextApiResponse } from "next";
import { execute } from "@/lib/db";
import { normalizeName } from "@/lib/normalize";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const id = Number(req.query.id);
  if (!id) return res.status(400).json({ error: "invalid id" });

  if (req.method === "PUT") {
    const name = String(req.body?.name || "").trim();
    const vendorId = Number(req.body?.vendorId || 0);
    if (!name || !vendorId) return res.status(400).json({ error: "invalid payload" });
    await execute(
      "UPDATE Platform SET name=?, normalizedName=?, vendorId=?, updatedAt=NOW(3) WHERE id=?",
      [name, normalizeName(name), vendorId, id]
    );
    return res.status(200).json({ ok: true });
  }

  if (req.method === "DELETE") {
    await execute("DELETE FROM Platform WHERE id = ?", [id]);
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
