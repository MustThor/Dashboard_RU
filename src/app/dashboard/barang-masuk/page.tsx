"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, TruckIcon, Plus, Trash2, X } from "lucide-react";
import { formatRupiah, formatTanggalPendek, getStatusDisplayName } from "@/lib/utils";
import { hasPermission, type Role } from "@/types";

// ─── Types ───────────────────────────────────────────────────────────────────
interface Inbound {
  id: string; poNumber: string; date: string; status: string; notes: string | null; totalValue: number;
  supplier: { name: string }; receiver: { name: string } | null;
  items: Array<{ quantity: number; price: number; item: { name: string; sku: string } }>;
}
interface Supplier { id: string; name: string; code: string }
interface Item     { id: string; name: string; sku: string; stock: number; unit: string; price: number }
interface FormRow  { itemId: string; quantity: number; price: number }

const statusVariant: Record<string, "info" | "warning" | "success" | "secondary"> = {
  PENDING: "warning", DITERIMA: "info", DIPERIKSA: "info", DISIMPAN: "success",
};

// ─── Component ───────────────────────────────────────────────────────────────
export default function BarangMasukPage() {
  const [inbounds,  setInbounds]  = useState<Inbound[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [items,     setItems]     = useState<Item[]>([]);
  const [search,    setSearch]    = useState("");
  const [loading,   setLoading]   = useState(true);
  const [showForm,  setShowForm]  = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState("");
  const { data: session } = useSession();
  const canCreate = hasPermission((session?.user?.role ?? "VIEWER") as Role, "inbound:create");

  // Form state
  const [supplierId, setSupplierId] = useState("");
  const [notes,      setNotes]      = useState("");
  const [rows,       setRows]       = useState<FormRow[]>([{ itemId: "", quantity: 1, price: 0 }]);

  useEffect(() => {
    Promise.all([
      fetch("/api/inbound").then(r => r.json()),
      fetch("/api/suppliers").then(r => r.json()),
      fetch("/api/items").then(r => r.json()),
    ]).then(([ib, sup, itm]) => {
      if (ib.success)  setInbounds(ib.data);
      if (sup.success) setSuppliers(sup.data);
      if (itm.success) setItems(itm.data);
    }).finally(() => setLoading(false));
  }, []);

  const filtered = inbounds.filter(i =>
    i.poNumber.toLowerCase().includes(search.toLowerCase()) ||
    i.supplier.name.toLowerCase().includes(search.toLowerCase())
  );

  function resetForm() {
    setSupplierId(""); setNotes("");
    setRows([{ itemId: "", quantity: 1, price: 0 }]);
    setError("");
  }

  function handleRowChange(idx: number, field: keyof FormRow, value: string | number) {
    setRows(prev => {
      const next = [...prev];
      if (field === "itemId") {
        const item = items.find(i => i.id === value);
        next[idx] = { ...next[idx], itemId: value as string, price: item?.price ?? 0 };
      } else {
        next[idx] = { ...next[idx], [field]: Number(value) };
      }
      return next;
    });
  }

  function addRow() { setRows(prev => [...prev, { itemId: "", quantity: 1, price: 0 }]); }
  function removeRow(idx: number) { setRows(prev => prev.filter((_, i) => i !== idx)); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!supplierId) return setError("Pilih supplier terlebih dahulu.");
    if (rows.some(r => !r.itemId || r.quantity < 1)) return setError("Lengkapi semua baris item.");

    setSaving(true);
    try {
      const res = await fetch("/api/inbound", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supplierId, notes, items: rows }),
      });
      const json = await res.json();
      if (!json.success) { setError(json.error); return; }

      // Refresh list
      const fresh = await fetch("/api/inbound").then(r => r.json());
      if (fresh.success) setInbounds(fresh.data);
      setShowForm(false);
      resetForm();
    } finally {
      setSaving(false);
    }
  }

  const totalForm = rows.reduce((s, r) => s + r.quantity * r.price, 0);

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
            <TruckIcon size={20} className="text-primary" /> Barang Masuk (Inbound)
          </h2>
          <p className="text-sm text-muted-foreground">{inbounds.length} transaksi tercatat</p>
        </div>
        {canCreate && (
          <Button onClick={() => { setShowForm(true); resetForm(); }} className="gap-2">
            <Plus size={16} /> Tambah Masuk
          </Button>
        )}
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input placeholder="Cari PO atau supplier..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
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
              {filtered.map(ib => (
                <TableRow key={ib.id}>
                  <TableCell className="font-mono text-xs font-medium">{ib.poNumber}</TableCell>
                  <TableCell className="text-sm">{formatTanggalPendek(ib.date)}</TableCell>
                  <TableCell className="text-sm">{ib.supplier.name}</TableCell>
                  <TableCell className="text-sm">{ib.receiver?.name ?? "-"}</TableCell>
                  <TableCell className="text-center">{ib.items.length}</TableCell>
                  <TableCell className="text-right text-sm">{formatRupiah(ib.totalValue)}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[ib.status] ?? "secondary"}>{getStatusDisplayName(ib.status)}</Badge>
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
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowForm(false)} />

          <div className="relative z-10 w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-t-xl sm:rounded-2xl bg-card border shadow-xl p-4 sm:p-6 space-y-4 sm:space-y-5">
            {/* Modal header */}
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-base">Tambah Barang Masuk</h3>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Supplier */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Supplier <span className="text-destructive">*</span></label>
                <select
                  className="w-full h-9 rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                  value={supplierId} onChange={e => setSupplierId(e.target.value)} required
                >
                  <option value="">Pilih supplier...</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
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
                      <div key={idx} className="grid grid-cols-[1fr_60px_80px_28px] sm:grid-cols-[1fr_80px_100px_32px] gap-1.5 sm:gap-2 items-start">
                        <select
                          className="h-9 rounded-md border bg-background px-2 text-sm outline-none focus:ring-1 focus:ring-ring"
                          value={row.itemId} onChange={e => handleRowChange(idx, "itemId", e.target.value)} required
                        >
                          <option value="">Pilih barang...</option>
                          {items.map(i => <option key={i.id} value={i.id}>{i.name} (stok: {i.stock})</option>)}
                        </select>
                        <div>
                          <Input
                            type="number" min={1} placeholder="Qty"
                            value={row.quantity} onChange={e => handleRowChange(idx, "quantity", e.target.value)}
                            onFocus={e => e.target.select()}
                            className="h-9 text-sm" required
                          />
                          {selected && (
                            <span className="block text-[10px] text-muted-foreground mt-0.5 pl-1">
                              stok: {selected.stock} {selected.unit}
                            </span>
                          )}
                        </div>
                        <Input
                          type="number" min={0} placeholder="Harga"
                          value={row.price} onChange={e => handleRowChange(idx, "price", e.target.value)}
                          onFocus={e => e.target.select()}
                          className="h-9 text-sm" required
                        />
                        <button type="button" onClick={() => removeRow(idx)} disabled={rows.length === 1}
                          className="flex h-9 w-8 items-center justify-center text-muted-foreground hover:text-destructive disabled:opacity-30 cursor-pointer">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>

                <p className="text-xs text-muted-foreground text-right">
                  Total: <span className="font-semibold text-foreground">{formatRupiah(totalForm)}</span>
                </p>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Catatan</label>
                <Input placeholder="Catatan opsional..." value={notes} onChange={e => setNotes(e.target.value)} />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <div className="flex gap-2 pt-1">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowForm(false)}>Batal</Button>
                <Button type="submit" className="flex-1" disabled={saving}>
                  {saving ? "Menyimpan..." : "Simpan Barang Masuk"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
