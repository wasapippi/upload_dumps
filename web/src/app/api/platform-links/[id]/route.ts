import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveActorName } from "@/lib/auditActor";
import { normalizeName } from "@/lib/normalize";

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

export const PUT = async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const actorName = resolveActorName(request);
  const id = Number(params.id);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }

  const body = await request.json();
  const tags = await getTagsByNames(body.tags ?? []);
  const updatedAt = body.updatedAt ? new Date(body.updatedAt) : null;
  if (!updatedAt) {
    return NextResponse.json({ error: "updatedAt required" }, { status: 400 });
  }
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

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.platformLink.updateMany({
      where: {
        id,
        updatedAt,
        deletedAt: null,
        OR: [
          { visibility: "PUBLIC" },
          { visibility: "PRIVATE", ownerUserId: actorName }
        ]
      },
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
        updatedBy: actorName
      }
    });
    if (updated.count === 0) return updated;
    await tx.platformLinkTag.deleteMany({ where: { platformLinkId: id } });
    if (tags.length > 0) {
      await tx.platformLinkTag.createMany({
        data: tags.map((tag) => ({ platformLinkId: id, tagId: tag.id }))
      });
    }
    return updated;
  });

  if (result.count === 0) {
    return NextResponse.json({ error: "conflict" }, { status: 409 });
  }

  const link = await prisma.platformLink.findUnique({
    where: { id },
    include: { hostType: true, platform: true, vendor: true, tags: { include: { tag: true } } }
  });
  return NextResponse.json(link);
};

export const DELETE = async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const actorName = resolveActorName(request);
  const id = Number(params.id);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }

  const result = await prisma.platformLink.updateMany({
    where: {
      id,
      deletedAt: null,
      OR: [
        { visibility: "PUBLIC" },
        { visibility: "PRIVATE", ownerUserId: actorName }
      ]
    },
    data: {
      deletedAt: new Date(),
      updatedBy: actorName
    }
  });
  if (result.count === 0) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
};
