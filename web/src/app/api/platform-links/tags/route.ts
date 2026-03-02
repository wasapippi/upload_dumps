import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
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
  const q = searchParams.get("q")?.trim();
  const normalizedQ = q ? q.normalize("NFKC").toLowerCase() : null;
  const platformId = parseNumber(searchParams.get("platformId"));
  const vendorId = parseNumber(searchParams.get("vendorId"));
  const hostTypeId = parseNumber(searchParams.get("hostTypeId"));
  const selectedPlatform = platformId
    ? await prisma.platform.findUnique({ where: { id: platformId }, select: { vendorId: true } })
    : null;
  const selectedVendorId = vendorId ?? selectedPlatform?.vendorId ?? null;

  const where: Prisma.PlatformLinkWhereInput = {
    deletedAt: null,
    OR: [{ visibility: "PUBLIC" }, { visibility: "PRIVATE", ownerUserId: actorName }]
  };

  const andConditions: Prisma.PlatformLinkWhereInput[] = [];
  if (platformId) {
    andConditions.push({
      OR: [
        { platformId },
        { platformId: null, vendorId: null },
        ...(selectedVendorId ? [{ platformId: null, vendorId: selectedVendorId }] : [])
      ]
    });
  } else if (selectedVendorId) {
    andConditions.push({
      OR: [{ platformId: null, vendorId: null }, { platformId: null, vendorId: selectedVendorId }]
    });
  }
  if (hostTypeId) {
    andConditions.push({ hostTypeId });
  }
  if (andConditions.length > 0) {
    where.AND = andConditions;
  }

  const links = await prisma.platformLink.findMany({
    where,
    select: {
      tags: {
        select: {
          tag: true
        }
      }
    }
  });

  const map = new Map<number, { id: number; name: string; normalizedName: string }>();
  for (const link of links) {
    for (const item of link.tags) {
      if (item.tag.kind !== "LINK") continue;
      map.set(item.tag.id, item.tag);
    }
  }

  const tags = Array.from(map.values())
    .filter((tag) => {
      if (!normalizedQ) return true;
      return tag.normalizedName.toLowerCase().includes(normalizedQ);
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  return NextResponse.json(tags);
};

export const dynamic = "force-dynamic";
