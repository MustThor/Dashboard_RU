"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Search, Plus, Package, Download, RefreshCw, X } from "lucide-react";
import { formatRupiah, formatAngka, getStatusDisplayName } from "@/lib/utils";
import type { Item, Category, Location } from "@/types";
import { STATUS_BADGE_VARIANT } from "@/types";

// ─── Local Types ──────────────────────────────────────────────────────────────
// Item, Category, Location are imported from @/types

interface ItemFormData {
  sku: string;
  name: string;
  description: string;
  categoryId: string;
  locationId: string;
  stock: string;
  minStock: string;
  unit: string;
  price: string;
  weight: string;
}

const UNIT_OPTIONS = [
  { value: "pcs",   label: "pcs – Pieces" },
  { value: "kg",    label: "kg – Kilogram" },
  { value: "liter", label: "liter – Liter" },
  { value: "box",   label: "box – Box" },
  { value: "roll",  label: "roll – Roll" },
  { value: "meter", label: "meter – Meter" },
  { value: "set",   label: "set – Set" },
];

const STATUS_OPTIONS = [
  { value: "",            label: "Semua Status" },
  { value: "TERSEDIA",    label: "Tersedia" },
  { value: "STOK_RENDAH", label: "Stok Rendah" },
  { value: "HABIS",       label: "Habis" },
];

