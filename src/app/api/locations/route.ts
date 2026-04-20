import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const locations = await prisma.location.findMany({
      include: { _count: { select: { items: true, stockOpnames: true } } },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ success: true, data: locations });
  } catch (error) {
    console.error("Locations GET Error:", error);
    return NextResponse.json({ success: false, error: "Gagal memuat data lokasi" }, { status: 500 });
  }
}

// POST — tambah lokasi baru
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const allowed = ["SUPER_ADMIN", "ADMIN_GUDANG"];
    if (!allowed.includes(session.user.role)) {
      return NextResponse.json({ success: false, error: "Tidak punya izin menambah lokasi." }, { status: 403 });
    }

    const { name, code, type, capacity, description } = await req.json();
    if (!name || !code) {
      return NextResponse.json({ success: false, error: "Nama dan kode lokasi wajib diisi." }, { status: 400 });
    }

    const existing = await prisma.location.findUnique({ where: { code: code.toUpperCase() } });
    if (existing) {
      return NextResponse.json({ success: false, error: `Kode "${code.toUpperCase()}" sudah digunakan.` }, { status: 409 });
    }

    const location = await prisma.location.create({
      data: {
        name: name.trim(),
        code: code.toUpperCase().trim(),
        type: type?.trim() || null,
        capacity: capacity ? Number(capacity) : null,
        description: description?.trim() || null,
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, data: location });
  } catch (error) {
    console.error("Locations POST Error:", error);
    return NextResponse.json({ success: false, error: "Gagal menambah lokasi" }, { status: 500 });
  }
}

// PATCH — edit lokasi
export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const allowed = ["SUPER_ADMIN", "ADMIN_GUDANG"];
    if (!allowed.includes(session.user.role)) {
      return NextResponse.json({ success: false, error: "Tidak punya izin mengubah lokasi." }, { status: 403 });
    }

    const { id, name, type, capacity, description, isActive } = await req.json();
    if (!id || !name) {
      return NextResponse.json({ success: false, error: "ID dan nama lokasi wajib diisi." }, { status: 400 });
    }

    const location = await prisma.location.update({
      where: { id },
      data: {
        name: name.trim(),
        type: type?.trim() || null,
        capacity: capacity ? Number(capacity) : null,
        description: description?.trim() || null,
        isActive: isActive ?? true,
      },
    });

    return NextResponse.json({ success: true, data: location });
  } catch (error) {
    console.error("Locations PATCH Error:", error);
    return NextResponse.json({ success: false, error: "Gagal mengupdate lokasi" }, { status: 500 });
  }
}

// DELETE — hapus lokasi (hanya jika tidak ada barang)
export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const allowed = ["SUPER_ADMIN", "ADMIN_GUDANG"];
    if (!allowed.includes(session.user.role)) {
      return NextResponse.json({ success: false, error: "Tidak punya izin menghapus lokasi." }, { status: 403 });
    }

    const { id } = await req.json();
    if (!id) return NextResponse.json({ success: false, error: "ID lokasi diperlukan." }, { status: 400 });

    // Cek apakah masih ada barang di lokasi ini
    const itemCount = await prisma.item.count({ where: { locationId: id } });
    if (itemCount > 0) {
      return NextResponse.json({
        success: false,
        error: `Tidak dapat menghapus. Masih ada ${itemCount} barang di lokasi ini.`,
      }, { status: 409 });
    }

    await prisma.location.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Locations DELETE Error:", error);
    return NextResponse.json({ success: false, error: "Gagal menghapus lokasi" }, { status: 500 });
  }
}
