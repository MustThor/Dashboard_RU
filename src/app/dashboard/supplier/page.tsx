"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Building2, Mail, Phone, MapPin, Plus, Pencil, Trash2, X, Search } from "lucide-react";
import { hasPermission, type Role } from "@/types";

interface Supplier {
  id: string; code: string; name: string; contactPerson: string | null;
  email: string | null; phone: string | null; address: string | null;
  city: string | null; isActive: boolean;
  _count: { inbounds: number };
}

const EMPTY_FORM = {
  name: "", code: "", contactPerson: "", email: "", phone: "", address: "", city: "", isActive: true,
};

export default function SupplierPage() {
  const { data: session } = useSession();
  const canManage = hasPermission((session?.user?.role ?? "VIEWER") as Role, "supplier:manage");

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState("");

  // Modal form (add / edit)
  const [showForm, setShowForm]   = useState(false);
  const [editTarget, setEditTarget] = useState<Supplier | null>(null);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);
  const [formErr, setFormErr]     = useState("");

  // Delete
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deleting,  setDeleting]  = useState(false);
  const [deleteErr, setDeleteErr] = useState("");

  function load() {
    return fetch("/api/suppliers")
      .then(r => r.json())
      .then(j => { if (j.success) setSuppliers(j.data); });
  }

  useEffect(() => { load().finally(() => setLoading(false)); }, []);

  function openAdd() {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setFormErr("");
    setShowForm(true);
  }

  function openEdit(s: Supplier) {
    setEditTarget(s);
    setForm({
      name: s.name, code: s.code,
      contactPerson: s.contactPerson ?? "",
      email: s.email ?? "", phone: s.phone ?? "",
      address: s.address ?? "", city: s.city ?? "",
      isActive: s.isActive,
    });
    setFormErr("");
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setFormErr("");
    try {
      const method = editTarget ? "PATCH" : "POST";
      const body   = editTarget ? { id: editTarget.id, ...form } : form;
      const res    = await fetch("/api/suppliers", {
        method, headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!json.success) { setFormErr(json.error); return; }
      setShowForm(false);
      await load();
    } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    setDeleting(true); setDeleteErr("");
    try {
      const res = await fetch("/api/suppliers", {
        method: "DELETE", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const json = await res.json();
      if (!json.success) { setDeleteErr(json.error); return; }
      setConfirmId(null);
      await load();
    } finally { setDeleting(false); }
  }

  const filtered = suppliers.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.code.toLowerCase().includes(search.toLowerCase()) ||
    (s.city ?? "").toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold">Daftar Supplier</h2>
          <p className="text-sm text-muted-foreground">{suppliers.length} supplier terdaftar</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari supplier..."
              className="pl-9 h-9 w-48"
              value={search} onChange={e => setSearch(e.target.value)}
            />
          </div>
          {canManage && (
            <Button onClick={openAdd} className="gap-2">
              <Plus size={16} /> Tambah Supplier
            </Button>
          )}
        </div>
      </div>

      {/* Grid  */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map(s => (
          <Card key={s.id} className="hover:shadow-md transition-shadow group relative">
            <CardContent className="p-5">
              {/* Top row */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Building2 size={18} className="text-primary" />
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge variant={s.isActive ? "success" : "secondary"}>
                    {s.isActive ? "Aktif" : "Nonaktif"}
                  </Badge>
                  {/* Edit / Delete — muncul saat hover */}
                  {canManage && confirmId !== s.id && (
                    <div className="hidden group-hover:flex items-center gap-0.5">
                      <button
                        onClick={() => openEdit(s)}
                        className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors cursor-pointer"
                        title="Edit supplier"
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        onClick={() => { setConfirmId(s.id); setDeleteErr(""); }}
                        className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer"
                        title="Hapus supplier"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <h3 className="font-semibold text-sm">{s.name}</h3>
              <p className="text-xs text-muted-foreground">{s.code}</p>
              {s.contactPerson && <p className="text-xs mt-2 text-muted-foreground">CP: {s.contactPerson}</p>}
              <div className="mt-3 space-y-1">
                {s.email && <div className="flex items-center gap-2 text-xs text-muted-foreground"><Mail size={11} />{s.email}</div>}
                {s.phone && <div className="flex items-center gap-2 text-xs text-muted-foreground"><Phone size={11} />{s.phone}</div>}
                {s.city  && <div className="flex items-center gap-2 text-xs text-muted-foreground"><MapPin size={11} />{s.city}</div>}
              </div>

              {/* Footer */}
              <div className="mt-3 pt-3 border-t">
                {confirmId === s.id ? (
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground flex-1">Hapus supplier ini?</span>
                      <Button size="sm" variant="destructive" className="h-6 px-2 text-xs"
                        disabled={deleting} onClick={() => handleDelete(s.id)}>
                        {deleting ? "..." : "Ya"}
                      </Button>
                      <Button size="sm" variant="outline" className="h-6 px-2 text-xs"
                        onClick={() => { setConfirmId(null); setDeleteErr(""); }}>
                        Batal
                      </Button>
                    </div>
                    {deleteErr && <p className="text-[11px] text-destructive">{deleteErr}</p>}
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xl font-bold">{s._count.inbounds}</p>
                      <p className="text-xs text-muted-foreground">transaksi masuk</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-3 py-16 text-center text-muted-foreground">
            <Building2 size={40} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm">{search ? "Tidak ada supplier yang sesuai pencarian." : "Belum ada supplier."}</p>
          </div>
        )}
      </div>

      {/* ── Modal Add/Edit ── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !saving && setShowForm(false)} />
          <div className="relative z-10 w-full max-w-lg rounded-2xl bg-card border shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Header modal */}
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-base">
                {editTarget ? "Edit Supplier" : "Tambah Supplier Baru"}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {/* Nama */}
                <div className="col-span-2 space-y-1.5">
                  <label className="text-sm font-medium">Nama Supplier <span className="text-destructive">*</span></label>
                  <Input placeholder="Contoh: CV Batik Nusantara" value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                </div>
                {/* Kode */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Kode <span className="text-destructive">*</span></label>
                  <Input placeholder="SUP-001" value={form.code}
                    onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
                    disabled={!!editTarget} required />
                  {editTarget && <p className="text-[11px] text-muted-foreground">Kode tidak bisa diubah</p>}
                </div>
                {/* Contact Person */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Contact Person</label>
                  <Input placeholder="Nama kontak" value={form.contactPerson}
                    onChange={e => setForm(f => ({ ...f, contactPerson: e.target.value }))} />
                </div>
                {/* Email */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Email</label>
                  <Input type="email" placeholder="email@supplier.com" value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                </div>
                {/* Phone */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Telepon</label>
                  <Input placeholder="021-xxxxxxx" value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                </div>
                {/* Kota */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Kota</label>
                  <Input placeholder="Jakarta" value={form.city}
                    onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
                </div>
                {/* Alamat */}
                <div className="col-span-2 space-y-1.5">
                  <label className="text-sm font-medium">Alamat</label>
                  <Input placeholder="Jl. Contoh No. 1" value={form.address}
                    onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
                </div>
                {/* Status */}
                {editTarget && (
                  <div className="col-span-2 flex items-center gap-2">
                    <input
                      id="isActive"
                      type="checkbox"
                      checked={form.isActive}
                      onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                      className="h-4 w-4 cursor-pointer"
                    />
                    <label htmlFor="isActive" className="text-sm cursor-pointer">Supplier aktif</label>
                  </div>
                )}
              </div>

              {formErr && <p className="text-sm text-destructive">{formErr}</p>}

              <div className="flex gap-3 pt-1">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowForm(false)} disabled={saving}>
                  Batal
                </Button>
                <Button type="submit" className="flex-1" disabled={saving}>
                  {saving ? "Menyimpan..." : editTarget ? "Simpan Perubahan" : "Tambah Supplier"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
