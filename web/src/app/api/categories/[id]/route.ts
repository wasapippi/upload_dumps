import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { normalizeName } from "@/lib/normalize";

export const PUT = async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const id = Number(params.id);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }

  const body = await request.json();
  const name = String(body?.name ?? "").trim();
  if (!name) {
    return NextResponse.json({ error: "name required" }, { status: 400 });
  }
  const normalizedName = normalizeName(name);
  if (!normalizedName) {
    return NextResponse.json({ error: "invalid name" }, { status: 400 });
  }

  try {
    const updated = await prisma.category.update({
      where: { id },
      data: {
        name,
        normalizedName,
        groupOrderIndex: Number(body?.groupOrderIndex ?? 0)
      }
    });
    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return NextResponse.json({ error: "同名の分類が既に存在します。" }, { status: 409 });
      }
      if (error.code === "P2025") {
        return NextResponse.json({ error: "対象の分類が存在しません。" }, { status: 404 });
      }
    }
    return NextResponse.json({ error: "保存に失敗しました。" }, { status: 500 });
  }
};

export const DELETE = async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const id = Number(params.id);
  const cascade = request.nextUrl.searchParams.get("cascade") === "1";
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }
  try {
    const hostTypes = await prisma.hostType.findMany({
      where: { categoryId: id },
      select: { id: true }
    });
    const hostTypeIds = hostTypes.map((item) => item.id);

    const [hostTypeCount, commandRefs, linkRefs, hostTypePlatformRefs] = await Promise.all([
      prisma.hostType.count({ where: { categoryId: id } }),
      hostTypeIds.length > 0
        ? prisma.command.count({ where: { hostTypeId: { in: hostTypeIds } } })
        : Promise.resolve(0),
      hostTypeIds.length > 0
        ? prisma.platformLink.count({ where: { hostTypeId: { in: hostTypeIds } } })
        : Promise.resolve(0),
      hostTypeIds.length > 0
        ? prisma.hostTypePlatform.count({ where: { hostTypeId: { in: hostTypeIds } } })
        : Promise.resolve(0)
    ]);

    const related = {
      hostTypes: hostTypeCount,
      commands: commandRefs,
      platformLinks: linkRefs,
      hostTypePlatforms: hostTypePlatformRefs
    };
    const hasRelated =
      hostTypeCount > 0 || commandRefs > 0 || linkRefs > 0 || hostTypePlatformRefs > 0;

    if (hasRelated && !cascade) {
      return NextResponse.json(
        { error: "関連データがあります。cascade=1 で削除可能です。", related },
        { status: 409 }
      );
    }

    if (hasRelated && cascade) {
      await prisma.$transaction(async (tx) => {
        if (hostTypeIds.length > 0) {
          await tx.platformLink.deleteMany({ where: { hostTypeId: { in: hostTypeIds } } });
          await tx.command.deleteMany({ where: { hostTypeId: { in: hostTypeIds } } });
          await tx.hostTypePlatform.deleteMany({ where: { hostTypeId: { in: hostTypeIds } } });
          await tx.hostType.deleteMany({ where: { id: { in: hostTypeIds } } });
        }
        await tx.category.delete({ where: { id } });
      });
      return NextResponse.json({ ok: true, related });
    }

    await prisma.category.delete({ where: { id } });
    return NextResponse.json({ ok: true, related });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2003") {
        return NextResponse.json({ error: "関連データがあるため削除できません。" }, { status: 409 });
      }
      if (error.code === "P2025") {
        return NextResponse.json({ error: "対象の分類が存在しません。" }, { status: 404 });
      }
    }
    return NextResponse.json({ error: "削除に失敗しました。" }, { status: 500 });
  }
};
