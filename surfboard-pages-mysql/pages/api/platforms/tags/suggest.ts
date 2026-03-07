import type { NextApiRequest, NextApiResponse } from "next";
import { query } from "@/lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const q = String(req.query.q || "").trim();
  const scope = req.query.scope === "link" ? "LINK" : "COMMAND";

  const rows = await query<{ id: number; name: string }>(
    `SELECT id, name FROM Tag
     WHERE kind = ? AND (? = '' OR name LIKE ?)
     ORDER BY name ASC
     LIMIT 50`,
    [scope, q, `%${q}%`]
  );

  res.status(200).json(rows);
}
