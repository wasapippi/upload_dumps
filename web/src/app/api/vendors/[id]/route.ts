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
    const updated = await prisma.vendor.update({
      where: { id },
      data: { name, normalizedName }
    });
    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return NextResponse.json({ error: "同名のベンダが既に存在します。" }, { status: 409 });
      }
      if (error.code === "P2025") {
        return NextResponse.json({ error: "対象のベンダが存在しません。" }, { status: 404 });
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
    const platformIds = (
      await prisma.platform.findMany({ where: { vendorId: id }, select: { id: true } })
    ).map((item) => item.id);

    const [platforms, hostTypePlatforms, commands, platformLinks] = await Promise.all([
      prisma.platform.count({ where: { vendorId: id } }),
      platformIds.length > 0
        ? prisma.hostTypePlatform.count({ where: { platformId: { in: platformIds } } })
        : Promise.resolve(0),
      prisma.command.count({
        where: {
          OR: [
            { vendorId: id },
            ...(platformIds.length > 0 ? [{ platformId: { in: platformIds } }] : [])
          ]
        }
      }),
      prisma.platformLink.count({
        where: {
          OR: [
            { vendorId: id },
            ...(platformIds.length > 0 ? [{ platformId: { in: platformIds } }] : [])
          ]
        }
      })
    ]);

    const related = { platforms, hostTypePlatforms, commands, platformLinks };
    const hasRelated = platforms > 0 || hostTypePlatforms > 0 || commands > 0 || platformLinks > 0;

    if (hasRelated && !cascade) {
      return NextResponse.json(
        { error: "関連データがあります。cascade=1 で削除可能です。", related },
        { status: 409 }
      );
    }

    if (hasRelated && cascade) {
      await prisma.$transaction(async (tx) => {
        if (platformIds.length > 0) {
          await tx.platformLink.deleteMany({ where: { platformId: { in: platformIds } } });
          await tx.command.deleteMany({ where: { platformId: { in: platformIds } } });
          await tx.hostTypePlatform.deleteMany({ where: { platformId: { in: platformIds } } });
          await tx.platform.deleteMany({ where: { id: { in: platformIds } } });
        }
        await tx.platformLink.deleteMany({ where: { vendorId: id } });
        await tx.command.deleteMany({ where: { vendorId: id } });
        await tx.vendor.delete({ where: { id } });
      });
      return NextResponse.json({ ok: true, related });
    }

    await prisma.vendor.delete({ where: { id } });
    return NextResponse.json({ ok: true, related });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2003") {
        return NextResponse.json({ error: "関連データがあるため削除できません。" }, { status: 409 });
      }
      if (error.code === "P2025") {
        return NextResponse.json({ error: "対象のベンダが存在しません。" }, { status: 404 });
      }
    }
    return NextResponse.json({ error: "削除に失敗しました。" }, { status: 500 });
  }
};
