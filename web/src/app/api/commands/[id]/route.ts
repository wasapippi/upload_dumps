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
  const hostTypeId = Number(body.hostTypeId);
  const platformId = body.platformId ? Number(body.platformId) : null;
  if (!Number.isFinite(hostTypeId) || hostTypeId <= 0) {
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
          updatedAt
        },
        data: {
          title: body.title,
          description: body.description ?? null,
          commandText: body.commandText,
          hostTypeId,
          platformId,
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
      variables: true,
      tags: { include: { tag: true } }
    }
  });

  return NextResponse.json(command);
};

export const GET = async (
  _request: NextRequest,
  { params }: { params: { id: string } }
) => {
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
      variables: true,
      tags: { include: { tag: true } }
    }
  });

  if (!command) {
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

  await prisma.command.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      updatedBy: actorName
    }
  });

  return NextResponse.json({ ok: true });
};
