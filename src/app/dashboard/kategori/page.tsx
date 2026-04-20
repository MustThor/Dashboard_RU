"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tag, Plus, ArrowRight, X } from "lucide-react";
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
  // Form
  const [name, setName]             = useState("");
  const [code, setCode]             = useState("");
  const [desc, setDesc]             = useState("");

  const router = useRouter();
  const { data: session } = useSession();
  const canCreate = hasPermission((session?.user?.role ?? "VIEWER") as Role, "category:manage");

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
            onClick={() => router.push(`/dashboard/inventaris?category=${cat.id}`)}
            className="cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all duration-200 group"
          >
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Tag size={18} className="text-primary" />
                </div>
                <Badge variant={cat.isActive ? "success" : "secondary"}>
                  {cat.isActive ? "Aktif" : "Nonaktif"}
                </Badge>
              </div>
              <h3 className="font-semibold text-sm">{cat.name}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{cat.code}</p>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{cat.description ?? "-"}</p>
              <div className="mt-3 flex items-end justify-between">
                <div>
                  <p className="text-2xl font-bold">{cat._count.items}</p>
                  <p className="text-xs text-muted-foreground">barang terdaftar</p>
                </div>
                <ArrowRight size={16} className="text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all mb-1" />
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
    </div>
  );
}
