import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const POST = async (request: NextRequest) => {
  const body = await request.json();
  const hostTypeId = Number(body?.hostTypeId);
  const platformIds = Array.isArray(body?.platformIds)
    ? body.platformIds.map((value: unknown) => Number(value)).filter((value: number) => Number.isFinite(value) && value > 0)
    : [];

  if (!Number.isFinite(hostTypeId) || hostTypeId <= 0) {
    return NextResponse.json({ error: "hostTypeId required" }, { status: 400 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.hostTypePlatform.deleteMany({ where: { hostTypeId } });
    if (platformIds.length > 0) {
      await tx.hostTypePlatform.createMany({
        data: platformIds.map((platformId) => ({ hostTypeId, platformId }))
      });
    }
  });

  return NextResponse.json({ ok: true });
};

