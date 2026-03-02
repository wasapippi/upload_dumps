import type { NextApiRequest, NextApiResponse } from "next";
import type { Command } from "@/types/domain";
import commandsHandler from "./index";

// pages/api/commands?forDevice=1 を再利用
export default async function handler(req: NextApiRequest, res: NextApiResponse<Command[] | { error: string }>) {
  req.query.forDevice = "1";
  return commandsHandler(req, res);
}
