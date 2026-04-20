import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const inbounds = await prisma.inbound.findMany({
      include: {
        supplier: true,
        receiver: { select: { name: true } },
        items: { include: { item: { select: { name: true, sku: true } } } },
      },
      orderBy: { date: "desc" },
    });
    return NextResponse.json({ success: true, data: inbounds });
  } catch (error) {
    console.error("Inbound API Error:", error);
    return NextResponse.json({ success: false, error: "Gagal memuat data barang masuk" }, { status: 500 });
  }
}
