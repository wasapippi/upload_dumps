import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { normalizeName } from "@/lib/normalize";
import { resolveActorName } from "@/lib/auditActor";

const parseNumber = (value: string | null) => {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const getTagsByNames = async (names: string[]) => {
  const map = new Map<string, { name: string; normalizedName: string }>();
  for (const raw of names) {
    const name = raw.trim();
    if (!name) continue;
    const normalizedName = normalizeName(name);
    if (!normalizedName) continue;
    if (!map.has(normalizedName)) {
      map.set(normalizedName, { name, normalizedName });
    }
  }
  const cleaned = Array.from(map.values());

  if (cleaned.length === 0) return [];

  const existing = await prisma.tag.findMany({
    where: { normalizedName: { in: cleaned.map((tag) => tag.normalizedName) } }
  });

  const existingMap = new Map(
    existing.map((tag) => [tag.normalizedName, tag])
  );

  const toCreate = cleaned.filter(
    (tag) => !existingMap.has(tag.normalizedName)
  );

  if (toCreate.length > 0) {
    await prisma.tag.createMany({ data: toCreate });
  }

  return prisma.tag.findMany({
    where: { normalizedName: { in: cleaned.map((tag) => tag.normalizedName) } }
  });
};

export const GET = async (request: NextRequest) => {
  const { searchParams } = request.nextUrl;
  const q = searchParams.get("q")?.trim();
  const normalizedQ = q ? q.normalize("NFKC") : null;
  const categoryId = parseNumber(searchParams.get("categoryId"));
  const hostTypeId = parseNumber(searchParams.get("hostTypeId"));
  const platformId = parseNumber(searchParams.get("platformId"));
  const tagIds = (searchParams.get("tagIds") || "")
    .split(",")
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value) && value > 0);
  const pageRaw = searchParams.get("page");
  const pageSizeRaw = searchParams.get("pageSize");
  const page = Number(pageRaw || "1");
  const pageSize = Number(pageSizeRaw || "20");
  const usePagination =
    (pageRaw !== null || pageSizeRaw !== null) &&
    Number.isFinite(page) &&
    Number.isFinite(pageSize);

  const where: Prisma.CommandWhereInput = {
    deletedAt: null
  };

  if (normalizedQ) {
    where.OR = [
      { title: { contains: normalizedQ } },
      { description: { contains: normalizedQ } },
      { commandText: { contains: normalizedQ } }
    ];
  }

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

  if (tagIds.length > 0) {
    where.tags = {
      some: {
        tagId: { in: tagIds }
      }
    };
  }

  const commands = await prisma.command.findMany({
    where,
    include: {
      hostType: {
        include: {
          category: true
        }
      },
      platform: true,
      variables: true,
      tags: {
        include: {
          tag: true
        }
      }
    },
    orderBy: [
      { hostType: { groupOrderIndex: "asc" } },
      { orderIndex: "asc" }
    ],
    ...(usePagination
      ? {
          skip: Math.max(page - 1, 0) * Math.max(pageSize, 1),
          take: Math.max(pageSize, 1)
        }
      : {})
  });

  if (!usePagination) {
    return NextResponse.json(commands);
  }

  const total = await prisma.command.count({ where });
  return NextResponse.json({
    items: commands,
    total,
    page: Math.max(page, 1),
    pageSize: Math.max(pageSize, 1)
  });
};

export const POST = async (request: NextRequest) => {
  const body = await request.json();
  const actorName = resolveActorName(request);

  const tags = await getTagsByNames(body.tags ?? []);
  const hostTypeId = Number(body.hostTypeId);
  const platformId = body.platformId ? Number(body.platformId) : null;
  if (!Number.isFinite(hostTypeId) || hostTypeId <= 0) {
    return NextResponse.json(
      { error: "hostTypeId required" },
      { status: 400 }
    );
  }

  const maxOrder = await prisma.command.aggregate({
    where: { hostTypeId, platformId },
    _max: { orderIndex: true }
  });

  const command = await prisma.command.create({
    data: {
      title: body.title,
      description: body.description ?? null,
      commandText: body.commandText,
      hostTypeId,
      platformId,
      danger: Boolean(body.danger),
      orderIndex: body.orderIndex ?? ((maxOrder._max.orderIndex ?? 0) + 1),
      createdBy: actorName,
      updatedBy: actorName
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
    }
  });

  if (tags.length > 0) {
    await prisma.commandTag.createMany({
      data: tags.map((tag) => ({ commandId: command.id, tagId: tag.id }))
    });
  }

  const hydrated = await prisma.command.findUnique({
    where: { id: command.id },
    include: {
      hostType: {
        include: {
          category: true
        }
      },
      platform: true,
      variables: true,
      tags: { include: { tag: true } }
    }
  });

  return NextResponse.json(hydrated);
};

export const dynamic = "force-dynamic";
