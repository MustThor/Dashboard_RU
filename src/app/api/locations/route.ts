import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const locations = await prisma.location.findMany({
      include: { _count: { select: { items: true, stockOpnames: true } } },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ success: true, data: locations });
  } catch (error) {
    console.error("Locations API Error:", error);
    return NextResponse.json({ success: false, error: "Gagal memuat data lokasi" }, { status: 500 });
  }
}
