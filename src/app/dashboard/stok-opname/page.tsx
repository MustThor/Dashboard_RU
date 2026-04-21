"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClipboardCheck, Plus, Trash2, X, ChevronDown, ChevronRight } from "lucide-react";
import { formatTanggalPendek, getStatusDisplayName } from "@/lib/utils";
import { hasPermission, type Role } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────
interface OpnameItem {
  id: string; systemStock: number; physicalStock: number; difference: number;
  item: { name: string; sku: string };
}
interface StockOpname {
  id: string; opnameNumber: string; date: string; status: string; notes: string | null;
  location: { name: string }; auditor: { name: string } | null;
  items: OpnameItem[];
}
interface Location { id: string; name: string; code: string }
interface Item     { id: string; name: string; sku: string; stock: number; unit: string }
interface FormRow  { itemId: string; systemStock: number; physicalStock: number }

const statusVariant: Record<string, "info" | "warning" | "success" | "secondary"> = {
  DRAFT: "secondary", DALAM_PROSES: "warning", SELESAI: "info", DISETUJUI: "success",
};

const STATUS_FLOW = ["DRAFT", "DALAM_PROSES", "SELESAI", "DISETUJUI"];

// ─── Component ────────────────────────────────────────────────────────────────
export default function StokOpnamePage() {
  const [opnames,   setOpnames]   = useState<StockOpname[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [items,     setItems]     = useState<Item[]>([]);
  const [loading,   setLoading]   = useState(true);
  const { data: session } = useSession();
  const userRole = (session?.user?.role ?? "VIEWER") as Role;
  const canCreate  = hasPermission(userRole, "opname:create");
  const canApprove = hasPermission(userRole, "opname:approve");

  const [showForm,  setShowForm]  = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState("");
  const [expanded,  setExpanded]  = useState<string | null>(null);

  // Form state
  const [locationId, setLocationId] = useState("");
  const [notes,      setNotes]      = useState("");
  const [rows,       setRows]       = useState<FormRow[]>([{ itemId: "", systemStock: 0, physicalStock: 0 }]);

  function loadData() {
    return Promise.all([
      fetch("/api/stock-opname").then(r => r.json()),
      fetch("/api/locations").then(r => r.json()),
      fetch("/api/items").then(r => r.json()),
    ]).then(([op, loc, itm]) => {
      if (op.success)  setOpnames(op.data);
      if (loc.success) setLocations(loc.data);
      if (itm.success) setItems(itm.data);
    });
  }

  useEffect(() => { loadData().finally(() => setLoading(false)); }, []);

  function resetForm() {
    setLocationId(""); setNotes("");
    setRows([{ itemId: "", systemStock: 0, physicalStock: 0 }]);
    setError("");
  }

  function handleRowChange(idx: number, field: keyof FormRow, value: string | number) {
    setRows(prev => {
      const next = [...prev];
      if (field === "itemId") {
        const item = items.find(i => i.id === value);
        next[idx] = { ...next[idx], itemId: value as string, systemStock: item?.stock ?? 0, physicalStock: item?.stock ?? 0 };
      } else {
        next[idx] = { ...next[idx], [field]: Number(value) };
      }
      return next;
    });
  }

  function addRow()             { setRows(p => [...p, { itemId: "", systemStock: 0, physicalStock: 0 }]); }
  function removeRow(i: number) { setRows(p => p.filter((_, j) => j !== i)); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!locationId) return setError("Pilih lokasi terlebih dahulu.");
    if (rows.some(r => !r.itemId)) return setError("Lengkapi semua baris item.");

    setSaving(true);
    try {
      const res = await fetch("/api/stock-opname", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locationId, notes, items: rows }),
      });
      const json = await res.json();
      if (!json.success) { setError(json.error); return; }
      await loadData();
      setShowForm(false); resetForm();
    } finally { setSaving(false); }
  }

  async function updateStatus(id: string, status: string) {
    const res = await fetch("/api/stock-opname", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    const json = await res.json();
    if (json.success) await loadData();
    else alert(json.error);
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
            <ClipboardCheck size={20} className="text-primary" /> Stok Opname / Audit
          </h2>
          <p className="text-sm text-muted-foreground">{opnames.length} opname tercatat</p>
        </div>
        {canCreate && (
          <Button onClick={() => { setShowForm(true); resetForm(); }} className="gap-2">
            <Plus size={16} /> Buat Opname
          </Button>
        )}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="pt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-6" />
                <TableHead>No. Opname</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Lokasi</TableHead>
                <TableHead>Auditor</TableHead>
                <TableHead className="text-center">Item</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {opnames.map(op => {
                const currentIdx = STATUS_FLOW.indexOf(op.status);
                const nextStatus = STATUS_FLOW[currentIdx + 1];
                const isOpen = expanded === op.id;

                return (
                  <React.Fragment key={op.id}>
                    <TableRow className="cursor-pointer hover:bg-muted/40">
                      <TableCell onClick={() => setExpanded(isOpen ? null : op.id)}>
                        {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </TableCell>
                      <TableCell className="font-mono text-xs font-medium">{op.opnameNumber}</TableCell>
                      <TableCell className="text-sm">{formatTanggalPendek(op.date)}</TableCell>
                      <TableCell className="text-sm">{op.location.name}</TableCell>
                      <TableCell className="text-sm">{op.auditor?.name ?? "-"}</TableCell>
                      <TableCell className="text-center">{op.items.length}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant[op.status] ?? "secondary"}>
                          {getStatusDisplayName(op.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {nextStatus && (nextStatus !== "DISETUJUI" || canApprove) && (
                          <Button
                            variant="outline" size="sm" className="h-7 text-xs"
                            onClick={() => updateStatus(op.id, nextStatus)}
                          >
                            → {getStatusDisplayName(nextStatus)}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>

                    {/* Expanded rows */}
                    {isOpen && op.items.map(oi => (
                      <TableRow key={oi.id} className="bg-muted/20 text-xs">
                        <TableCell />
                        <TableCell colSpan={2} className="pl-6 font-mono text-muted-foreground">{oi.item.sku}</TableCell>
                        <TableCell colSpan={2}>{oi.item.name}</TableCell>
                        <TableCell className="text-center">
                          <span className="text-muted-foreground">Sistem: {oi.systemStock}</span>
                          {" / "}
                          <span className="font-medium">Fisik: {oi.physicalStock}</span>
                        </TableCell>
                        <TableCell colSpan={2}>
                          <Badge variant={oi.difference === 0 ? "success" : oi.difference > 0 ? "info" : "destructive"} className="text-[10px]">
                            {oi.difference > 0 ? `+${oi.difference}` : oi.difference}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </React.Fragment>
                );
              })}
              {opnames.length === 0 && (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Tidak ada data</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ── Modal Form ── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative z-10 w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-t-xl sm:rounded-2xl bg-card border shadow-xl p-4 sm:p-6 space-y-4 sm:space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-base">Buat Stok Opname Baru</h3>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Location */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Lokasi <span className="text-destructive">*</span></label>
                <select
                  className="w-full h-9 rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                  value={locationId} onChange={e => setLocationId(e.target.value)} required
                >
                  <option value="">Pilih lokasi...</option>
                  {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
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

                {/* Column headers */}
                <div className="grid grid-cols-[1fr_75px_75px_28px] sm:grid-cols-[1fr_90px_90px_32px] gap-1.5 sm:gap-2 px-1">
                  <span className="text-[11px] text-muted-foreground">Barang</span>
                  <span className="text-[11px] text-muted-foreground truncate">Stok Sistem</span>
                  <span className="text-[11px] text-muted-foreground truncate">Stok Fisik</span>
                  <span />
                </div>

                <div className="space-y-2">
                  {rows.map((row, idx) => (
                    <div key={idx} className="grid grid-cols-[1fr_75px_75px_28px] sm:grid-cols-[1fr_90px_90px_32px] gap-1.5 sm:gap-2 items-center">
                      <select
                        className="h-9 rounded-md border bg-background px-2 text-sm outline-none focus:ring-1 focus:ring-ring"
                        value={row.itemId} onChange={e => handleRowChange(idx, "itemId", e.target.value)} required
                      >
                        <option value="">Pilih barang...</option>
                        {items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                      </select>
                      <Input
                        type="number" min={0} value={row.systemStock}
                        onChange={e => handleRowChange(idx, "systemStock", e.target.value)}
                        className="h-9 text-sm" placeholder="Sistem"
                      />
                      <Input
                        type="number" min={0} value={row.physicalStock}
                        onChange={e => handleRowChange(idx, "physicalStock", e.target.value)}
                        className="h-9 text-sm" placeholder="Fisik"
                      />
                      <button type="button" onClick={() => removeRow(idx)} disabled={rows.length === 1}
                        className="flex h-9 w-8 items-center justify-center text-muted-foreground hover:text-destructive disabled:opacity-30 cursor-pointer">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
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
                  {saving ? "Menyimpan..." : "Buat Opname"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
