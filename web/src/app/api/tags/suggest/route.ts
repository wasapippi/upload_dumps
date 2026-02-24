import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const GET = async (request: NextRequest) => {
  const q = request.nextUrl.searchParams.get("q")?.trim();
  const normalizedQ = q ? q.normalize("NFKC") : null;
  if (!normalizedQ) {
    const recent = await prisma.tag.findMany({
      orderBy: { name: "asc" },
      take: 20
    });
    return NextResponse.json(recent);
  }

  const tags = await prisma.tag.findMany({
    where: {
      name: {
        contains: normalizedQ
      }
    },
    orderBy: { name: "asc" },
    take: 20
  });

  return NextResponse.json(tags);
};

export const dynamic = "force-dynamic";
