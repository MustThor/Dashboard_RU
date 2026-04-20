import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const notifications = await prisma.notification.findMany({
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ success: true, data: notifications });
  } catch (error) {
    console.error("Notifications API Error:", error);
    return NextResponse.json({ success: false, error: "Gagal memuat notifikasi" }, { status: 500 });
  }
}
