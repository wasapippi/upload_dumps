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
  const categoryId = parseNumber(searchParams.get("categoryId"));
  const hostTypeId = parseNumber(searchParams.get("hostTypeId"));
  const platformId = parseNumber(searchParams.get("platformId"));
  const vendorId = parseNumber(searchParams.get("vendorId"));
  const scope = searchParams.get("scope") === "vendor" ? "vendor" : "normal";
  const selectedPlatform = platformId
    ? await prisma.platform.findUnique({ where: { id: platformId }, select: { vendorId: true } })
    : null;
  const selectedVendorId = selectedPlatform?.vendorId ?? null;

  const where: Prisma.CommandWhereInput = {
    deletedAt: null,
    OR: [
      { visibility: "PUBLIC" },
      { visibility: "PRIVATE", ownerUserId: actorName }
    ]
  };

  if (scope === "vendor") {
    where.AND = [
      ...(Array.isArray(where.AND) ? where.AND : []),
      {
        ...(vendorId ? { vendorId } : { vendorId: { not: null } }),
        platformId: null
      }
    ];
  } else {
    const hostCategoryFilter: Prisma.CommandWhereInput = {
      ...(hostTypeId ? { hostTypeId } : {}),
      ...(categoryId ? { hostType: { is: { categoryId } } } : {})
    };

    if (!platformId) {
      Object.assign(where, hostCategoryFilter);
    } else {
      where.AND = [
        ...(Array.isArray(where.AND) ? where.AND : []),
        {
          OR: [
            {
              ...hostCategoryFilter,
              OR: [{ platformId: null, vendorId: null }, { platformId }]
            },
            ...(selectedVendorId ? [{ platformId: null, vendorId: selectedVendorId }] : [])
          ]
        }
      ];
    }
  }

  const commands = await prisma.command.findMany({
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
  for (const command of commands) {
    for (const link of command.tags) {
      map.set(link.tag.id, link.tag);
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
