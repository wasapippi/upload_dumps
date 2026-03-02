import type { NextApiRequest, NextApiResponse } from "next";
import { execute } from "@/lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const ids = Array.isArray(req.body?.ids) ? req.body.ids.map(Number).filter(Boolean) : [];
  for (let i = 0; i < ids.length; i += 1) {
    await execute("UPDATE Command SET orderIndex = ? WHERE id = ?", [i + 1, ids[i]]);
  }
  res.status(200).json({ ok: true });
}
