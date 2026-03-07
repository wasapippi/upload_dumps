import type { NextApiRequest, NextApiResponse } from "next";
import { execute, query } from "@/lib/db";
import { normalizeName } from "@/lib/normalize";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    const rows = await query<{ id: number; name: string }>("SELECT id, name FROM Vendor ORDER BY name ASC");
    return res.status(200).json(rows);
  }

  if (req.method === "POST") {
    const name = String(req.body?.name || "").trim();
    if (!name) return res.status(400).json({ error: "invalid name" });
    await execute(
      "INSERT INTO Vendor (name, normalizedName, createdAt, updatedAt) VALUES (?, ?, NOW(3), NOW(3))",
      [name, normalizeName(name)]
    );
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
