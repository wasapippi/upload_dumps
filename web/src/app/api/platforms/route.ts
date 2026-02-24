import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeName } from "@/lib/normalize";

export const GET = async () => {
  const platforms = await prisma.platform.findMany({
    orderBy: { name: "asc" },
    include: {
      vendor: true,
      hostTypeLinks: {
        include: {
          hostType: {
            select: {
              id: true,
              categoryId: true
            }
          }
        }
      }
    }
  });
  return NextResponse.json(platforms);
};

export const POST = async (request: NextRequest) => {
  const body = await request.json();
  const name = String(body?.name ?? "").trim();
  if (!name) {
    return NextResponse.json({ error: "name required" }, { status: 400 });
  }

  const normalizedName = normalizeName(name);
  if (!normalizedName) {
    return NextResponse.json({ error: "invalid name" }, { status: 400 });
  }

  const existing = await prisma.platform.findUnique({
    where: { normalizedName },
    include: { vendor: true }
  });
  if (existing) return NextResponse.json(existing);

  let vendorId = Number(body?.vendorId);
  if (!Number.isFinite(vendorId) || vendorId <= 0) {
    const defaultVendorName = "Generic";
    const defaultVendorNormalized = normalizeName(defaultVendorName);
    let vendor = await prisma.vendor.findUnique({
      where: { normalizedName: defaultVendorNormalized }
    });
    if (!vendor) {
      vendor = await prisma.vendor.create({
        data: { name: defaultVendorName, normalizedName: defaultVendorNormalized }
      });
    }
    vendorId = vendor.id;
  }

  const created = await prisma.platform.create({
    data: { name, normalizedName, vendorId },
    include: { vendor: true }
  });

  return NextResponse.json(created);
};

export const dynamic = "force-dynamic";
