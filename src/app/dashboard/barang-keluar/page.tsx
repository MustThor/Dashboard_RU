"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, PackageOpen, Plus, Trash2, X } from "lucide-react";
import { formatRupiah, formatTanggalPendek, getStatusDisplayName } from "@/lib/utils";
import { hasPermission, type Role } from "@/types";

// ─── Types ───────────────────────────────────────────────────────────────────
interface Outbound {
  id: string; soNumber: string; date: string; status: string; destination: string; totalValue: number;
  shipper: { name: string } | null;
  items: Array<{ quantity: number; price: number; item: { name: string; sku: string } }>;
}
interface Item    { id: string; name: string; sku: string; stock: number; unit: string }
interface FormRow { itemId: string; quantity: number }

const statusVariant: Record<string, "info" | "warning" | "success" | "secondary" | "destructive"> = {
  PENDING: "warning", DIKEMAS: "info", DISETUJUI: "success", DIKIRIM: "success",
};

// ─── Component ───────────────────────────────────────────────────────────────
export default function BarangKeluarPage() {
  const [outbounds,  setOutbounds] = useState<Outbound[]>([]);
  const [items,      setItems]     = useState<Item[]>([]);
  const [search,     setSearch]    = useState("");
  const [loading,    setLoading]   = useState(true);
  const [showForm,   setShowForm]  = useState(false);
  const [saving,     setSaving]    = useState(false);
  const [error,      setError]     = useState("");
  const { data: session } = useSession();
  const canCreate = hasPermission((session?.user?.role ?? "VIEWER") as Role, "outbound:create");

  // Form state
  const [destination, setDestination] = useState("");
  const [notes,       setNotes]       = useState("");
  const [rows,        setRows]        = useState<FormRow[]>([{ itemId: "", quantity: 1 }]);

  useEffect(() => {
    Promise.all([
      fetch("/api/outbound").then(r => r.json()),
      fetch("/api/items").then(r => r.json()),
    ]).then(([ob, itm]) => {
      if (ob.success)  setOutbounds(ob.data);
      if (itm.success) setItems(itm.data);
    }).finally(() => setLoading(false));
  }, []);

  const filtered = outbounds.filter(o =>
    o.soNumber.toLowerCase().includes(search.toLowerCase()) ||
    o.destination.toLowerCase().includes(search.toLowerCase())
  );

  function resetForm() { setDestination(""); setNotes(""); setRows([{ itemId: "", quantity: 1 }]); setError(""); }

  function handleRowChange(idx: number, field: keyof FormRow, value: string | number) {
    setRows(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: field === "quantity" ? Number(value) : value };
      return next;
    });
  }

  function addRow()          { setRows(prev => [...prev, { itemId: "", quantity: 1 }]); }
  function removeRow(i: number) { setRows(prev => prev.filter((_, j) => j !== i)); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!destination.trim()) return setError("Tujuan pengiriman wajib diisi.");
    if (rows.some(r => !r.itemId || r.quantity < 1)) return setError("Lengkapi semua baris item.");

    // Client-side stock check
    for (const r of rows) {
      const item = items.find(i => i.id === r.itemId);
      if (item && item.stock < r.quantity) {
        return setError(`Stok "${item.name}" tidak cukup (tersedia: ${item.stock} ${item.unit})`);
      }
    }

    setSaving(true);
    try {
      const res = await fetch("/api/outbound", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destination, notes, items: rows }),
      });
      const json = await res.json();
      if (!json.success) { setError(json.error); return; }

      // Refresh
      const [fresh, freshItems] = await Promise.all([
        fetch("/api/outbound").then(r => r.json()),
        fetch("/api/items").then(r => r.json()),
      ]);
      if (fresh.success)      setOutbounds(fresh.data);
      if (freshItems.success) setItems(freshItems.data);
      setShowForm(false);
      resetForm();
    } finally {
      setSaving(false);
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <PackageOpen size={20} className="text-primary" /> Barang Keluar (Outbound)
          </h2>
          <p className="text-sm text-muted-foreground">{outbounds.length} transaksi tercatat</p>
        </div>
        {canCreate && (
          <Button onClick={() => { setShowForm(true); resetForm(); }} className="gap-2">
            <Plus size={16} /> Tambah Keluar
          </Button>
        )}
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input placeholder="Cari SO atau tujuan..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
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
              {filtered.map(ob => (
                <TableRow key={ob.id}>
                  <TableCell className="font-mono text-xs font-medium">{ob.soNumber}</TableCell>
                  <TableCell className="text-sm">{formatTanggalPendek(ob.date)}</TableCell>
                  <TableCell className="text-sm max-w-[160px] truncate">{ob.destination}</TableCell>
                  <TableCell className="text-sm">{ob.shipper?.name ?? "-"}</TableCell>
                  <TableCell className="text-center">{ob.items.length}</TableCell>
                  <TableCell className="text-right text-sm">{formatRupiah(ob.totalValue)}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[ob.status] ?? "secondary"}>{getStatusDisplayName(ob.status)}</Badge>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Tidak ada data</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ── Modal Form ── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowForm(false)} />

          <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-card border shadow-xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-base">Tambah Barang Keluar</h3>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Destination */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Tujuan Pengiriman <span className="text-destructive">*</span></label>
                <Input placeholder="Contoh: Toko ABC – Bandung" value={destination} onChange={e => setDestination(e.target.value)} required />
              </div>

              {/* Items */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Daftar Barang <span className="text-destructive">*</span></label>
                  <Button type="button" variant="outline" size="sm" onClick={addRow} className="gap-1 h-7 text-xs">
                    <Plus size={12} /> Tambah Baris
                  </Button>
                </div>

                <div className="space-y-2">
                  {rows.map((row, idx) => {
                    const selected = items.find(i => i.id === row.itemId);
                    return (
                      <div key={idx} className="grid grid-cols-[1fr_90px_32px] gap-2 items-start">
                        <select
                          className="h-9 rounded-md border bg-background px-2 text-sm outline-none focus:ring-1 focus:ring-ring"
                          value={row.itemId} onChange={e => handleRowChange(idx, "itemId", e.target.value)} required
                        >
                          <option value="">Pilih barang...</option>
                          {items.filter(i => i.stock > 0).map(i => (
                            <option key={i.id} value={i.id}>{i.name} (stok: {i.stock} {i.unit})</option>
                          ))}
                        </select>
                        <div>
                          <Input
                            type="number" min={1} max={selected?.stock ?? 999}
                            placeholder="Qty"
                            value={row.quantity}
                            onChange={e => handleRowChange(idx, "quantity", e.target.value)}
                            onFocus={e => e.target.select()}
                            className="h-9 text-sm" required
                          />
                          {selected && (
                            <span className="block text-[10px] text-muted-foreground mt-0.5 pl-1">
                              maks {selected.stock} {selected.unit}
                            </span>
                          )}
                        </div>
                        <button type="button" onClick={() => removeRow(idx)} disabled={rows.length === 1}
                          className="flex h-9 w-8 items-center justify-center text-muted-foreground hover:text-destructive disabled:opacity-30 cursor-pointer">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1.5 pt-2">
                <label className="text-sm font-medium">Catatan</label>
                <Input placeholder="Catatan opsional..." value={notes} onChange={e => setNotes(e.target.value)} />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <div className="flex gap-2 pt-1">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowForm(false)}>Batal</Button>
                <Button type="submit" className="flex-1" disabled={saving}>
                  {saving ? "Menyimpan..." : "Simpan Barang Keluar"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
