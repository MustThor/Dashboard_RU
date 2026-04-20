import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { notifyOutboundCreated, notifyStockWarning } from "@/lib/notify";


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

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { destination, notes, items } = body;
    // items: Array<{ itemId: string; quantity: number }>

    if (!destination || !items?.length) {
      return NextResponse.json({ success: false, error: "Tujuan dan item wajib diisi" }, { status: 400 });
    }

    // Validate stock availability first
    for (const i of items as { itemId: string; quantity: number }[]) {
      const item = await prisma.item.findUnique({ where: { id: i.itemId } });
      if (!item) return NextResponse.json({ success: false, error: `Item tidak ditemukan` }, { status: 400 });
      if (item.stock < i.quantity) {
        return NextResponse.json({
          success: false,
          error: `Stok ${item.name} tidak cukup (tersedia: ${item.stock})`,
        }, { status: 400 });
      }
    }

    // Auto-generate SO number
    const count = await prisma.outbound.count();
    const soNumber = `SO-${new Date().getFullYear()}-${String(count + 1).padStart(3, "0")}`;

    // Calculate total value from item prices
    const itemDetails = await Promise.all(
      (items as { itemId: string; quantity: number }[]).map(i =>
        prisma.item.findUnique({ where: { id: i.itemId }, select: { price: true } })
      )
    );
    const totalValue = (items as { itemId: string; quantity: number }[]).reduce((sum, i, idx) => {
      return sum + i.quantity * (itemDetails[idx]?.price ?? 0);
    }, 0);

    const outbound = await prisma.outbound.create({
      data: {
        soNumber,
        date: new Date(),
        destination,
        shipperId: session.user.id,
        status: "DIKIRIM",
        totalValue,
        notes: notes || null,
        items: {
          create: (items as { itemId: string; quantity: number }[]).map((i, idx) => ({
            itemId: i.itemId,
            quantity: i.quantity,
            price: itemDetails[idx]?.price ?? 0,
          })),
        },
      },
    });

    // Reduce stock for each item + cek stok rendah/habis
    for (const i of items as { itemId: string; quantity: number }[]) {
      const item = await prisma.item.findUnique({ where: { id: i.itemId } });
      if (!item) continue;
      const newStock = item.stock - i.quantity;
      const newStatus = newStock === 0 ? "HABIS" : newStock <= item.minStock ? "STOK_RENDAH" : "TERSEDIA";
      await prisma.item.update({ where: { id: i.itemId }, data: { stock: newStock, status: newStatus } });

      if (newStatus === "STOK_RENDAH" || newStatus === "HABIS") {
        await notifyStockWarning({ itemName: item.name, sku: item.sku, newStock, minStock: item.minStock, unit: item.unit, userId: session.user.id });
      }
    }

    // Notifikasi barang keluar
    await notifyOutboundCreated({ soNumber, destination, itemCount: items.length, totalValue, userId: session.user.id });

    return NextResponse.json({ success: true, data: outbound });
  } catch (error) {
    console.error("Outbound POST Error:", error);
    return NextResponse.json({ success: false, error: "Gagal membuat barang keluar" }, { status: 500 });
  }
}
