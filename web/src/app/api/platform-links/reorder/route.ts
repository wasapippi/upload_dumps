import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveActorName } from "@/lib/auditActor";

export const POST = async (request: NextRequest) => {
  const actorName = resolveActorName(request);
  const body = await request.json();
  const ids = Array.isArray(body?.ids) ? body.ids.map((item: unknown) => Number(item)).filter(Number.isFinite) : [];
  if (ids.length === 0) {
    return NextResponse.json({ error: "ids required" }, { status: 400 });
  }

  await prisma.$transaction(
    ids.map((id, index) =>
      prisma.platformLink.updateMany({
        where: {
          id,
          deletedAt: null,
          OR: [{ visibility: "PUBLIC" }, { visibility: "PRIVATE", ownerUserId: actorName }]
        },
        data: {
          orderIndex: index + 1,
          updatedBy: actorName
        }
      })
    )
  );

  return NextResponse.json({ ok: true });
};

export const dynamic = "force-dynamic";