const EMPTY_FORM: ItemFormData = {
  sku: "", name: "", description: "",
  categoryId: "", locationId: "",
  stock: "0", minStock: "10", unit: "pcs",
  price: "0", weight: "",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function InventarisPage() {
  const [items, setItems]                   = useState<Item[]>([]);
  const [categories, setCategories]         = useState<Category[]>([]);
  const [locations, setLocations]           = useState<Location[]>([]);
  const [search, setSearch]                 = useState("");
  const [filterStatus, setFilterStatus]     = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [loading, setLoading]               = useState(true);
  const [showModal, setShowModal]           = useState(false);
  const [form, setForm]                     = useState<ItemFormData>(EMPTY_FORM);
  const [submitting, setSubmitting]         = useState(false);
  const [error, setError]                   = useState("");
  const [fetchError, setFetchError]         = useState("");

  // ── Fetch data ─────────────────────────────────────────────────────────────

  async function fetchItems() {
    setLoading(true);
    setFetchError("");
    try {
      const res = await fetch("/api/items");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.success) setItems(json.data);
      else setFetchError(json.error ?? "Gagal memuat data.");
    } catch (err) {
      setFetchError("Tidak bisa terhubung ke server.");
      console.error("fetchItems error:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchItems();
    fetch("/api/categories")
      .then(r => r.json())
      .then(j => { if (j.success) setCategories(j.data); })
      .catch(console.error);
    fetch("/api/locations")
      .then(r => r.json())
      .then(j => { if (j.success) setLocations(j.data); })
      .catch(console.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Filter ─────────────────────────────────────────────────────────────────

  const filtered = items.filter(i => {
    const matchSearch = i.name.toLowerCase().includes(search.toLowerCase())
      || i.sku.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !filterStatus || i.status === filterStatus;
    const matchCat    = !filterCategory || i.category.id === filterCategory;
    return matchSearch && matchStatus && matchCat;
  });

  // ── Form helpers ───────────────────────────────────────────────────────────

  function openModal() {
    setForm(EMPTY_FORM);
    setError("");
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setError("");
  }

  function handleChange(field: keyof ItemFormData, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.sku || !form.name || !form.categoryId || !form.locationId) {
      setError("SKU, nama barang, kategori, dan lokasi wajib diisi.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          stock:    Number(form.stock),
          minStock: Number(form.minStock),
          price:    Number(form.price),
          weight:   form.weight ? Number(form.weight) : undefined,
        }),
      });
      const json = await res.json();

      if (json.success) {
        closeModal();
        fetchItems();       // refresh list
      } else {
        setError(json.error ?? "Gagal menambah barang.");
      }
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Memuat data barang...</p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-3">
        <p className="text-sm text-destructive">{fetchError}</p>
        <Button variant="outline" size="sm" onClick={fetchItems}>Coba Lagi</Button>
      </div>
    );
  }

  return (
    <>
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold">Daftar Barang</h2>
          <p className="text-sm text-muted-foreground">
            {formatAngka(filtered.length)} dari {formatAngka(items.length)} barang ditampilkan
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchItems}>
            <RefreshCw size={15} /> Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download size={15} /> Export
          </Button>
          <Button size="sm" onClick={openModal}>
            <Plus size={15} /> Tambah Barang
          </Button>
        </div>
      </div>

      {/* ── Filters ── */}
      <Card className="mb-4">
        <CardContent className="p-3 md:p-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <Input
                placeholder="Cari nama atau SKU..."
                className="pl-9"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Select
                className="flex-1 sm:w-[160px]"
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
                options={[
                  { value: "", label: "Semua Kategori" },
                  ...categories.map(c => ({ value: c.id, label: c.name })),
                ]}
              />
              <Select
                className="flex-1 sm:w-[130px]"
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                options={STATUS_OPTIONS}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Table ── */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Nama Barang</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Lokasi</TableHead>
                <TableHead className="text-right">Stok</TableHead>
                <TableHead className="text-right">Harga</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(item => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono text-xs">{item.sku}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Package size={14} className="text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{item.name}</p>
                        {item.description && (
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{item.category.name}</TableCell>
                  <TableCell className="text-sm">{item.location.name}</TableCell>
                  <TableCell className="text-right">
                    <span className="font-medium">{formatAngka(item.stock)}</span>
                    <span className="text-xs text-muted-foreground ml-1">{item.unit}</span>
                  </TableCell>
                  <TableCell className="text-right text-sm">{formatRupiah(item.price)}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_BADGE_VARIANT[item.status] ?? "secondary"}>
                      {getStatusDisplayName(item.status)}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    {search || filterStatus || filterCategory
                      ? "Tidak ada barang yang sesuai filter."
                      : "Belum ada barang. Klik \"Tambah Barang\" untuk memulai."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ── Modal Form ── */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package size={18} />
              Tambah Barang Baru
            </DialogTitle>
            <DialogDescription>
              Isi detail barang berikut. Kolom bertanda <span className="text-destructive">*</span> wajib diisi.
            </DialogDescription>
          </DialogHeader>

          {/* Close button */}
          <button
            onClick={closeModal}
            className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
          >
            <X size={16} />
          </button>

          <form onSubmit={handleSubmit} className="space-y-5 pt-2">
            {/* Row: SKU + Nama */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="sku">
                  SKU <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="sku"
                  placeholder="Contoh: BRG-001"
                  value={form.sku}
                  onChange={e => handleChange("sku", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="name">
                  Nama Barang <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="Masukkan nama barang"
                  value={form.name}
                  onChange={e => handleChange("name", e.target.value)}
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="description">Deskripsi</Label>
              <Textarea
                id="description"
                placeholder="Deskripsi singkat barang (opsional)"
                rows={2}
                value={form.description}
                onChange={e => handleChange("description", e.target.value)}
              />
            </div>

            {/* Row: Kategori + Lokasi */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="categoryId">
                  Kategori <span className="text-destructive">*</span>
                </Label>
                <Select
                  id="categoryId"
                  placeholder="Pilih kategori..."
                  value={form.categoryId}
                  onChange={e => handleChange("categoryId", e.target.value)}
                  options={categories.map(c => ({ value: c.id, label: c.name }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="locationId">
                  Lokasi <span className="text-destructive">*</span>
                </Label>
                <Select
                  id="locationId"
                  placeholder="Pilih lokasi..."
                  value={form.locationId}
                  onChange={e => handleChange("locationId", e.target.value)}
                  options={locations.map(l => ({ value: l.id, label: l.name }))}
                />
              </div>
            </div>

            {/* Row: Stok + Min Stok + Satuan */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="stock">Stok Awal</Label>
                <Input
                  id="stock"
                  type="number"
                  min="0"
                  value={form.stock}
                  onChange={e => handleChange("stock", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="minStock">Stok Minimum</Label>
                <Input
                  id="minStock"
                  type="number"
                  min="0"
                  value={form.minStock}
                  onChange={e => handleChange("minStock", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="unit">Satuan</Label>
                <Select
                  id="unit"
                  value={form.unit}
                  onChange={e => handleChange("unit", e.target.value)}
                  options={UNIT_OPTIONS}
                />
              </div>
            </div>

            {/* Row: Harga + Berat */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="price">Harga (Rp)</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={form.price}
                  onChange={e => handleChange("price", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="weight">Berat (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Opsional"
                  value={form.weight}
                  onChange={e => handleChange("weight", e.target.value)}
                />
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-destructive flex items-center gap-2">
                <X size={14} />
                {error}
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeModal} disabled={submitting}>
                Batal
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Menyimpan...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Plus size={15} />
                    Simpan Barang
                  </span>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
