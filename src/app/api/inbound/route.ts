import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";


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

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { supplierId, notes, items } = body;
    // items: Array<{ itemId: string; quantity: number; price: number }>

    if (!supplierId || !items?.length) {
      return NextResponse.json({ success: false, error: "Supplier dan item wajib diisi" }, { status: 400 });
    }

    // Auto-generate PO number
    const count = await prisma.inbound.count();
    const poNumber = `PO-${new Date().getFullYear()}-${String(count + 1).padStart(3, "0")}`;
    const totalValue = items.reduce((sum: number, i: { quantity: number; price: number }) => sum + i.quantity * i.price, 0);

    const inbound = await prisma.inbound.create({
      data: {
        poNumber,
        date: new Date(),
        supplierId,
        receiverId: session.user.id,
        status: "DISIMPAN",
        totalValue,
        notes: notes || null,
        items: {
          create: items.map((i: { itemId: string; quantity: number; price: number }) => ({
            itemId: i.itemId,
            quantity: i.quantity,
            price: i.price,
          })),
        },
      },
    });

    // Update stock for each item
    for (const i of items as { itemId: string; quantity: number; price: number }[]) {
      const item = await prisma.item.findUnique({ where: { id: i.itemId } });
      if (!item) continue;
      const newStock = item.stock + i.quantity;
      const newStatus = newStock === 0 ? "HABIS" : newStock <= item.minStock ? "STOK_RENDAH" : "TERSEDIA";
      await prisma.item.update({
        where: { id: i.itemId },
        data: { stock: newStock, status: newStatus },
      });
    }

    return NextResponse.json({ success: true, data: inbound });
  } catch (error) {
    console.error("Inbound POST Error:", error);
    return NextResponse.json({ success: false, error: "Gagal membuat barang masuk" }, { status: 500 });
  }
}
