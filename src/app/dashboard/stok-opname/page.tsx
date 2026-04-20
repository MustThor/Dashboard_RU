"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatTanggalPendek, getStatusDisplayName } from "@/lib/utils";

interface StockOpname {
  id: string; opnameNumber: string; date: string; status: string; notes: string | null;
  location: { name: string }; auditor: { name: string } | null;
  items: Array<{ systemStock: number; physicalStock: number; difference: number; item: { name: string; sku: string } }>;
}

const statusVariant: Record<string, "info" | "warning" | "success" | "secondary"> = {
  DRAFT: "secondary", DALAM_PROSES: "warning", SELESAI: "info", DISETUJUI: "success",
};

export default function StokOpnamePage() {
  const [opnames, setOpnames] = useState<StockOpname[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetch("/api/stock-opname").then((r) => r.json()).then((j) => { if (j.success) setOpnames(j.data); }).finally(() => setLoading(false)); }, []);

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;

  return (
    <div className="space-y-6">
      <div><h2 className="text-lg font-semibold">Stok Opname / Audit</h2><p className="text-sm text-muted-foreground">{opnames.length} opname tercatat</p></div>
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No. Opname</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Lokasi</TableHead>
                <TableHead>Auditor</TableHead>
                <TableHead className="text-center">Item Diperiksa</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {opnames.map((op) => (
                <TableRow key={op.id}>
                  <TableCell className="font-mono text-xs font-medium">{op.opnameNumber}</TableCell>
                  <TableCell className="text-sm">{formatTanggalPendek(op.date)}</TableCell>
                  <TableCell className="text-sm">{op.location.name}</TableCell>
                  <TableCell className="text-sm">{op.auditor?.name ?? "-"}</TableCell>
                  <TableCell className="text-center">{op.items.length}</TableCell>
                  <TableCell><Badge variant={statusVariant[op.status] ?? "secondary"}>{getStatusDisplayName(op.status)}</Badge></TableCell>
                </TableRow>
              ))}
              {opnames.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Tidak ada data</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
