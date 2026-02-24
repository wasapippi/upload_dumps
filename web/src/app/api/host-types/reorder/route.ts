import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const POST = async (request: Request) => {
  const body = await request.json();
  const items: { id: number; groupOrderIndex: number }[] = body?.items ?? [];

  await prisma.$transaction(
    items.map((item) =>
      prisma.hostType.update({
        where: { id: item.id },
        data: { groupOrderIndex: item.groupOrderIndex }
      })
    )
  );

  return NextResponse.json({ ok: true });
};
