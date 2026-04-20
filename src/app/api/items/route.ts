import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") ?? "";
    const category = searchParams.get("category") ?? "";
    const status = searchParams.get("status") ?? "";

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
      ];
    }
    if (category) where.categoryId = category;
    if (status) where.status = status;

    const items = await prisma.item.findMany({
      where,
      include: { category: true, location: true },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ success: true, data: items });
  } catch (error) {
    console.error("Items GET Error:", error);
    return NextResponse.json({ success: false, error: "Gagal memuat data barang" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sku, name, description, categoryId, locationId, stock, minStock, unit, price, weight } = body;

    if (!sku || !name || !categoryId || !locationId) {
      return NextResponse.json({ success: false, error: "SKU, nama, kategori, dan lokasi wajib diisi" }, { status: 400 });
    }

    // Check SKU uniqueness
    const existing = await prisma.item.findUnique({ where: { sku } });
    if (existing) {
      return NextResponse.json({ success: false, error: "SKU sudah digunakan" }, { status: 400 });
    }

    const stockNum = Number(stock) || 0;
    const minStockNum = Number(minStock) || 10;
    const status = stockNum === 0 ? "HABIS" : stockNum <= minStockNum ? "STOK_RENDAH" : "TERSEDIA";

    const item = await prisma.item.create({
      data: {
        sku,
        name,
        description: description || null,
        categoryId,
        locationId,
        stock: stockNum,
        minStock: minStockNum,
        unit: unit || "pcs",
        price: Number(price) || 0,
        weight: weight ? Number(weight) : null,
        status,
      },
      include: { category: true, location: true },
    });

    // Update location used count
    await prisma.location.update({
      where: { id: locationId },
      data: { used: { increment: stockNum } },
    });

    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (error) {
    console.error("Items POST Error:", error);
    return NextResponse.json({ success: false, error: "Gagal menambah barang" }, { status: 500 });
  }
}
