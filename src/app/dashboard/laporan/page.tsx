"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileBarChart, FileText, FileSpreadsheet, Download, Loader2 } from "lucide-react";
import { exportToPdf, exportToExcel } from "@/lib/export-utils";
import { formatRupiah, formatTanggalPendek } from "@/lib/utils";

// ─── helper: format tanggal & waktu untuk nama file ────────────────────────
function nowStamp() {
  return new Date().toISOString().slice(0, 10);
}

// ─── fetchers & builders per laporan ────────────────────────────────────────

async function buildStokBarang() {
  const res  = await fetch("/api/items");
  const json = await res.json();
  if (!json.success) throw new Error(json.error);
  const headers = ["SKU", "Nama Barang", "Kategori", "Lokasi", "Stok", "Satuan", "Harga Pokok", "Nilai Total"];
  const rows = json.data.map((i: any) => [
    i.sku, i.name,
    i.category?.name ?? "-",
    i.location?.name ?? "-",
    String(i.stock),
    i.unit,
    formatRupiah(i.price ?? 0),
    formatRupiah((i.price ?? 0) * i.stock),
  ]);
  return { title: "Laporan Stok Barang", headers, rows, filename: `stok-barang-${nowStamp()}` };
}

async function buildBarangMasuk() {
  const res  = await fetch("/api/inbound");
  const json = await res.json();
  if (!json.success) throw new Error(json.error);
  const headers = ["No. PO", "Tanggal", "Supplier", "Jumlah Item", "Total Nilai", "Status"];
  const rows = json.data.map((ib: any) => [
    ib.poNumber ?? "-",
    formatTanggalPendek(ib.date),
    ib.supplier?.name ?? "-",
    String(ib.items?.length ?? 0),
    formatRupiah(ib.totalValue ?? 0),
    ib.status,
  ]);
  return { title: "Laporan Barang Masuk", headers, rows, filename: `barang-masuk-${nowStamp()}` };
}

async function buildBarangKeluar() {
  const res  = await fetch("/api/outbound");
  const json = await res.json();
  if (!json.success) throw new Error(json.error);
  const headers = ["No. SO", "Tanggal", "Tujuan", "Pengirim", "Jumlah Item", "Total Nilai", "Status"];
  const rows = json.data.map((ob: any) => [
    ob.soNumber,
    formatTanggalPendek(ob.date),
    ob.destination,
    ob.shipper?.name ?? "-",
    String(ob.items?.length ?? 0),
    formatRupiah(ob.totalValue ?? 0),
    ob.status,
  ]);
  return { title: "Laporan Barang Keluar", headers, rows, filename: `barang-keluar-${nowStamp()}` };
}


async function buildStokOpname() {
  const res  = await fetch("/api/stock-opname");
  const json = await res.json();
  if (!json.success) throw new Error(json.error);
  const headers = ["No. Opname", "Tanggal", "Lokasi", "Jumlah Item", "Selisih Total", "Status"];
  const rows = (json.data ?? []).map((op: any) => {
    const totalSelisih = (op.items ?? []).reduce((sum: number, it: any) => sum + Math.abs((it.physicalQty ?? 0) - (it.systemQty ?? 0)), 0);
    return [
      op.opnameNumber ?? "-",
      formatTanggalPendek(op.date),
      op.location?.name ?? "-",
      String(op.items?.length ?? 0),
      String(totalSelisih),
      op.status,
    ];
  });
  return { title: "Laporan Stok Opname", headers, rows, filename: `stok-opname-${nowStamp()}` };
}

async function buildSupplier() {
  const res  = await fetch("/api/suppliers");
  const json = await res.json();
  if (!json.success) throw new Error(json.error);
  const headers = ["Kode", "Nama Supplier", "Contact Person", "Email", "Telepon", "Kota", "Total Transaksi", "Status"];
  const rows = json.data.map((s: any) => [
    s.code, s.name,
    s.contactPerson ?? "-",
    s.email ?? "-",
    s.phone ?? "-",
    s.city ?? "-",
    String(s._count?.inbounds ?? 0),
    s.isActive ? "Aktif" : "Nonaktif",
  ]);
  return { title: "Laporan Supplier", headers, rows, filename: `supplier-${nowStamp()}` };
}

