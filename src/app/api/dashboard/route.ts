import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalItems,
      lowStockCount,
      totalCategories,
      totalLocations,
      totalSuppliers,
      inboundToday,
      outboundToday,
      recentInbound,
      recentOutbound,
      itemsByCategory,
      locationCapacity,
    ] = await Promise.all([
      prisma.item.count(),
      prisma.item.count({ where: { status: { in: ["STOK_RENDAH", "HABIS"] } } }),
      prisma.category.count({ where: { isActive: true } }),
      prisma.location.count({ where: { isActive: true } }),
      prisma.supplier.count({ where: { isActive: true } }),
      prisma.inbound.count({ where: { date: { gte: today } } }),
      prisma.outbound.count({ where: { date: { gte: today } } }),
      prisma.inbound.findMany({
        take: 5,
        orderBy: { date: "desc" },
        include: { supplier: true },
      }),
      prisma.outbound.findMany({
        take: 5,
        orderBy: { date: "desc" },
      }),
      prisma.category.findMany({
        include: { _count: { select: { items: true } } },
        where: { isActive: true },
      }),
      prisma.location.findMany({
        where: { isActive: true },
        select: { name: true, capacity: true, used: true, type: true },
      }),
    ]);

    // Aggregate total value
    const totalValueResult = await prisma.item.aggregate({
      _sum: { price: true },
    });

    // Monthly inbound/outbound for chart (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyInbound = await prisma.inbound.findMany({
      where: { date: { gte: sixMonthsAgo } },
      select: { date: true, totalValue: true },
    });

    const monthlyOutbound = await prisma.outbound.findMany({
      where: { date: { gte: sixMonthsAgo } },
      select: { date: true, totalValue: true },
    });

    // Group by month
    const months: Record<string, { masuk: number; keluar: number }> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      months[key] = { masuk: 0, keluar: 0 };
    }

    monthlyInbound.forEach((ib: { date: Date; totalValue: number }) => {
      const key = `${ib.date.getFullYear()}-${String(ib.date.getMonth() + 1).padStart(2, "0")}`;
      if (months[key]) months[key].masuk += 1;
    });

    monthlyOutbound.forEach((ob: { date: Date; totalValue: number }) => {
      const key = `${ob.date.getFullYear()}-${String(ob.date.getMonth() + 1).padStart(2, "0")}`;
      if (months[key]) months[key].keluar += 1;
    });

    const trendData = Object.entries(months).map(([month, data]) => ({
      month: new Date(month + "-01").toLocaleDateString("id-ID", { month: "short" }),
      masuk: data.masuk,
      keluar: data.keluar,
    }));

    // Low stock items
    const lowStockItems = await prisma.item.findMany({
      where: { status: { in: ["STOK_RENDAH", "HABIS"] } },
      include: { category: true, location: true },
      take: 10,
    });

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalItems,
          inboundToday,
          outboundToday,
          lowStockCount,
          totalValue: totalValueResult._sum.price ?? 0,
          totalCategories,
          totalLocations,
          totalSuppliers,
        },
        recentInbound,
        recentOutbound,
        itemsByCategory: itemsByCategory.map((c: { name: string; _count: { items: number } }) => ({
          name: c.name,
          jumlah: c._count.items,
        })),
        locationCapacity: locationCapacity.map((l: { name: string; capacity: number; used: number; type: string }) => ({
          name: l.name,
          kapasitas: l.capacity,
          terpakai: l.used,
          tipe: l.type,
        })),
        trendData,
        lowStockItems,
      },
    });
  } catch (error) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal memuat data dashboard" },
      { status: 500 }
    );
  }
}
