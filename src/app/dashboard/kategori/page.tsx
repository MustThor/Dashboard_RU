"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tag, Plus, ArrowRight, X, Trash2 } from "lucide-react";
import { hasPermission, type Role } from "@/types";

interface Category {
  id: string; code: string; name: string; description: string | null; isActive: boolean;
  _count: { items: number };
}

export default function KategoriPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [showForm,   setShowForm]   = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState("");
  const [confirmId,  setConfirmId]  = useState<string | null>(null);
  const [deleting,   setDeleting]   = useState(false);
  const [deleteErr,  setDeleteErr]  = useState("");
  // Force delete
  const [forceTarget, setForceTarget] = useState<Category | null>(null);
  const [forceInput,  setForceInput]  = useState("");
  const [forcing,     setForcing]     = useState(false);
  const [forceErr,    setForceErr]    = useState("");
  // Form
  const [name, setName]             = useState("");
  const [code, setCode]             = useState("");
  const [desc, setDesc]             = useState("");

  const router = useRouter();
  const { data: session } = useSession();
  const canCreate  = hasPermission((session?.user?.role ?? "VIEWER") as Role, "category:manage");
  const isSuperAdmin = session?.user?.role === "SUPER_ADMIN";

  function loadCategories() {
    return fetch("/api/categories").then(r => r.json()).then(j => { if (j.success) setCategories(j.data); });
  }

  useEffect(() => { loadCategories().finally(() => setLoading(false)); }, []);

  function resetForm() { setName(""); setCode(""); setDesc(""); setError(""); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, code, description: desc }),
      });
      const json = await res.json();
      if (!json.success) { setError(json.error); return; }
      await loadCategories();
      setShowForm(false); resetForm();
    } finally { setSaving(false); }
  }

  async function deleteCategory(id: string) {
    setDeleting(true); setDeleteErr("");
    try {
      const res = await fetch("/api/categories", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const json = await res.json();
      if (!json.success) {
        // Jika SUPER_ADMIN dan ada barang, tawarkan force delete
        if (json.canForce) {
          const cat = categories.find(c => c.id === id) ?? null;
          setForceTarget(cat);
          setForceInput(""); setForceErr("");
          setConfirmId(null);
        } else {
          setDeleteErr(json.error);
        }
        return;
      }
      setConfirmId(null);
      await loadCategories();
    } finally { setDeleting(false); }
  }

  async function forceDeleteCategory() {
    if (!forceTarget) return;
    if (forceInput.trim() !== forceTarget.name.trim()) {
      setForceErr(`Masukkan nama kategori yang tepat: "${forceTarget.name}"`);
      return;
    }
    setForcing(true); setForceErr("");
    try {
      const res = await fetch("/api/categories", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: forceTarget.id, force: true }),
      });
      const json = await res.json();
      if (!json.success) { setForceErr(json.error); return; }
      setForceTarget(null);
      await loadCategories();
    } finally { setForcing(false); }
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
          <h2 className="text-lg font-semibold">Kategori Barang</h2>
          <p className="text-sm text-muted-foreground">
            {categories.length} kategori terdaftar • Klik kartu untuk melihat barang
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => { setShowForm(true); resetForm(); }} className="gap-2">
            <Plus size={16} /> Tambah Kategori
          </Button>
        )}
      </div>

      {/* Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {categories.map((cat) => (
          <Card
            key={cat.id}
            onClick={() => confirmId !== cat.id && router.push(`/dashboard/inventaris?category=${cat.id}`)}
            className={`transition-all duration-200 group relative ${
              confirmId === cat.id
                ? "cursor-default border-destructive/50 shadow-md"
                : "cursor-pointer hover:shadow-lg hover:border-primary/50"
            }`}
          >
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Tag size={18} className="text-primary" />
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge variant={cat.isActive ? "success" : "secondary"}>
                    {cat.isActive ? "Aktif" : "Nonaktif"}
                  </Badge>
                  {/* Tombol hapus — hanya muncul saat hover, untuk yang berhak */}
                  {canCreate && confirmId !== cat.id && (
                    <button
                      onClick={e => { e.stopPropagation(); setConfirmId(cat.id); setDeleteErr(""); }}
                      className="hidden group-hover:flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer"
                      title="Hapus kategori"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
              <h3 className="font-semibold text-sm">{cat.name}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{cat.code}</p>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{cat.description ?? "-"}</p>
              <div className="mt-3 flex items-end justify-between">
                <div>
                  <p className="text-2xl font-bold">{cat._count.items}</p>
                  <p className="text-xs text-muted-foreground">barang terdaftar</p>
                </div>
                {confirmId === cat.id ? (
                  // Inline confirm di dalam kartu
                  <div className="flex flex-col items-end gap-1" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">Hapus?</span>
                      <Button size="sm" variant="destructive" className="h-6 px-2 text-xs"
                        disabled={deleting} onClick={() => deleteCategory(cat.id)}
                      >
                        {deleting ? "..." : "Ya"}
                      </Button>
                      <Button size="sm" variant="outline" className="h-6 px-2 text-xs"
                        onClick={() => { setConfirmId(null); setDeleteErr(""); }}
                      >
                        Batal
                      </Button>
                    </div>
                    {deleteErr && <p className="text-[10px] text-destructive text-right max-w-[180px]">{deleteErr}</p>}
                  </div>
                ) : (
                  <ArrowRight size={16} className="text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all mb-1" />
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Modal Form ── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-card border shadow-xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-base">Tambah Kategori Baru</h3>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nama */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Nama Kategori <span className="text-destructive">*</span></label>
                <Input
                  placeholder="Contoh: Baju & Atasan"
                  value={name} onChange={e => setName(e.target.value)}
                  required
                />
              </div>

              {/* Kode */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Kode <span className="text-destructive">*</span></label>
                <Input
                  placeholder="Contoh: BJU (maks 5 huruf)"
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase().slice(0, 5))}
                  required
                  className="uppercase"
                />
                <p className="text-xs text-muted-foreground">Kode harus unik dan akan dijadikan huruf kapital otomatis.</p>
              </div>

              {/* Deskripsi */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Deskripsi <span className="text-muted-foreground text-xs">(opsional)</span></label>
                <Input
                  placeholder="Contoh: Kemeja, blouse, kaos, tunik, dress"
                  value={desc} onChange={e => setDesc(e.target.value)}
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <div className="flex gap-2 pt-1">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowForm(false)}>
                  Batal
                </Button>
                <Button type="submit" className="flex-1" disabled={saving}>
                  {saving ? "Menyimpan..." : "Simpan Kategori"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Force Delete ── */}
      {forceTarget && isSuperAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => !forcing && setForceTarget(null)} />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-card border border-destructive/50 shadow-2xl p-6 space-y-5">
            {/* Header */}
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-destructive/10">
                <Trash2 size={20} className="text-destructive" />
              </div>
              <div>
                <h3 className="font-semibold text-base text-destructive">⚠ Force Delete Kategori</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Tindakan ini tidak dapat dibatalkan</p>
              </div>
              <button onClick={() => setForceTarget(null)} className="ml-auto text-muted-foreground hover:text-foreground cursor-pointer">
                <X size={18} />
              </button>
            </div>

            {/* Warning box */}
            <div className="rounded-xl bg-destructive/10 border border-destructive/30 p-4 space-y-2">
              <p className="text-sm font-medium text-destructive">Yang akan dihapus selamanya:</p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Kategori <span className="font-semibold text-foreground">{forceTarget.name}</span> ({forceTarget.code})</li>
                <li>
                  <span className="font-semibold text-destructive">{forceTarget._count.items} barang</span> beserta seluruh riwayat transaksinya
                  {" "}(inbound, outbound, opname, transfer)
                </li>
              </ul>
            </div>

            {/* Konfirmasi ketik nama */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Ketik nama kategori untuk konfirmasi:
                <span className="ml-1 font-mono text-destructive">{forceTarget.name}</span>
              </label>
              <Input
                placeholder={`Ketik "${forceTarget.name}" untuk melanjutkan`}
                value={forceInput}
                onChange={e => { setForceInput(e.target.value); setForceErr(""); }}
                className="border-destructive/40 focus-visible:ring-destructive"
              />
              {forceErr && <p className="text-xs text-destructive">{forceErr}</p>}
            </div>

            {/* Tombol aksi */}
            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setForceTarget(null)} disabled={forcing}>
                Batal
              </Button>
              <Button
                variant="destructive" className="flex-1 gap-2"
                disabled={forcing || forceInput.trim() !== forceTarget.name.trim()}
                onClick={forceDeleteCategory}
              >
                <Trash2 size={14} />
                {forcing ? "Menghapus..." : `Hapus & ${forceTarget._count.items} Barang`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
