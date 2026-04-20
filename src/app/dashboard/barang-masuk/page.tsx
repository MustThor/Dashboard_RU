"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Search, TruckIcon } from "lucide-react";
import { formatRupiah, formatTanggalPendek, getStatusDisplayName } from "@/lib/utils";

interface Inbound {
  id: string; poNumber: string; date: string; status: string; notes: string | null; totalValue: number;
  supplier: { name: string }; receiver: { name: string } | null;
  items: Array<{ quantity: number; price: number; item: { name: string; sku: string } }>;
}

const statusVariant: Record<string, "info" | "warning" | "success" | "secondary"> = {
  PENDING: "warning", DITERIMA: "info", DIPERIKSA: "info", DISIMPAN: "success",
};

export default function BarangMasukPage() {
  const [inbounds, setInbounds] = useState<Inbound[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/inbound").then((r) => r.json()).then((j) => { if (j.success) setInbounds(j.data); }).finally(() => setLoading(false));
  }, []);

  const filtered = inbounds.filter((i) =>
    i.poNumber.toLowerCase().includes(search.toLowerCase()) ||
    i.supplier.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;

  return (
    <div className="space-y-6">
      <div><h2 className="text-lg font-semibold">Barang Masuk (Inbound)</h2><p className="text-sm text-muted-foreground">{inbounds.length} transaksi tercatat</p></div>

      <Card>
        <CardHeader className="pb-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input placeholder="Cari PO atau supplier..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No. PO</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Penerima</TableHead>
                <TableHead className="text-center">Item</TableHead>
                <TableHead className="text-right">Nilai Total</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((ib) => (
                <TableRow key={ib.id}>
                  <TableCell className="font-mono text-xs font-medium">{ib.poNumber}</TableCell>
                  <TableCell className="text-sm">{formatTanggalPendek(ib.date)}</TableCell>
                  <TableCell className="text-sm">{ib.supplier.name}</TableCell>
                  <TableCell className="text-sm">{ib.receiver?.name ?? "-"}</TableCell>
                  <TableCell className="text-center">{ib.items.length}</TableCell>
                  <TableCell className="text-right text-sm">{formatRupiah(ib.totalValue)}</TableCell>
                  <TableCell><Badge variant={statusVariant[ib.status] ?? "secondary"}>{getStatusDisplayName(ib.status)}</Badge></TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Tidak ada data</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
