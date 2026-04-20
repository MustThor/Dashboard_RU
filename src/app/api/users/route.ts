import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

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
