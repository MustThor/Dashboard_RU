import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind CSS classes with clsx for conditional class composition.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format number as Indonesian Rupiah currency.
 */
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format date to Indonesian locale string.
 */
export function formatTanggal(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

/**
 * Format date to short Indonesian locale string.
 */
export function formatTanggalPendek(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

/**
 * Format date with time.
 */
export function formatTanggalWaktu(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

/**
 * Format number with Indonesian thousands separator.
 */
export function formatAngka(num: number): string {
  return new Intl.NumberFormat("id-ID").format(num);
}

/**
 * Calculate percentage with safety check for division by zero.
 */
export function hitungPersentase(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

/**
 * Generate initials from a full name (max 2 characters).
 */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Map role code to Indonesian display name.
 */
export function getRoleDisplayName(role: string): string {
  const roleMap: Record<string, string> = {
    SUPER_ADMIN: "Super Admin",
    ADMIN_GUDANG: "Admin Gudang",
    SUPERVISOR: "Supervisor",
    STAFF: "Staff",
    AUDITOR: "Auditor",
    VIEWER: "Viewer",
  };
  return roleMap[role] ?? role;
}

/**
 * Map status code to Indonesian display name.
 */
export function getStatusDisplayName(status: string): string {
  const statusMap: Record<string, string> = {
    TERSEDIA: "Tersedia",
    STOK_RENDAH: "Stok Rendah",
    HABIS: "Habis",
    PENDING: "Pending",
    DITERIMA: "Diterima",
    DIPERIKSA: "Diperiksa",
    DISIMPAN: "Disimpan",
    DISETUJUI: "Disetujui",
    DIKEMAS: "Dikemas",
    DIKIRIM: "Dikirim",
    DIPROSES: "Diproses",
    SELESAI: "Selesai",
    DRAFT: "Draft",
    DALAM_PROSES: "Dalam Proses",
  };
  return statusMap[status] ?? status;
}
