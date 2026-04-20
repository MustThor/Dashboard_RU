"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tag } from "lucide-react";

interface Category {
  id: string; code: string; name: string; description: string | null; isActive: boolean;
  _count: { items: number };
}

export default function KategoriPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/categories").then((r) => r.json()).then((j) => {
      if (j.success) setCategories(j.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;

  return (
    <div className="space-y-6">
      <div><h2 className="text-lg font-semibold">Kategori Barang</h2><p className="text-sm text-muted-foreground">{categories.length} kategori terdaftar</p></div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {categories.map((cat) => (
          <Card key={cat.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10"><Tag size={18} className="text-primary" /></div>
                <Badge variant={cat.isActive ? "success" : "secondary"}>{cat.isActive ? "Aktif" : "Nonaktif"}</Badge>
              </div>
              <h3 className="font-semibold text-sm">{cat.name}</h3>
              <p className="text-xs text-muted-foreground mt-1">{cat.code}</p>
              <p className="text-xs text-muted-foreground mt-1">{cat.description ?? "-"}</p>
              <p className="mt-3 text-2xl font-bold">{cat._count.items}</p>
              <p className="text-xs text-muted-foreground">barang terdaftar</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
