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
  const vendorId = Number(body?.vendorId);
  if (!name || !Number.isFinite(vendorId) || vendorId <= 0) {
    return NextResponse.json({ error: "name/vendorId required" }, { status: 400 });
  }
  const normalizedName = normalizeName(name);
  if (!normalizedName) {
    return NextResponse.json({ error: "invalid name" }, { status: 400 });
  }

  try {
    const updated = await prisma.platform.update({
      where: { id },
      data: {
        name,
        normalizedName,
        vendorId
      },
      include: { vendor: true }
    });
    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return NextResponse.json({ error: "同名の機種名が既に存在します。" }, { status: 409 });
      }
      if (error.code === "P2003") {
        return NextResponse.json({ error: "ベンダIDが不正です。" }, { status: 400 });
      }
      if (error.code === "P2025") {
        return NextResponse.json({ error: "対象の機種名が存在しません。" }, { status: 404 });
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
    const [hostTypeLinks, commandRefs, linkRefs] = await Promise.all([
      prisma.hostTypePlatform.count({ where: { platformId: id } }),
      prisma.command.count({ where: { platformId: id } }),
      prisma.platformLink.count({ where: { platformId: id } })
    ]);

    const related = { hostTypeLinks, commands: commandRefs, platformLinks: linkRefs };
    const hasRelated = hostTypeLinks > 0 || commandRefs > 0 || linkRefs > 0;

    if (hasRelated && !cascade) {
      return NextResponse.json(
        { error: "関連データがあります。cascade=1 で削除可能です。", related },
        { status: 409 }
      );
    }

    if (hasRelated && cascade) {
      await prisma.$transaction(async (tx) => {
        await tx.platformLink.deleteMany({ where: { platformId: id } });
        await tx.command.deleteMany({ where: { platformId: id } });
        await tx.hostTypePlatform.deleteMany({ where: { platformId: id } });
        await tx.platform.delete({ where: { id } });
      });
      return NextResponse.json({ ok: true, related });
    }

    await prisma.platform.delete({ where: { id } });
    return NextResponse.json({ ok: true, related });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2003") {
        return NextResponse.json({ error: "関連データがあるため削除できません。" }, { status: 409 });
      }
      if (error.code === "P2025") {
        return NextResponse.json({ error: "対象の機種名が存在しません。" }, { status: 404 });
      }
    }
    return NextResponse.json({ error: "削除に失敗しました。" }, { status: 500 });
  }
};
