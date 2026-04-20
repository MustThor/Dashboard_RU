"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileBarChart, Download, FileSpreadsheet, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

const reports = [
  { title: "Laporan Stok Barang", description: "Seluruh inventaris dengan detail stok, harga, dan lokasi", icon: <FileBarChart size={20} /> },
  { title: "Laporan Barang Masuk", description: "Histori seluruh transaksi barang masuk berdasarkan periode", icon: <FileText size={20} /> },
  { title: "Laporan Barang Keluar", description: "Histori seluruh transaksi barang keluar berdasarkan periode", icon: <FileText size={20} /> },
  { title: "Laporan Transfer", description: "Detail perpindahan barang antar lokasi penyimpanan", icon: <FileSpreadsheet size={20} /> },
  { title: "Laporan Stok Opname", description: "Hasil audit stok dengan selisih fisik vs sistem", icon: <FileBarChart size={20} /> },
  { title: "Laporan Supplier", description: "Daftar supplier beserta histori transaksi", icon: <FileText size={20} /> },
];

export default function LaporanPage() {
  return (
    <div className="space-y-6">
      <div><h2 className="text-lg font-semibold">Laporan & Export</h2><p className="text-sm text-muted-foreground">Generate dan download laporan dalam format PDF atau Excel</p></div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reports.map((report) => (
          <Card key={report.title} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary mb-3">
                {report.icon}
              </div>
              <h3 className="font-semibold text-sm">{report.title}</h3>
              <p className="text-xs text-muted-foreground mt-1">{report.description}</p>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm" className="text-xs"><Download size={14} /> PDF</Button>
                <Button variant="outline" size="sm" className="text-xs"><FileSpreadsheet size={14} /> Excel</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