// ─── Report config ───────────────────────────────────────────────────────────
const REPORTS = [
  {
    key:         "stok",
    title:       "Laporan Stok Barang",
    description: "Seluruh inventaris dengan detail stok, harga, dan lokasi",
    icon:        <FileBarChart size={20} />,
    build:       buildStokBarang,
  },
  {
    key:         "masuk",
    title:       "Laporan Barang Masuk",
    description: "Histori seluruh transaksi barang masuk berdasarkan periode",
    icon:        <FileText size={20} />,
    build:       buildBarangMasuk,
  },
  {
    key:         "keluar",
    title:       "Laporan Barang Keluar",
    description: "Histori seluruh transaksi barang keluar berdasarkan periode",
    icon:        <FileText size={20} />,
    build:       buildBarangKeluar,
  },
  {
    key:         "opname",
    title:       "Laporan Stok Opname",
    description: "Hasil audit stok dengan selisih fisik vs sistem",
    icon:        <FileBarChart size={20} />,
    build:       buildStokOpname,
  },
  {
    key:         "supplier",
    title:       "Laporan Supplier",
    description: "Daftar supplier beserta histori transaksi",
    icon:        <FileText size={20} />,
    build:       buildSupplier,
  },
];

// ─── Component ───────────────────────────────────────────────────────────────
export default function LaporanPage() {
  // loading state per card per format: `${key}-pdf` | `${key}-excel`
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [errors,  setErrors]  = useState<Record<string, string>>({});

  function setLoad(key: string, val: boolean) {
    setLoading(prev => ({ ...prev, [key]: val }));
  }
  function setErr(key: string, msg: string) {
    setErrors(prev => ({ ...prev, [key]: msg }));
  }

  async function handleExport(reportKey: string, build: () => Promise<any>, format: "pdf" | "excel") {
    const stateKey = `${reportKey}-${format}`;
    setLoad(stateKey, true);
    setErr(reportKey, "");
    try {
      const data = await build();
      if (format === "pdf") {
        exportToPdf(data);
      } else {
        exportToExcel(data);
      }
    } catch (e: any) {
      setErr(reportKey, e.message ?? "Gagal mengambil data");
    } finally {
      setLoad(stateKey, false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Laporan &amp; Export</h2>
        <p className="text-sm text-muted-foreground">Generate dan download laporan dalam format PDF atau Excel</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {REPORTS.map(report => {
          const pdfLoading   = loading[`${report.key}-pdf`];
          const excelLoading = loading[`${report.key}-excel`];
          const err          = errors[report.key];

          return (
            <Card key={report.key} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary mb-3">
                  {report.icon}
                </div>
                <h3 className="font-semibold text-sm">{report.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{report.description}</p>

                {err && <p className="text-xs text-destructive mt-2">{err}</p>}

                <div className="flex gap-2 mt-4">
                  {/* PDF */}
                  <Button
                    variant="outline" size="sm" className="text-xs gap-1.5 flex-1"
                    disabled={pdfLoading || excelLoading}
                    onClick={() => handleExport(report.key, report.build, "pdf")}
                  >
                    {pdfLoading
                      ? <Loader2 size={13} className="animate-spin" />
                      : <Download size={13} />
                    }
                    PDF
                  </Button>

                  {/* Excel */}
                  <Button
                    variant="outline" size="sm" className="text-xs gap-1.5 flex-1"
                    disabled={pdfLoading || excelLoading}
                    onClick={() => handleExport(report.key, report.build, "excel")}
                  >
                    {excelLoading
                      ? <Loader2 size={13} className="animate-spin" />
                      : <FileSpreadsheet size={13} />
                    }
                    Excel
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
