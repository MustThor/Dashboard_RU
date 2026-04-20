import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const outbounds = await prisma.outbound.findMany({
      include: {
        shipper: { select: { name: true } },
        items: { include: { item: { select: { name: true, sku: true } } } },
      },
      orderBy: { date: "desc" },
    });
    return NextResponse.json({ success: true, data: outbounds });
  } catch (error) {
    console.error("Outbound API Error:", error);
    return NextResponse.json({ success: false, error: "Gagal memuat data barang keluar" }, { status: 500 });
  }
}
