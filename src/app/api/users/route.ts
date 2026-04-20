import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        _count: { select: { inbounds: true, outbounds: true, transfers: true } },
      },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ success: true, data: users });
  } catch (error) {
    console.error("Users API Error:", error);
    return NextResponse.json({ success: false, error: "Gagal memuat data pengguna" }, { status: 500 });
  }
}

// PATCH — toggle isActive, hanya SUPER_ADMIN
export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ success: false, error: "Hanya Super Admin yang dapat mengubah status pengguna." }, { status: 403 });
    }

    const { id, isActive } = await req.json();
    if (!id || typeof isActive !== "boolean") {
      return NextResponse.json({ success: false, error: "Data tidak valid" }, { status: 400 });
    }

    // Tidak boleh menonaktifkan diri sendiri
    if (id === session.user.id) {
      return NextResponse.json({ success: false, error: "Tidak dapat menonaktifkan akun sendiri." }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { isActive },
      select: { id: true, name: true, isActive: true },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Users PATCH Error:", error);
    return NextResponse.json({ success: false, error: "Gagal mengubah status pengguna" }, { status: 500 });
  }
}
