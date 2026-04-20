import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createNotif, notifyStockWarning } from "@/lib/notify";

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

    // Notifikasi barang baru ditambahkan
    const session = await auth();
    await createNotif({
      type:    "SUCCESS",
      title:   `Barang Baru Ditambahkan`,
      message: `[${sku}] ${name} berhasil ditambahkan ke inventaris dengan stok ${stockNum} ${unit || "pcs"}.`,
      userId:  session?.user?.id ?? null,
    });

    // Cek stok awal langsung rendah/habis
    if (status === "STOK_RENDAH" || status === "HABIS") {
      await notifyStockWarning({ itemName: name, sku, newStock: stockNum, minStock: minStockNum, unit: unit || "pcs", userId: session?.user?.id });
    }

    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (error) {
    console.error("Items POST Error:", error);
    return NextResponse.json({ success: false, error: "Gagal menambah barang" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, name, description, categoryId, locationId, stock, minStock, unit, price, weight } = body;

    if (!id || !name || !categoryId || !locationId) {
      return NextResponse.json({ success: false, error: "ID, nama, kategori, dan lokasi wajib diisi" }, { status: 400 });
    }

    const stockNum    = Number(stock) ?? 0;
    const minStockNum = Number(minStock) ?? 10;
    const status      = stockNum === 0 ? "HABIS" : stockNum <= minStockNum ? "STOK_RENDAH" : "TERSEDIA";

    const item = await prisma.item.update({
      where: { id },
      data: {
        name,
        description: description || null,
        categoryId,
        locationId,
        stock:    stockNum,
        minStock: minStockNum,
        unit:     unit || "pcs",
        price:    Number(price) || 0,
        weight:   weight ? Number(weight) : null,
        status,
      },
      include: { category: true, location: true },
    });

    // Notifikasi edit barang
    const session = await auth();
    await createNotif({
      type:    "INFO",
      title:   `Barang Diperbarui: ${item.name}`,
      message: `[${item.sku}] Data barang diubah. Stok: ${stockNum} ${item.unit}, Harga: Rp ${Number(price).toLocaleString("id-ID")}.`,
      userId:  session?.user?.id ?? null,
    });

    // Cek jika stok menjadi rendah/habis setelah edit
    if (status === "STOK_RENDAH" || status === "HABIS") {
      await notifyStockWarning({ itemName: item.name, sku: item.sku, newStock: stockNum, minStock: minStockNum, unit: item.unit, userId: session?.user?.id });
    }

    return NextResponse.json({ success: true, data: item });
  } catch (error) {
    console.error("Items PATCH Error:", error);
    return NextResponse.json({ success: false, error: "Gagal mengupdate barang" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ success: false, error: "ID barang diperlukan." }, { status: 400 });

    // Cek apakah ada transaksi terkait
    const [inbounds, outbounds] = await Promise.all([
      prisma.inboundItem.count({ where: { item: { id } } }),
      prisma.outboundItem.count({ where: { item: { id } } }),
    ]);

    if (inbounds + outbounds > 0) {
      return NextResponse.json({
        success: false,
        error: `Tidak dapat menghapus. Barang ini memiliki ${inbounds + outbounds} riwayat transaksi.`,
      }, { status: 409 });
    }

    // Simpan nama sebelum dihapus
    const itemToDelete = await prisma.item.findUnique({ where: { id }, select: { name: true, sku: true } });

    await prisma.item.delete({ where: { id } });

    // Notifikasi hapus barang
    const session = await auth();
    await createNotif({
      type:    "WARNING",
      title:   `Barang Dihapus: ${itemToDelete?.name ?? id}`,
      message: `[${itemToDelete?.sku ?? id}] dihapus dari inventaris oleh ${session?.user?.name ?? "pengguna"}.`,
      userId:  session?.user?.id ?? null,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Items DELETE Error:", error);
    return NextResponse.json({ success: false, error: "Gagal menghapus barang" }, { status: 500 });
  }
}
