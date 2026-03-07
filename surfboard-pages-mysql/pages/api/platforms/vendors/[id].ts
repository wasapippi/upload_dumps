import type { NextApiRequest, NextApiResponse } from "next";
import { execute } from "@/lib/db";
import { normalizeName } from "@/lib/normalize";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const id = Number(req.query.id);
  if (!id) return res.status(400).json({ error: "invalid id" });

  if (req.method === "PUT") {
    if (req.body?.delete === true) {
      await execute("DELETE FROM Vendor WHERE id=?", [id]);
      return res.status(200).json({ ok: true });
    }

    const name = String(req.body?.name || "").trim();
    if (!name) return res.status(400).json({ error: "invalid name" });
    await execute("UPDATE Vendor SET name=?, normalizedName=?, updatedAt=NOW(3) WHERE id=?", [name, normalizeName(name), id]);
    return res.status(200).json({ ok: true });
  }

  if (req.method === "DELETE") {
    await execute("DELETE FROM Vendor WHERE id=?", [id]);
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
