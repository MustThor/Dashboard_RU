import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { notifyOpnameCreated, notifyOpnameCompleted, notifyOpnameApproved, notifyStockWarning } from "@/lib/notify";

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
    console.error("StockOpname GET Error:", error);
    return NextResponse.json({ success: false, error: "Gagal memuat data stok opname" }, { status: 500 });
  }
}

// POST — buat opname baru
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { locationId, notes, items } = body;
    // items: Array<{ itemId: string; systemStock: number; physicalStock: number }>

    if (!locationId || !items?.length) {
      return NextResponse.json({ success: false, error: "Lokasi dan item wajib diisi" }, { status: 400 });
    }

    const count = await prisma.stockOpname.count();
    const opnameNumber = `OPN-${new Date().getFullYear()}-${String(count + 1).padStart(3, "0")}`;

    const opname = await prisma.stockOpname.create({
      data: {
        opnameNumber,
        date: new Date(),
        locationId,
        auditorId: session.user.id,
        status: "DALAM_PROSES",
        notes: notes || null,
        items: {
          create: (items as { itemId: string; systemStock: number; physicalStock: number }[]).map(i => ({
            itemId: i.itemId,
            systemStock: i.systemStock,
            physicalStock: i.physicalStock,
            difference: i.physicalStock - i.systemStock,
          })),
        },
      },
    });

    // Notifikasi opname dibuat — ambil nama lokasi
    const loc = await prisma.location.findUnique({ where: { id: locationId }, select: { name: true } });
    await notifyOpnameCreated({ opnameNumber, locationName: loc?.name ?? locationId, itemCount: items.length, userId: session.user.id });

    return NextResponse.json({ success: true, data: opname });
  } catch (error) {
    console.error("StockOpname POST Error:", error);
    return NextResponse.json({ success: false, error: "Gagal membuat stok opname" }, { status: 500 });
  }
}

// PATCH — update status opname & apply stock correction if approved
export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ success: false, error: "ID dan status wajib diisi" }, { status: 400 });
    }

    // Role check — hanya SUPERVISOR ke atas yang bisa MENYETUJUI
    const approverRoles = ["SUPERVISOR", "ADMIN_GUDANG", "SUPER_ADMIN"];
    if (status === "DISETUJUI" && !approverRoles.includes(session.user.role)) {
      return NextResponse.json({ success: false, error: "Hanya Supervisor / Admin Gudang / Super Admin yang bisa menyetujui opname." }, { status: 403 });
    }

    const updated = await prisma.stockOpname.update({
      where: { id },
      data: { status },
      include: { items: { include: { item: true } } },
    });

    // Terapkan koreksi stok jika disetujui
    if (status === "DISETUJUI") {
      let selisihCount = 0;
      for (const oi of updated.items) {
        const newStock = oi.physicalStock;
        const newStatus = newStock === 0 ? "HABIS" : newStock <= oi.item.minStock ? "STOK_RENDAH" : "TERSEDIA";
        await prisma.item.update({ where: { id: oi.itemId }, data: { stock: newStock, status: newStatus } });
        if (oi.difference !== 0) selisihCount++;
        if (newStatus === "STOK_RENDAH" || newStatus === "HABIS") {
          await notifyStockWarning({ itemName: oi.item.name, sku: oi.item.sku, newStock, minStock: oi.item.minStock, unit: oi.item.unit, userId: session.user.id });
        }
      }
      const loc = await prisma.location.findUnique({ where: { id: updated.locationId }, select: { name: true } });
      await notifyOpnameApproved({ opnameNumber: updated.opnameNumber, locationName: loc?.name ?? "", selisihCount, userId: session.user.id });
    }

    if (status === "SELESAI") {
      const loc = await prisma.location.findUnique({ where: { id: updated.locationId }, select: { name: true } });
      await notifyOpnameCompleted({ opnameNumber: updated.opnameNumber, locationName: loc?.name ?? "", userId: session.user.id });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("StockOpname PATCH Error:", error);
    return NextResponse.json({ success: false, error: "Gagal update stok opname" }, { status: 500 });
  }
}
