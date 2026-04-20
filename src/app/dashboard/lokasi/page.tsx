"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MapPin, Plus, Pencil, X, Trash2 } from "lucide-react";
import { hasPermission, type Role } from "@/types";

interface Location {
  id: string; name: string; code: string; type: string | null;
  capacity: number | null; used: number; description: string | null; isActive: boolean;
  _count: { items: number; stockOpnames: number };
}

type FormData = { name: string; code: string; type: string; capacity: string; description: string };
const EMPTY: FormData = { name: "", code: "", type: "", capacity: "", description: "" };

export default function LokasiPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [showForm,  setShowForm]  = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [editId,    setEditId]    = useState<string | null>(null);
  const [form,      setForm]      = useState<FormData>(EMPTY);
  const [error,     setError]     = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deleting,  setDeleting]  = useState(false);
  const [deleteErr, setDeleteErr] = useState("");

  const { data: session } = useSession();
  const canManage = hasPermission((session?.user?.role ?? "VIEWER") as Role, "location:manage");

  function load() {
    return fetch("/api/locations").then(r => r.json()).then(j => { if (j.success) setLocations(j.data); });
  }

  useEffect(() => { load().finally(() => setLoading(false)); }, []);

  function openAdd() {
    setEditId(null); setForm(EMPTY); setError(""); setShowForm(true);
  }

  function openEdit(loc: Location) {
    setEditId(loc.id);
    setForm({
      name: loc.name, code: loc.code,
      type: loc.type ?? "", capacity: loc.capacity ? String(loc.capacity) : "",
      description: loc.description ?? "",
    });
    setError(""); setShowForm(true);
  }

  function set(field: keyof FormData, val: string) {
    setForm(prev => ({ ...prev, [field]: val }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError("");
    setSaving(true);
    try {
      const isEdit = Boolean(editId);
      const res = await fetch("/api/locations", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...(isEdit ? { id: editId } : {}), ...form }),
      });
      const json = await res.json();
      if (!json.success) { setError(json.error); return; }
      await load(); setShowForm(false);
    } finally { setSaving(false); }
  }

  async function deleteLocation(id: string) {
    setDeleting(true); setDeleteErr("");
    try {
      const res = await fetch("/api/locations", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const json = await res.json();
      if (!json.success) { setDeleteErr(json.error); return; }
      setConfirmId(null);
      await load();
    } finally { setDeleting(false); }
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
            <MapPin size={20} className="text-primary" /> Lokasi Penyimpanan
          </h2>
          <p className="text-sm text-muted-foreground">{locations.length} lokasi terdaftar</p>
        </div>
        {canManage && (
          <Button onClick={openAdd} className="gap-2">
            <Plus size={16} /> Tambah Lokasi
          </Button>
        )}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lokasi</TableHead>
                <TableHead>Kode</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead className="text-right">Kapasitas</TableHead>
                <TableHead className="text-center">Barang</TableHead>
                <TableHead>Status</TableHead>
                {canManage && <TableHead className="text-right">Aksi</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {locations.map(loc => (
                <TableRow key={loc.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{loc.name}</p>
                      {loc.description && <p className="text-xs text-muted-foreground">{loc.description}</p>}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{loc.code}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{loc.type ?? "-"}</TableCell>
                  <TableCell className="text-right text-sm">
                    {loc.capacity ? (
                      <span>
                        {loc.used} / {loc.capacity}
                        <span className="text-xs text-muted-foreground ml-1">unit</span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center text-sm">{loc._count.items}</TableCell>
                  <TableCell>
                    <Badge variant={loc.isActive ? "success" : "secondary"}>
                      {loc.isActive ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </TableCell>
                  {canManage && (
                    <TableCell className="text-right">
                      {confirmId === loc.id ? (
                        // Inline confirm
                        <div className="flex flex-col items-end gap-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-muted-foreground">Hapus?</span>
                            <Button
                              size="sm" variant="destructive"
                              className="h-6 px-2 text-xs"
                              disabled={deleting}
                              onClick={() => deleteLocation(loc.id)}
                            >
                              {deleting ? "..." : "Ya"}
                            </Button>
                            <Button
                              size="sm" variant="outline"
                              className="h-6 px-2 text-xs"
                              onClick={() => { setConfirmId(null); setDeleteErr(""); }}
                            >
                              Batal
                            </Button>
                          </div>
                          {deleteErr && (
                            <p className="text-[11px] text-destructive text-right max-w-[220px]">{deleteErr}</p>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEdit(loc)}
                            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors cursor-pointer"
                            title="Edit lokasi"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => { setConfirmId(loc.id); setDeleteErr(""); }}
                            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer"
                            title="Hapus lokasi"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {locations.length === 0 && (
                <TableRow>
                  <TableCell colSpan={canManage ? 7 : 6} className="text-center py-12 text-muted-foreground">
                    Belum ada lokasi. Klik "Tambah Lokasi" untuk memulai.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ── Modal Form ── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-card border shadow-xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-base">
                {editId ? "Edit Lokasi" : "Tambah Lokasi Baru"}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={submit} className="space-y-4">
              {/* Nama */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Nama Lokasi <span className="text-destructive">*</span></label>
                <Input placeholder="Contoh: Gudang A – Pakaian" value={form.name} onChange={e => set("name", e.target.value)} required />
              </div>

              {/* Kode — disabled saat edit */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Kode <span className="text-destructive">*</span></label>
                <Input
                  placeholder="Contoh: GDA (maks 10 huruf)"
                  value={form.code}
                  onChange={e => set("code", e.target.value.toUpperCase())}
                  disabled={Boolean(editId)}
                  required={!editId}
                  className="uppercase"
                />
                {editId && <p className="text-xs text-muted-foreground">Kode tidak dapat diubah.</p>}
              </div>

              {/* Tipe + Kapasitas */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Tipe</label>
                  <Input placeholder="Contoh: Rak, Gudang" value={form.type} onChange={e => set("type", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Kapasitas</label>
                  <Input type="number" min={0} placeholder="Maks unit" value={form.capacity} onChange={e => set("capacity", e.target.value)} />
                </div>
              </div>

              {/* Deskripsi */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Deskripsi <span className="text-muted-foreground text-xs">(opsional)</span></label>
                <Input placeholder="Keterangan tambahan..." value={form.description} onChange={e => set("description", e.target.value)} />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <div className="flex gap-2 pt-1">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowForm(false)}>Batal</Button>
                <Button type="submit" className="flex-1" disabled={saving}>
                  {saving ? "Menyimpan..." : editId ? "Simpan Perubahan" : "Tambah Lokasi"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
