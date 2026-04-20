"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { formatRupiah, formatTanggalPendek, getStatusDisplayName } from "@/lib/utils";

interface Outbound {
  id: string; soNumber: string; date: string; destination: string; status: string; notes: string | null; totalValue: number;
  shipper: { name: string } | null;
  items: Array<{ quantity: number; price: number; item: { name: string; sku: string } }>;
}

const statusVariant: Record<string, "info" | "warning" | "success" | "secondary"> = {
  PENDING: "warning", DISETUJUI: "info", DIKEMAS: "info", DIKIRIM: "success",
};

export default function BarangKeluarPage() {
  const [outbounds, setOutbounds] = useState<Outbound[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetch("/api/outbound").then((r) => r.json()).then((j) => { if (j.success) setOutbounds(j.data); }).finally(() => setLoading(false)); }, []);

  const filtered = outbounds.filter((o) =>
    o.soNumber.toLowerCase().includes(search.toLowerCase()) ||
    o.destination.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;

  return (
    <div className="space-y-6">
      <div><h2 className="text-lg font-semibold">Barang Keluar (Outbound)</h2><p className="text-sm text-muted-foreground">{outbounds.length} transaksi tercatat</p></div>
      <Card>
        <CardHeader className="pb-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input placeholder="Cari SO atau tujuan..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No. SO</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Tujuan</TableHead>
                <TableHead>Pengirim</TableHead>
                <TableHead className="text-center">Item</TableHead>
                <TableHead className="text-right">Nilai Total</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((ob) => (
                <TableRow key={ob.id}>
                  <TableCell className="font-mono text-xs font-medium">{ob.soNumber}</TableCell>
                  <TableCell className="text-sm">{formatTanggalPendek(ob.date)}</TableCell>
                  <TableCell className="text-sm">{ob.destination}</TableCell>
                  <TableCell className="text-sm">{ob.shipper?.name ?? "-"}</TableCell>
                  <TableCell className="text-center">{ob.items.length}</TableCell>
                  <TableCell className="text-right text-sm">{formatRupiah(ob.totalValue)}</TableCell>
                  <TableCell><Badge variant={statusVariant[ob.status] ?? "secondary"}>{getStatusDisplayName(ob.status)}</Badge></TableCell>
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
