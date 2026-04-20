"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Package, TruckIcon, PackageOpen, AlertTriangle,
  DollarSign, Tag, MapPin, Building2,
} from "lucide-react";
import { formatRupiah, formatTanggalPendek } from "@/lib/utils";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, Legend,
} from "recharts";

const COLORS = ["#6366f1","#22c55e","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#ec4899","#f97316"];

interface DashboardData {
  stats: {
    totalItems: number; inboundToday: number; outboundToday: number; lowStockCount: number;
    totalValue: number; totalCategories: number; totalLocations: number; totalSuppliers: number;
  };
  recentInbound: Array<{ id: string; poNumber: string; date: string; status: string; supplier: { name: string } }>;
  recentOutbound: Array<{ id: string; soNumber: string; date: string; status: string; destination: string }>;
  itemsByCategory: Array<{ name: string; jumlah: number }>;
  trendData: Array<{ month: string; masuk: number; keluar: number }>;
  lowStockItems: Array<{ id: string; sku: string; name: string; stock: number; minStock: number; unit: string; status: string; category: { name: string } }>;
}

const statusVariant: Record<string, "success"|"warning"|"destructive"|"info"|"secondary"> = {
  TERSEDIA:"success", STOK_RENDAH:"warning", HABIS:"destructive",
  DISIMPAN:"success", DITERIMA:"info", DIPERIKSA:"info", PENDING:"secondary",
  DIKIRIM:"success", DIKEMAS:"info", DISETUJUI:"success",
};

function StatCard({ title, value, icon, sub }: {
  title: string; value: string | number; icon: React.ReactNode; sub?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4 md:p-5">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground truncate">{title}</p>
            <p className="mt-0.5 text-xl md:text-2xl font-bold">{value}</p>
            {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
          </div>
          <div className="ml-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then(r => r.json())
      .then(j => { if (j.success) setData(j.data); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  if (!data) return <p className="text-center text-muted-foreground">Gagal memuat data.</p>;

  const { stats } = data;

  return (
    <div className="space-y-5">
      {/* ── Stats row 1 ── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard title="Total Barang"         value={stats.totalItems}    icon={<Package size={20}/>}    sub={`${stats.totalCategories} kategori`} />
        <StatCard title="Masuk Hari Ini"       value={stats.inboundToday}  icon={<TruckIcon size={20}/>}  sub="transaksi masuk" />
        <StatCard title="Keluar Hari Ini"      value={stats.outboundToday} icon={<PackageOpen size={20}/>} sub="transaksi keluar" />
        <StatCard title="Stok Rendah / Habis"  value={stats.lowStockCount} icon={<AlertTriangle size={20}/>} sub="perlu restock" />
      </div>

      {/* ── Stats row 2 ── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard title="Nilai Inventaris"   value={formatRupiah(stats.totalValue)}  icon={<DollarSign size={20}/>} />
        <StatCard title="Kategori"            value={stats.totalCategories}            icon={<Tag size={20}/>} />
        <StatCard title="Lokasi"             value={stats.totalLocations}             icon={<MapPin size={20}/>} />
        <StatCard title="Supplier"            value={stats.totalSuppliers}             icon={<Building2 size={20}/>} />
      </div>

      {/* ── Charts ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Trend chart */}
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm">Tren Barang Masuk & Keluar</CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-4">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={data.trendData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" tick={{ fill:"currentColor", fontSize:11 }} />
                <YAxis tick={{ fill:"currentColor", fontSize:11 }} />
                <Tooltip contentStyle={{ backgroundColor:"var(--card)", border:"1px solid var(--border)", borderRadius:"8px", fontSize:12 }} />
                <Legend wrapperStyle={{ fontSize:12 }} />
                <Line type="monotone" dataKey="masuk"  stroke="#6366f1" strokeWidth={2} name="Masuk"  dot={{ r:3 }} />
                <Line type="monotone" dataKey="keluar" stroke="#22c55e" strokeWidth={2} name="Keluar" dot={{ r:3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category chart */}
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm">Barang per Kategori</CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-4">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.itemsByCategory}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" tick={{ fill:"currentColor", fontSize:10 }} angle={-15} textAnchor="end" height={50} />
                <YAxis tick={{ fill:"currentColor", fontSize:11 }} />
                <Tooltip contentStyle={{ backgroundColor:"var(--card)", border:"1px solid var(--border)", borderRadius:"8px", fontSize:12 }} />
                <Bar dataKey="jumlah" name="Jumlah" radius={[4,4,0,0]}>
                  {data.itemsByCategory.map((_,i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* ── Low stock + recent ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Low stock */}
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle size={15} className="text-amber-500" />
              Peringatan Stok
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {data.lowStockItems.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">Semua stok aman 👍</p>
              ) : (
                data.lowStockItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between rounded-lg border px-3 py-2 gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.sku}</p>
                    </div>
                    <Badge variant={item.status === "HABIS" ? "destructive" : "warning"} className="shrink-0 text-xs">
                      {item.stock} {item.unit}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent inbound */}
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm">Barang Masuk Terbaru</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="space-y-2">
              {data.recentInbound.slice(0, 5).map(ib => (
                <div key={ib.id} className="flex items-center justify-between rounded-lg border px-3 py-2 gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{ib.poNumber}</p>
                    <p className="text-xs text-muted-foreground truncate">{ib.supplier.name}</p>
                  </div>
                  <Badge variant={statusVariant[ib.status] ?? "secondary"} className="shrink-0 text-xs">
                    {ib.status.replace("_"," ")}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Recent outbound ── */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm">Barang Keluar Terbaru</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="space-y-2">
            {data.recentOutbound.slice(0, 5).map(ob => (
              <div key={ob.id} className="flex items-center justify-between rounded-lg border px-3 py-2 gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{ob.soNumber}</p>
                  <p className="text-xs text-muted-foreground truncate">{ob.destination}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-muted-foreground hidden sm:block">{formatTanggalPendek(ob.date)}</span>
                  <Badge variant={statusVariant[ob.status] ?? "secondary"} className="text-xs">
                    {ob.status.replace("_"," ")}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
