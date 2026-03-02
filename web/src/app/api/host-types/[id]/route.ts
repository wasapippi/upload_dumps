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
  const categoryId = Number(body?.categoryId);
  if (!name || !Number.isFinite(categoryId) || categoryId <= 0) {
    return NextResponse.json({ error: "name/categoryId required" }, { status: 400 });
  }
  const normalizedName = normalizeName(name);
  if (!normalizedName) {
    return NextResponse.json({ error: "invalid name" }, { status: 400 });
  }

  try {
    const updated = await prisma.hostType.update({
      where: { id },
      data: {
        name,
        normalizedName,
        categoryId,
        groupOrderIndex: Number(body?.groupOrderIndex ?? 0)
      },
      include: { category: true }
    });
    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return NextResponse.json({ error: "同名のホスト種別が既に存在します。" }, { status: 409 });
      }
      if (error.code === "P2003") {
        return NextResponse.json({ error: "分類IDが不正です。" }, { status: 400 });
      }
      if (error.code === "P2025") {
        return NextResponse.json({ error: "対象のホスト種別が存在しません。" }, { status: 404 });
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
    const [platformLinks, commandRefs, linkRefs] = await Promise.all([
      prisma.hostTypePlatform.count({ where: { hostTypeId: id } }),
      prisma.command.count({ where: { hostTypeId: id } }),
      prisma.platformLink.count({ where: { hostTypeId: id } })
    ]);

    const related = { hostTypePlatforms: platformLinks, commands: commandRefs, platformLinks: linkRefs };
    const hasRelated = platformLinks > 0 || commandRefs > 0 || linkRefs > 0;

    if (hasRelated && !cascade) {
      return NextResponse.json(
        { error: "関連データがあります。cascade=1 で削除可能です。", related },
        { status: 409 }
      );
    }

    if (hasRelated && cascade) {
      await prisma.$transaction(async (tx) => {
        await tx.platformLink.deleteMany({ where: { hostTypeId: id } });
        await tx.command.deleteMany({ where: { hostTypeId: id } });
        await tx.hostTypePlatform.deleteMany({ where: { hostTypeId: id } });
        await tx.hostType.delete({ where: { id } });
      });
      return NextResponse.json({ ok: true, related });
    }

    await prisma.hostType.delete({ where: { id } });
    return NextResponse.json({ ok: true, related });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2003") {
        return NextResponse.json({ error: "関連データがあるため削除できません。" }, { status: 409 });
      }
      if (error.code === "P2025") {
        return NextResponse.json({ error: "対象のホスト種別が存在しません。" }, { status: 404 });
      }
    }
    return NextResponse.json({ error: "削除に失敗しました。" }, { status: 500 });
  }
};
