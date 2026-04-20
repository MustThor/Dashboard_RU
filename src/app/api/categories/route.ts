import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      include: { _count: { select: { items: true } } },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ success: true, data: categories });
  } catch (error) {
    console.error("Categories API Error:", error);
    return NextResponse.json({ success: false, error: "Gagal memuat data kategori" }, { status: 500 });
  }
}
