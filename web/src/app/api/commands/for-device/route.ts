import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const parseNumber = (value: string | null) => {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const GET = async (request: NextRequest) => {
  const { searchParams } = request.nextUrl;
  const hostTypeId = parseNumber(searchParams.get("hostTypeId"));
  const platformId = parseNumber(searchParams.get("platformId"));

  if (!hostTypeId) {
    return NextResponse.json({ error: "hostTypeId required" }, { status: 400 });
  }

  const commands = await prisma.command.findMany({
    where: {
      deletedAt: null,
      hostTypeId,
      AND: platformId
        ? [{ OR: [{ platformId: null }, { platformId }] }]
        : undefined
    },
    include: {
      hostType: {
        include: {
          category: true
        }
      },
      platform: true,
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
