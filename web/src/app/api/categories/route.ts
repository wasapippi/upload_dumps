import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeName } from "@/lib/normalize";

export const GET = async () => {
  const categories = await prisma.category.findMany({
    orderBy: { groupOrderIndex: "asc" }
  });
  return NextResponse.json(categories);
};

export const POST = async (request: NextRequest) => {
  const body = await request.json();
  const name = String(body?.name ?? "").trim();
  if (!name) {
    return NextResponse.json({ error: "name required" }, { status: 400 });
  }

  const normalizedName = normalizeName(name);
  if (!normalizedName) {
    return NextResponse.json({ error: "invalid name" }, { status: 400 });
  }

  const existing = await prisma.category.findUnique({ where: { normalizedName } });
  if (existing) return NextResponse.json(existing);

  const max = await prisma.category.aggregate({ _max: { groupOrderIndex: true } });
  const created = await prisma.category.create({
    data: {
      name,
      normalizedName,
      groupOrderIndex: Number(body?.groupOrderIndex ?? (max._max.groupOrderIndex ?? 0) + 1)
    }
  });
  return NextResponse.json(created);
};

