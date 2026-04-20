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
