import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const suppliers = await prisma.supplier.findMany({
      include: { _count: { select: { inbounds: true } } },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ success: true, data: suppliers });
  } catch (error) {
    console.error("Suppliers API Error:", error);
    return NextResponse.json({ success: false, error: "Gagal memuat data supplier" }, { status: 500 });
  }
}
