/**
 * notify.ts — helper untuk membuat notifikasi di database
 * Gunakan fungsi ini dari server-side API routes.
 */
import { prisma } from "@/lib/prisma";

type NotifType = "INFO" | "WARNING" | "SUCCESS" | "ERROR" | "STOCK" | "TRANSACTION";

interface NotifOptions {
  type: NotifType;
  title: string;
  message: string;
  userId?: string | null;
}

/** Buat satu notifikasi (fire-and-forget, tidak throw error) */
export async function createNotif(opt: NotifOptions) {
  try {
    await prisma.notification.create({
      data: {
        type:    opt.type,
        title:   opt.title,
        message: opt.message,
        userId:  opt.userId ?? null,
        isRead:  false,
      },
    });
  } catch (err) {
    // Jangan crash main flow jika notifikasi gagal
    console.error("[notify] Gagal membuat notifikasi:", err);
  }
}

/** Formatkan angka jadi ribuan */
function fmt(n: number) { return n.toLocaleString("id-ID"); }
function fmtRp(n: number) { return `Rp ${fmt(n)}`; }

// ──────────────────────────────────────────────────────────
//  BARANG MASUK
// ──────────────────────────────────────────────────────────

export async function notifyInboundCreated(opts: {
  poNumber: string;
  itemCount: number;
  totalValue: number;
  userId?: string | null;
}) {
  await createNotif({
    type:    "TRANSACTION",
    title:   `Barang Masuk ${opts.poNumber} Dicatat`,
    message: `${opts.itemCount} item • Total ${fmtRp(opts.totalValue)} telah dicatat ke gudang.`,
    userId:  opts.userId,
  });
}

// ──────────────────────────────────────────────────────────
//  BARANG KELUAR
// ──────────────────────────────────────────────────────────

export async function notifyOutboundCreated(opts: {
  soNumber: string;
  destination: string;
  itemCount: number;
  totalValue: number;
  userId?: string | null;
}) {
  await createNotif({
    type:    "TRANSACTION",
    title:   `Barang Keluar ${opts.soNumber} Dibuat`,
    message: `${opts.itemCount} item dikirim ke "${opts.destination}" • Total ${fmtRp(opts.totalValue)}.`,
    userId:  opts.userId,
  });
}

// ──────────────────────────────────────────────────────────
//  STOK RENDAH / HABIS  (per item)
// ──────────────────────────────────────────────────────────

export async function notifyStockWarning(opts: {
  itemName: string;
  sku: string;
  newStock: number;
  minStock: number;
  unit: string;
  userId?: string | null;
}) {
  const isHabis = opts.newStock === 0;
  await createNotif({
    type:    isHabis ? "ERROR" : "WARNING",
    title:   isHabis ? `Stok Habis: ${opts.itemName}` : `Stok Rendah: ${opts.itemName}`,
    message: isHabis
      ? `[${opts.sku}] Stok sudah 0 ${opts.unit}. Segera lakukan pengadaan.`
      : `[${opts.sku}] Sisa ${opts.newStock} ${opts.unit} (min. ${opts.minStock}). Segera restok.`,
    userId: opts.userId,
  });
}

// ──────────────────────────────────────────────────────────
//  STOK OPNAME
// ──────────────────────────────────────────────────────────

export async function notifyOpnameCreated(opts: {
  opnameNumber: string;
  locationName: string;
  itemCount: number;
  userId?: string | null;
}) {
  await createNotif({
    type:    "INFO",
    title:   `Stok Opname ${opts.opnameNumber} Dimulai`,
    message: `Audit ${opts.itemCount} item di lokasi "${opts.locationName}" sedang berjalan.`,
    userId:  opts.userId,
  });
}

export async function notifyOpnameApproved(opts: {
  opnameNumber: string;
  locationName: string;
  selisihCount: number;
  userId?: string | null;
}) {
  const selisih = opts.selisihCount;
  await createNotif({
    type:    selisih > 0 ? "WARNING" : "SUCCESS",
    title:   `Stok Opname ${opts.opnameNumber} Disetujui`,
    message: selisih > 0
      ? `Koreksi stok diterapkan: ${selisih} item memiliki selisih di lokasi "${opts.locationName}".`
      : `Semua stok cocok di lokasi "${opts.locationName}". Tidak ada selisih.`,
    userId: opts.userId,
  });
}

export async function notifyOpnameCompleted(opts: {
  opnameNumber: string;
  locationName: string;
  userId?: string | null;
}) {
  await createNotif({
    type:    "SUCCESS",
    title:   `Stok Opname ${opts.opnameNumber} Selesai`,
    message: `Penghitungan stok di "${opts.locationName}" telah selesai, menunggu persetujuan.`,
    userId:  opts.userId,
  });
}
