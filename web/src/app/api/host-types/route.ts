import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeName } from "@/lib/normalize";

export const GET = async () => {
  const hostTypes = await prisma.hostType.findMany({
    orderBy: { groupOrderIndex: "asc" },
    include: { category: true }
  });
  return NextResponse.json(hostTypes);
};

export const POST = async (request: NextRequest) => {
  const body = await request.json();
  const name = String(body?.name ?? "").trim();
  if (!name) {
    return NextResponse.json({ error: "name required" }, { status: 400 });
  }

  const normalizedName = normalizeName(name);
  if (!normalizedName) {
    return NextResponse.json({ error: "invalid name" }, { status: 400 });
  }

  const existing = await prisma.hostType.findUnique({
    where: { normalizedName },
    include: { category: true }
  });
  if (existing) return NextResponse.json(existing);

  let categoryId = Number(body?.categoryId);
  if (!Number.isFinite(categoryId) || categoryId <= 0) {
    const defaultCategoryName = "General";
    const defaultCategoryNormalized = normalizeName(defaultCategoryName);
    let category = await prisma.category.findUnique({
      where: { normalizedName: defaultCategoryNormalized }
    });
    if (!category) {
      const maxCategory = await prisma.category.aggregate({
        _max: { groupOrderIndex: true }
      });
      category = await prisma.category.create({
        data: {
          name: defaultCategoryName,
          normalizedName: defaultCategoryNormalized,
          groupOrderIndex: (maxCategory._max.groupOrderIndex ?? 0) + 1
        }
      });
    }
    categoryId = category.id;
  }

  const maxGroup = await prisma.hostType.aggregate({ _max: { groupOrderIndex: true } });
  const created = await prisma.hostType.create({
    data: {
      name,
      normalizedName,
      categoryId,
      groupOrderIndex: (maxGroup._max.groupOrderIndex ?? 0) + 1
    },
    include: { category: true }
  });

  return NextResponse.json(created);
};

export const dynamic = "force-dynamic";
