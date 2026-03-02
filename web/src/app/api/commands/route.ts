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
    where: {
      kind: "COMMAND",
      normalizedName: { in: cleaned.map((tag) => tag.normalizedName) }
    }
  });

  const existingMap = new Map(
    existing.map((tag) => [tag.normalizedName, tag])
  );

  const toCreate = cleaned.filter(
    (tag) => !existingMap.has(tag.normalizedName)
  );

  if (toCreate.length > 0) {
    await prisma.tag.createMany({
      data: toCreate.map((tag) => ({ ...tag, kind: "COMMAND" }))
    });
  }

  return prisma.tag.findMany({
    where: {
      kind: "COMMAND",
      normalizedName: { in: cleaned.map((tag) => tag.normalizedName) }
    }
  });
};

const ensureVendorSharedHostType = async () => {
  const defaultCategoryName = "共通";
  const defaultCategoryNormalized = normalizeName(defaultCategoryName);
  let category = await prisma.category.findUnique({
    where: { normalizedName: defaultCategoryNormalized }
  });
  if (!category) {
    const maxCategory = await prisma.category.aggregate({ _max: { groupOrderIndex: true } });
    category = await prisma.category.create({
      data: {
        name: defaultCategoryName,
        normalizedName: defaultCategoryNormalized,
        groupOrderIndex: (maxCategory._max.groupOrderIndex ?? 0) + 1
      }
    });
  }

  const defaultHostTypeName = "共通";
  const defaultHostTypeNormalized = normalizeName(defaultHostTypeName);
  let hostType = await prisma.hostType.findUnique({
    where: { normalizedName: defaultHostTypeNormalized }
  });
  if (!hostType) {
    const maxHostType = await prisma.hostType.aggregate({ _max: { groupOrderIndex: true } });
    hostType = await prisma.hostType.create({
      data: {
        name: defaultHostTypeName,
        normalizedName: defaultHostTypeNormalized,
        categoryId: category.id,
        groupOrderIndex: (maxHostType._max.groupOrderIndex ?? 0) + 1
      }
    });
  }

  return hostType.id;
};

export const GET = async (request: NextRequest) => {
  const { searchParams } = request.nextUrl;
  const actorName = resolveActorName(request);
  const q = searchParams.get("q")?.trim();
  const normalizedQ = q ? q.normalize("NFKC") : null;
  const categoryId = parseNumber(searchParams.get("categoryId"));
  const hostTypeId = parseNumber(searchParams.get("hostTypeId"));
  const platformId = parseNumber(searchParams.get("platformId"));
  const vendorId = parseNumber(searchParams.get("vendorId"));
  const scope = searchParams.get("scope") === "vendor" ? "vendor" : "normal";
  const selectedPlatform = platformId
    ? await prisma.platform.findUnique({ where: { id: platformId }, select: { vendorId: true } })
    : null;
  const selectedVendorId = selectedPlatform?.vendorId ?? null;
  const forDevice = searchParams.get("forDevice") === "1";
  const tagIds = (searchParams.get("tagIds") || "")
    .split(",")
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value) && value > 0);
  const tagMode = searchParams.get("tagMode") === "or" ? "or" : "and";
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
  const andConditions: Prisma.CommandWhereInput[] = [
    {
      OR: [
        { visibility: "PUBLIC" },
        { visibility: "PRIVATE", ownerUserId: actorName }
      ]
    }
  ];

  if (normalizedQ) {
    where.OR = [
      { title: { contains: normalizedQ } },
      { description: { contains: normalizedQ } },
      { commandText: { contains: normalizedQ } }
    ];
  }

  if (scope === "vendor") {
    andConditions.push({
      ...(vendorId ? { vendorId } : { vendorId: { not: null } }),
      platformId: null
    });
  } else {
    const hostCategoryFilter: Prisma.CommandWhereInput = {
      ...(hostTypeId ? { hostTypeId } : {}),
      ...(categoryId ? { hostType: { is: { categoryId } } } : {})
    };

    if (!platformId) {
      Object.assign(where, hostCategoryFilter);
    } else {
      andConditions.push({
        OR: [
          {
            ...hostCategoryFilter,
            OR: [{ platformId: null, vendorId: null }, { platformId }]
          },
          ...(selectedVendorId ? [{ platformId: null, vendorId: selectedVendorId }] : [])
        ]
      });
    }
  }

  if (forDevice) {
    where.deviceBindingMode = "INCLUDE_IN_DEVICE";
  }

  if (tagIds.length > 0) {
    if (tagMode === "or") {
      where.tags = {
        some: {
          tagId: { in: tagIds }
        }
      };
    } else {
      andConditions.push(
        ...tagIds.map((tagId) => ({
          tags: {
            some: { tagId }
          }
        }))
      );
    }
  }

  where.AND = andConditions;

  const commands = await prisma.command.findMany({
    where,
    include: {
      hostType: {
        include: {
          category: true
        }
      },
      platform: true,
      vendor: true,
      variables: true,
      tags: {
        include: {
          tag: true
        }
      }
    },
    orderBy: [
      { hostType: { groupOrderIndex: "asc" } },
      // platformId=null(共通) を機種固有より先に並べる
      { platformId: "asc" },
      { orderIndex: "asc" },
      { id: "asc" }
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
  const rawHostTypeId = body.hostTypeId ? Number(body.hostTypeId) : null;
  const rawPlatformId = body.platformId ? Number(body.platformId) : null;
  const rawVendorId = body.vendorId ? Number(body.vendorId) : null;
  const vendorId = Number.isFinite(rawVendorId) && rawVendorId && rawVendorId > 0 ? rawVendorId : null;
  const hostTypeId =
    Number.isFinite(rawHostTypeId) && rawHostTypeId && rawHostTypeId > 0
      ? rawHostTypeId
      : (vendorId ? await ensureVendorSharedHostType() : null);
  const platformId =
    vendorId !== null ? null : (Number.isFinite(rawPlatformId) && rawPlatformId && rawPlatformId > 0 ? rawPlatformId : null);
  if (vendorId) {
    const vendor = await prisma.vendor.findUnique({ where: { id: vendorId }, select: { id: true } });
    if (!vendor) {
      return NextResponse.json({ error: "invalid vendorId" }, { status: 400 });
    }
  }
  if (!hostTypeId) {
    return NextResponse.json(
      { error: "hostTypeId required" },
      { status: 400 }
    );
  }

  const maxOrder = await prisma.command.aggregate({
    where: { hostTypeId, platformId, vendorId, deletedAt: null },
    _max: { orderIndex: true }
  });

  const command = await prisma.command.create({
    data: {
      title: body.title,
      description: body.description ?? null,
      commandText: body.commandText,
      hostTypeId,
      platformId,
      vendorId,
      visibility: body.visibility === "PRIVATE" ? "PRIVATE" : "PUBLIC",
      ownerUserId: body.visibility === "PRIVATE" ? actorName : null,
      deviceBindingMode:
        body.deviceBindingMode === "EXCLUDE_FROM_DEVICE"
          ? "EXCLUDE_FROM_DEVICE"
          : "INCLUDE_IN_DEVICE",
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
      vendor: true,
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
      vendor: true,
      variables: true,
      tags: { include: { tag: true } }
    }
  });

  return NextResponse.json(hydrated);
};

export const dynamic = "force-dynamic";
