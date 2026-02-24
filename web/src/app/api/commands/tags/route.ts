import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const parseNumber = (value: string | null) => {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const GET = async (request: NextRequest) => {
  const { searchParams } = request.nextUrl;
  const q = searchParams.get("q")?.trim();
  const normalizedQ = q ? q.normalize("NFKC").toLowerCase() : null;
  const categoryId = parseNumber(searchParams.get("categoryId"));
  const hostTypeId = parseNumber(searchParams.get("hostTypeId"));
  const platformId = parseNumber(searchParams.get("platformId"));

  const where: Prisma.CommandWhereInput = {
    deletedAt: null
  };

  if (hostTypeId) {
    where.hostTypeId = hostTypeId;
  }

  if (categoryId) {
    where.hostType = {
      is: { categoryId }
    };
  }

  if (platformId) {
    where.AND = [
      ...(where.AND ?? []),
      { OR: [{ platformId: null }, { platformId }] }
    ];
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
