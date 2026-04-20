import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const opnames = await prisma.stockOpname.findMany({
      include: {
        location: true,
        auditor: { select: { name: true } },
        items: { include: { item: { select: { name: true, sku: true } } } },
      },
      orderBy: { date: "desc" },
    });
    return NextResponse.json({ success: true, data: opnames });
  } catch (error) {
    console.error("StockOpname API Error:", error);
    return NextResponse.json({ success: false, error: "Gagal memuat data stok opname" }, { status: 500 });
  }
}
