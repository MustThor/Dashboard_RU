import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET — ambil semua notifikasi + jumlah belum dibaca
export async function GET() {
  try {
    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.notification.count({ where: { isRead: false } }),
    ]);
    return NextResponse.json({ success: true, data: notifications, unreadCount });
  } catch (error) {
    console.error("Notifications GET Error:", error);
    return NextResponse.json({ success: false, error: "Gagal memuat notifikasi" }, { status: 500 });
  }
}

// PATCH — tandai sebagai dibaca atau belum dibaca
export async function PATCH(req: Request) {
  try {
    const { id, all, unread } = await req.json();

    if (all) {
      await prisma.notification.updateMany({ where: { isRead: false }, data: { isRead: true } });
    } else if (id && unread) {
      // Kembalikan ke belum dibaca
      await prisma.notification.update({ where: { id }, data: { isRead: false } });
    } else if (id) {
      await prisma.notification.update({ where: { id }, data: { isRead: true } });
    } else {
      return NextResponse.json({ success: false, error: "Harus isi id atau all:true" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Notifications PATCH Error:", error);
    return NextResponse.json({ success: false, error: "Gagal update notifikasi" }, { status: 500 });
  }
}

// DELETE — hapus satu atau semua notifikasi
export async function DELETE(req: Request) {
  try {
    const { id, all } = await req.json();

    if (all) {
      await prisma.notification.deleteMany({});
    } else if (id) {
      await prisma.notification.delete({ where: { id } });
    } else {
      return NextResponse.json({ success: false, error: "Harus isi id atau all:true" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Notifications DELETE Error:", error);
    return NextResponse.json({ success: false, error: "Gagal menghapus notifikasi" }, { status: 500 });
  }
}
