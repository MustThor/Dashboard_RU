import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      include: { _count: { select: { items: true } } },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ success: true, data: categories });
  } catch (error) {
    console.error("Categories GET Error:", error);
    return NextResponse.json({ success: false, error: "Gagal memuat data kategori" }, { status: 500 });
  }
}

// POST — tambah kategori baru (hanya ADMIN_GUDANG & SUPER_ADMIN)
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const allowed = ["SUPER_ADMIN", "ADMIN_GUDANG"];
    if (!allowed.includes(session.user.role)) {
      return NextResponse.json({ success: false, error: "Tidak punya izin menambah kategori." }, { status: 403 });
    }

    const { name, code, description } = await req.json();
    if (!name || !code) {
      return NextResponse.json({ success: false, error: "Nama dan kode kategori wajib diisi." }, { status: 400 });
    }

    // Cek kode unik
    const existing = await prisma.category.findUnique({ where: { code: code.toUpperCase() } });
    if (existing) {
      return NextResponse.json({ success: false, error: `Kode "${code.toUpperCase()}" sudah digunakan.` }, { status: 409 });
    }

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        code: code.toUpperCase().trim(),
        description: description?.trim() || null,
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, data: category });
  } catch (error) {
    console.error("Categories POST Error:", error);
    return NextResponse.json({ success: false, error: "Gagal menambah kategori" }, { status: 500 });
  }
}

// DELETE — hapus kategori
// force: false → tolak jika masih ada barang (ADMIN_GUDANG bisa)
// force: true  → hapus semua barang dulu, lalu kategori (SUPER_ADMIN saja)
export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { id, force } = await req.json();
    if (!id) return NextResponse.json({ success: false, error: "ID kategori diperlukan." }, { status: 400 });

    const itemCount = await prisma.item.count({ where: { categoryId: id } });

    if (force) {
      // ── Force delete: SUPER_ADMIN saja ───────────────────────────────────
      if (session.user.role !== "SUPER_ADMIN") {
        return NextResponse.json({
          success: false,
          error: "Hanya Super Admin yang dapat melakukan force delete.",
        }, { status: 403 });
      }

      // Hapus semua barang di kategori ini (cascade: opname items, inbound items, outbound items dulu)
      const items = await prisma.item.findMany({ where: { categoryId: id }, select: { id: true } });
      const itemIds = items.map(i => i.id);

      if (itemIds.length > 0) {
        await prisma.stockOpnameItem.deleteMany({ where: { itemId: { in: itemIds } } });
        await prisma.inboundItem.deleteMany({ where: { itemId: { in: itemIds } } });
        await prisma.outboundItem.deleteMany({ where: { itemId: { in: itemIds } } });
        await prisma.transferItem.deleteMany({ where: { itemId: { in: itemIds } } });
        await prisma.item.deleteMany({ where: { categoryId: id } });
      }

      await prisma.category.delete({ where: { id } });
      return NextResponse.json({ success: true, deletedItems: itemIds.length });

    } else {
      // ── Normal delete: tolak jika masih ada barang ────────────────────────
      const allowed = ["SUPER_ADMIN", "ADMIN_GUDANG"];
      if (!allowed.includes(session.user.role)) {
        return NextResponse.json({ success: false, error: "Tidak punya izin menghapus kategori." }, { status: 403 });
      }

      if (itemCount > 0) {
        return NextResponse.json({
          success: false,
          error: `Tidak dapat menghapus. Masih ada ${itemCount} barang di kategori ini.`,
          itemCount,
          canForce: session.user.role === "SUPER_ADMIN",
        }, { status: 409 });
      }

      await prisma.category.delete({ where: { id } });
      return NextResponse.json({ success: true, deletedItems: 0 });
    }

  } catch (error) {
    console.error("Categories DELETE Error:", error);
    return NextResponse.json({ success: false, error: "Gagal menghapus kategori" }, { status: 500 });
  }
}
