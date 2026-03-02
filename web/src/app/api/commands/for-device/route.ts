import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveActorName } from "@/lib/auditActor";

const parseNumber = (value: string | null) => {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const GET = async (request: NextRequest) => {
  const { searchParams } = request.nextUrl;
  const actorName = resolveActorName(request);
  const hostTypeId = parseNumber(searchParams.get("hostTypeId"));
  const platformId = parseNumber(searchParams.get("platformId"));
  const selectedPlatform = platformId
    ? await prisma.platform.findUnique({ where: { id: platformId }, select: { vendorId: true } })
    : null;
  const selectedVendorId = selectedPlatform?.vendorId ?? null;

  if (!hostTypeId) {
    return NextResponse.json({ error: "hostTypeId required" }, { status: 400 });
  }

  const commands = await prisma.command.findMany({
    where: {
      deletedAt: null,
      deviceBindingMode: "INCLUDE_IN_DEVICE",
      OR: [
        { visibility: "PUBLIC" },
        { visibility: "PRIVATE", ownerUserId: actorName }
      ],
      ...(platformId
        ? {
            AND: [
              {
                OR: [
                  {
                    hostTypeId,
                    OR: [{ platformId: null, vendorId: null }, { platformId }]
                  },
                  ...(selectedVendorId ? [{ platformId: null, vendorId: selectedVendorId }] : [])
                ]
              }
            ]
          }
        : { hostTypeId })
    },
    include: {
      hostType: {
        include: {
          category: true
        }
      },
      platform: true,
      vendor: true,
      variables: true,
      tags: { include: { tag: true } }
    },
    orderBy: [
      { hostType: { groupOrderIndex: "asc" } },
      { orderIndex: "asc" }
    ]
  });

  return NextResponse.json(commands);
};

export const dynamic = "force-dynamic";
