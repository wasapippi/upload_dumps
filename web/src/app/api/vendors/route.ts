import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeName } from "@/lib/normalize";

export const GET = async () => {
  const vendors = await prisma.vendor.findMany({
    orderBy: { name: "asc" }
  });
  return NextResponse.json(vendors);
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

  const existing = await prisma.vendor.findUnique({ where: { normalizedName } });
  if (existing) return NextResponse.json(existing);

  const created = await prisma.vendor.create({
    data: { name, normalizedName }
  });
  return NextResponse.json(created);
};

