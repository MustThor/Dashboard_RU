"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Building2, Mail, Phone, MapPin } from "lucide-react";

interface Supplier {
  id: string; code: string; name: string; contactPerson: string | null; email: string | null;
  phone: string | null; address: string | null; city: string | null; isActive: boolean;
  _count: { inbounds: number };
}

export default function SupplierPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetch("/api/suppliers").then((r) => r.json()).then((j) => { if (j.success) setSuppliers(j.data); }).finally(() => setLoading(false)); }, []);

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;

  return (
    <div className="space-y-6">
      <div><h2 className="text-lg font-semibold">Daftar Supplier</h2><p className="text-sm text-muted-foreground">{suppliers.length} supplier terdaftar</p></div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {suppliers.map((s) => (
          <Card key={s.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10"><Building2 size={18} className="text-primary" /></div>
                <Badge variant={s.isActive ? "success" : "secondary"}>{s.isActive ? "Aktif" : "Nonaktif"}</Badge>
              </div>
              <h3 className="font-semibold text-sm">{s.name}</h3>
              <p className="text-xs text-muted-foreground">{s.code}</p>
              {s.contactPerson && <p className="text-xs mt-2 text-muted-foreground">CP: {s.contactPerson}</p>}
              <div className="mt-3 space-y-1">
                {s.email && <div className="flex items-center gap-2 text-xs text-muted-foreground"><Mail size={12} />{s.email}</div>}
                {s.phone && <div className="flex items-center gap-2 text-xs text-muted-foreground"><Phone size={12} />{s.phone}</div>}
                {s.city && <div className="flex items-center gap-2 text-xs text-muted-foreground"><MapPin size={12} />{s.city}</div>}
              </div>
              <div className="mt-3 pt-3 border-t">
                <p className="text-xl font-bold">{s._count.inbounds}</p>
                <p className="text-xs text-muted-foreground">transaksi masuk</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
