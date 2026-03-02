import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { resolveActorName } from "@/lib/auditActor";
import { applyLinkTemplate } from "@/lib/linkTemplate";
import { normalizeName } from "@/lib/normalize";

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
      kind: "LINK",
      normalizedName: { in: cleaned.map((tag) => tag.normalizedName) }
    }
  });
  const existingMap = new Map(existing.map((tag) => [tag.normalizedName, tag]));
  const toCreate = cleaned.filter((tag) => !existingMap.has(tag.normalizedName));
  if (toCreate.length > 0) {
    await prisma.tag.createMany({
      data: toCreate.map((tag) => ({ ...tag, kind: "LINK" }))
    });
  }
  return prisma.tag.findMany({
    where: {
      kind: "LINK",
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
  const actorName = resolveActorName(request);
  const { searchParams } = request.nextUrl;
  const q = searchParams.get("q")?.trim();
  const normalizedQ = q ? q.normalize("NFKC") : null;
  const platformId = parseNumber(searchParams.get("platformId"));
  const vendorId = parseNumber(searchParams.get("vendorId"));
  const hostTypeId = parseNumber(searchParams.get("hostTypeId"));
  const tagIds = (searchParams.get("tagIds") ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .map((item) => Number(item))
    .filter((item) => Number.isInteger(item) && item > 0);
  const tagMode = searchParams.get("tagMode") === "or" ? "or" : "and";
  const hostName = searchParams.get("hostName");
  const forDevice = searchParams.get("forDevice") === "1";
  const selectedPlatform = platformId
    ? await prisma.platform.findUnique({ where: { id: platformId }, select: { vendorId: true } })
    : null;
  const selectedVendorId = vendorId ?? selectedPlatform?.vendorId ?? null;

  const where: Prisma.PlatformLinkWhereInput = {
    deletedAt: null,
    OR: [
      { visibility: "PUBLIC" },
      { visibility: "PRIVATE", ownerUserId: actorName }
    ]
  };
  const andConditions: Prisma.PlatformLinkWhereInput[] = [];
  if (normalizedQ) {
    andConditions.push({
      OR: [
        { title: { contains: normalizedQ } },
        { urlTemplate: { contains: normalizedQ } },
        { commentTemplate: { contains: normalizedQ } }
      ]
    });
  }
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
      OR: [
        { platformId: null, vendorId: null },
        { platformId: null, vendorId: selectedVendorId }
      ]
    });
  }
  if (tagIds.length > 0) {
    if (tagMode === "or") {
      andConditions.push({
        tags: { some: { tagId: { in: tagIds } } }
      });
    } else {
      andConditions.push(
        ...tagIds.map((tagId) => ({
          tags: { some: { tagId } }
        }))
      );
    }
  }
  if (andConditions.length > 0) {
    where.AND = andConditions;
  }
  if (hostTypeId) where.hostTypeId = hostTypeId;
  if (forDevice) where.deviceBindingMode = "INCLUDE_IN_DEVICE";

  const links = await prisma.platformLink.findMany({
    where,
    include: {
      hostType: true,
      platform: true,
      vendor: true,
      tags: { include: { tag: true } }
    },
    orderBy: [{ orderIndex: "asc" }, { id: "asc" }]
  });

  return NextResponse.json(
    links.map((link) => ({
      ...link,
      resolvedUrl: applyLinkTemplate(link.urlTemplate, {
        hostName,
        platformName: link.platform?.name ?? link.vendor?.name ?? "",
        hostTypeName: link.hostType.name
      }),
      resolvedComment: link.commentTemplate
        ? applyLinkTemplate(link.commentTemplate, {
            hostName,
            platformName: link.platform?.name ?? link.vendor?.name ?? "",
            hostTypeName: link.hostType.name
          })
        : null
    }))
  );
};

export const POST = async (request: NextRequest) => {
  const actorName = resolveActorName(request);
  const body = await request.json();
  const tags = await getTagsByNames(body.tags ?? []);

  const rawPlatformId = body.platformId ? Number(body.platformId) : null;
  const rawVendorId = body.vendorId ? Number(body.vendorId) : null;
  const vendorId = Number.isFinite(rawVendorId) && rawVendorId && rawVendorId > 0 ? rawVendorId : null;
  const platformId =
    vendorId !== null ? null : (Number.isFinite(rawPlatformId) && rawPlatformId && rawPlatformId > 0 ? rawPlatformId : null);
  const rawHostTypeId = body.hostTypeId ? Number(body.hostTypeId) : null;
  const hostTypeId =
    Number.isFinite(rawHostTypeId) && rawHostTypeId && rawHostTypeId > 0
      ? rawHostTypeId
      : (vendorId ? await ensureVendorSharedHostType() : null);
  if (!hostTypeId || (!platformId && !vendorId)) {
    return NextResponse.json({ error: "platformId or vendorId, and hostTypeId are required" }, { status: 400 });
  }

  const maxOrder = await prisma.platformLink.aggregate({
    where: { platformId, vendorId, hostTypeId, deletedAt: null },
    _max: { orderIndex: true }
  });

  const created = await prisma.$transaction(async (tx) => {
    const link = await tx.platformLink.create({
      data: {
        title: String(body.title ?? "").trim(),
        urlTemplate: String(body.urlTemplate ?? "").trim(),
        commentTemplate: body.commentTemplate ? String(body.commentTemplate) : null,
        platformId,
        vendorId,
        hostTypeId,
        visibility: body.visibility === "PRIVATE" ? "PRIVATE" : "PUBLIC",
        ownerUserId: body.visibility === "PRIVATE" ? actorName : null,
        deviceBindingMode:
          body.deviceBindingMode === "EXCLUDE_FROM_DEVICE"
            ? "EXCLUDE_FROM_DEVICE"
            : "INCLUDE_IN_DEVICE",
        orderIndex: body.orderIndex ?? ((maxOrder._max.orderIndex ?? 0) + 1),
        createdBy: actorName,
        updatedBy: actorName
      }
    });
    if (tags.length > 0) {
      await tx.platformLinkTag.createMany({
        data: tags.map((tag) => ({ platformLinkId: link.id, tagId: tag.id }))
      });
    }
    return tx.platformLink.findUnique({
      where: { id: link.id },
      include: { hostType: true, platform: true, vendor: true, tags: { include: { tag: true } } }
    });
  });

  return NextResponse.json(created);
};

export const dynamic = "force-dynamic";
