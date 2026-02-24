import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const POST = async (request: Request) => {
  const body = await request.json();
  const items: { id: number; orderIndex: number }[] = body?.items ?? [];

  await prisma.$transaction(
    items.map((item) =>
      prisma.command.update({
        where: { id: item.id },
        data: { orderIndex: item.orderIndex, updatedBy: "demo-user" }
      })
    )
  );

  return NextResponse.json({ ok: true });
};
