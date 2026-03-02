import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeName } from "@/lib/normalize";
import { resolveActorName } from "@/lib/auditActor";

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

export const PUT = async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const id = Number(params.id);
  const actorName = resolveActorName(request);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const body = await request.json();
  const updatedAt = body.updatedAt ? new Date(body.updatedAt) : null;
  if (!updatedAt) {
    return NextResponse.json({ error: "updatedAt required" }, { status: 400 });
  }

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

  try {
    await prisma.$transaction(async (tx) => {
      const result = await tx.command.updateMany({
        where: {
          id,
          updatedAt,
          OR: [
            { visibility: "PUBLIC" },
            { visibility: "PRIVATE", ownerUserId: actorName }
          ]
        },
        data: {
          title: body.title,
          description: body.description ?? null,
          commandText: body.commandText,
          hostTypeId,
          platformId,
          vendorId,
          ...(body.visibility
            ? {
                visibility: body.visibility === "PRIVATE" ? "PRIVATE" : "PUBLIC",
                ownerUserId: body.visibility === "PRIVATE" ? actorName : null
              }
            : {}),
          ...(body.deviceBindingMode
            ? {
                deviceBindingMode:
                  body.deviceBindingMode === "EXCLUDE_FROM_DEVICE"
                    ? "EXCLUDE_FROM_DEVICE"
                    : "INCLUDE_IN_DEVICE"
              }
            : {}),
          danger: Boolean(body.danger),
          updatedBy: actorName
        }
      });

      if (result.count === 0) {
        throw new Error("CONFLICT");
      }

      await tx.commandTag.deleteMany({ where: { commandId: id } });
      if (tags.length > 0) {
        await tx.commandTag.createMany({
          data: tags.map((tag) => ({ commandId: id, tagId: tag.id }))
        });
      }
    });
  } catch (error) {
    if (error instanceof Error && error.message === "CONFLICT") {
      return NextResponse.json(
        { error: "conflict" },
        { status: 409 }
      );
    }
    throw error;
  }

  const command = await prisma.command.findUnique({
    where: { id },
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

  return NextResponse.json(command);
};

export const GET = async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const actorName = resolveActorName(request);
  const id = Number(params.id);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const command = await prisma.command.findUnique({
    where: { id },
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

  if (!command) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (command.visibility === "PRIVATE" && command.ownerUserId !== actorName) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(command);
};

export const DELETE = async (
  _request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const id = Number(params.id);
  const actorName = resolveActorName(_request);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const result = await prisma.command.updateMany({
    where: {
      id,
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
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
};
