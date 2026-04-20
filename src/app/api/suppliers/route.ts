import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

const ALLOWED = ["SUPER_ADMIN", "ADMIN_GUDANG"];

// GET — daftar semua supplier
export async function GET() {
  try {
    const suppliers = await prisma.supplier.findMany({
      include: { _count: { select: { inbounds: true } } },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ success: true, data: suppliers });
  } catch (error) {
    console.error("Suppliers GET Error:", error);
    return NextResponse.json({ success: false, error: "Gagal memuat data supplier" }, { status: 500 });
  }
}

// POST — tambah supplier baru
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    if (!ALLOWED.includes(session.user.role))
      return NextResponse.json({ success: false, error: "Tidak punya izin menambah supplier." }, { status: 403 });

    const { name, code, contactPerson, email, phone, address, city } = await req.json();
    if (!name || !code)
      return NextResponse.json({ success: false, error: "Nama dan kode supplier wajib diisi." }, { status: 400 });

    const existing = await prisma.supplier.findUnique({ where: { code: code.toUpperCase() } });
    if (existing)
      return NextResponse.json({ success: false, error: `Kode "${code.toUpperCase()}" sudah digunakan.` }, { status: 409 });

    const supplier = await prisma.supplier.create({
      data: {
        name:          name.trim(),
        code:          code.toUpperCase().trim(),
        contactPerson: contactPerson?.trim() || null,
        email:         email?.trim() || null,
        phone:         phone?.trim() || null,
        address:       address?.trim() || null,
        city:          city?.trim() || null,
        isActive:      true,
      },
    });
    return NextResponse.json({ success: true, data: supplier }, { status: 201 });
  } catch (error) {
    console.error("Suppliers POST Error:", error);
    return NextResponse.json({ success: false, error: "Gagal menambah supplier" }, { status: 500 });
  }
}

// PATCH — edit supplier
export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    if (!ALLOWED.includes(session.user.role))
      return NextResponse.json({ success: false, error: "Tidak punya izin mengedit supplier." }, { status: 403 });

    const { id, name, contactPerson, email, phone, address, city, isActive } = await req.json();
    if (!id || !name)
      return NextResponse.json({ success: false, error: "ID dan nama supplier wajib diisi." }, { status: 400 });

    const supplier = await prisma.supplier.update({
      where: { id },
      data: {
        name:          name.trim(),
        contactPerson: contactPerson?.trim() || null,
        email:         email?.trim() || null,
        phone:         phone?.trim() || null,
        address:       address?.trim() || null,
        city:          city?.trim() || null,
        isActive:      isActive ?? true,
      },
    });
    return NextResponse.json({ success: true, data: supplier });
  } catch (error) {
    console.error("Suppliers PATCH Error:", error);
    return NextResponse.json({ success: false, error: "Gagal mengupdate supplier" }, { status: 500 });
  }
}

// DELETE — hapus supplier (hanya jika tidak ada transaksi)
export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    if (!ALLOWED.includes(session.user.role))
      return NextResponse.json({ success: false, error: "Tidak punya izin menghapus supplier." }, { status: 403 });

    const { id } = await req.json();
    if (!id) return NextResponse.json({ success: false, error: "ID supplier diperlukan." }, { status: 400 });

    const txCount = await prisma.inbound.count({ where: { supplierId: id } });
    if (txCount > 0)
      return NextResponse.json({
        success: false,
        error: `Tidak dapat menghapus. Supplier ini memiliki ${txCount} riwayat transaksi inbound.`,
      }, { status: 409 });

    await prisma.supplier.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Suppliers DELETE Error:", error);
    return NextResponse.json({ success: false, error: "Gagal menghapus supplier" }, { status: 500 });
  }
}
