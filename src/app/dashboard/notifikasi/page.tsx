"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, CheckCircle, AlertTriangle, Info, XCircle, Package, ArrowRightLeft, CheckCheck, RotateCcw, RefreshCw, Trash2 } from "lucide-react";
import { formatTanggalWaktu } from "@/lib/utils";

interface Notification {
  id: string; type: string; title: string; message: string; isRead: boolean; createdAt: string;
  user: { name: string } | null;
}

const typeIcon: Record<string, React.ReactNode> = {
  INFO:        <Info size={16} className="text-blue-500" />,
  WARNING:     <AlertTriangle size={16} className="text-amber-500" />,
  SUCCESS:     <CheckCircle size={16} className="text-emerald-500" />,
  ERROR:       <XCircle size={16} className="text-red-500" />,
  STOCK:       <Package size={16} className="text-purple-500" />,
  TRANSACTION: <ArrowRightLeft size={16} className="text-indigo-500" />,
};

const typeLabel: Record<string, string> = {
  INFO: "Info", WARNING: "Peringatan", SUCCESS: "Sukses",
  ERROR: "Error", STOCK: "Stok", TRANSACTION: "Transaksi",
};

const typeVariant: Record<string, "info" | "warning" | "success" | "destructive" | "default" | "secondary"> = {
  INFO: "info", WARNING: "warning", SUCCESS: "success", ERROR: "destructive", STOCK: "default", TRANSACTION: "secondary",
};

export default function NotifikasiPage() {
  const [notifs, setNotifs]         = useState<Notification[]>([]);
  const [loading, setLoading]       = useState(true);
  const [marking, setMarking]       = useState(false);
  const [unread,  setUnread]        = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);
  const [confirmAll,  setConfirmAll]  = useState(false);

  const load = useCallback(() => {
    return fetch("/api/notifications")
      .then(r => r.json())
      .then(j => { if (j.success) { setNotifs(j.data); setUnread(j.unreadCount ?? 0); } });
  }, []);

  // Mount: load awal
  useEffect(() => { load().finally(() => setLoading(false)); }, [load]);

  // Auto-polling tiap 10 detik
  useEffect(() => {
    const id = setInterval(() => { load(); }, 10_000);
    // Refresh juga saat tab kembali aktif
    const onVisible = () => { if (document.visibilityState === "visible") load(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", onVisible); };
  }, [load]);

  async function manualRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  async function markOne(id: string) {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    setUnread(prev => Math.max(0, prev - 1));
  }

  async function unmarkOne(id: string) {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, unread: true }),
    });
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, isRead: false } : n));
    setUnread(prev => prev + 1);
  }

  async function deleteOne(id: string) {
    await fetch("/api/notifications", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const deleted = notifs.find(n => n.id === id);
    setNotifs(prev => prev.filter(n => n.id !== id));
    if (deleted && !deleted.isRead) setUnread(prev => Math.max(0, prev - 1));
  }

  async function deleteAll() {
    setDeletingAll(true);
    await fetch("/api/notifications", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    setNotifs([]);
    setUnread(0);
    setConfirmAll(false);
    setDeletingAll(false);
  }

  async function markAll() {
    setMarking(true);
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    setNotifs(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnread(0);
    setMarking(false);
  }

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Bell size={20} className="text-primary" /> Notifikasi
          </h2>
          <p className="text-sm text-muted-foreground">
            {unread > 0 ? `${unread} belum dibaca` : "Semua sudah dibaca"}
          </p>
        </div>
        <div className="flex items-center flex-wrap gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={manualRefresh} disabled={refreshing} title="Refresh">
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          </Button>
          {notifs.length > 0 && (
            confirmAll ? (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">Hapus semua?</span>
                <Button size="sm" variant="destructive" className="h-7 px-2 text-xs" disabled={deletingAll} onClick={deleteAll}>
                  {deletingAll ? "..." : "Ya"}
                </Button>
                <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => setConfirmAll(false)}>Batal</Button>
              </div>
            ) : (
              <Button variant="outline" size="sm" className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30" onClick={() => setConfirmAll(true)}>
                <Trash2 size={13} /> Hapus Semua
              </Button>
            )
          )}
          {unread > 0 && !confirmAll && (
            <Button variant="outline" size="sm" className="gap-2" onClick={markAll} disabled={marking}>
              <CheckCheck size={14} />
              {marking ? "Menandai..." : "Tandai Semua Dibaca"}
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {notifs.map(n => (
        <Card
            key={n.id}
            className={`transition-all group ${
              !n.isRead
                ? "border-l-4 border-l-primary cursor-pointer hover:shadow-md"
                : "opacity-60 hover:opacity-100"
            }`}
            onClick={() => !n.isRead && markOne(n.id)}
          >
            <CardContent className="flex items-start gap-4 p-4">
              <div className="mt-0.5 shrink-0">{typeIcon[n.type] ?? <Bell size={16} />}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <h3 className="text-sm font-semibold">{n.title}</h3>
                  <Badge variant={typeVariant[n.type] ?? "secondary"} className="text-[10px]">
                    {typeLabel[n.type] ?? n.type}
                  </Badge>
                  {!n.isRead && <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />}
                </div>
                <p className="text-sm text-muted-foreground">{n.message}</p>
                <p className="text-xs text-muted-foreground mt-1">{formatTanggalWaktu(n.createdAt)}</p>
              </div>
              <div className="shrink-0 flex flex-col items-end gap-1.5 ml-2 mt-1 sm:mt-0">
                {!n.isRead ? (
                  <span className="text-[10px] sm:text-[11px] text-primary whitespace-nowrap">Tandai dibaca</span>
                ) : (
                  <button
                    onClick={e => { e.stopPropagation(); unmarkOne(n.id); }}
                    className="hidden group-hover:flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    <RotateCcw size={11} /> Belum dibaca
                  </button>
                )}
                {/* Hapus per notif */}
                <button
                  onClick={e => { e.stopPropagation(); deleteOne(n.id); }}
                  className="hidden group-hover:flex items-center gap-1 text-[11px] text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                  title="Hapus notifikasi ini"
                >
                  <Trash2 size={11} /> Hapus
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
        {notifs.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Bell size={40} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm">Tidak ada notifikasi saat ini.</p>
            <p className="text-xs mt-1">Notifikasi akan muncul saat ada transaksi atau perubahan stok.</p>
          </div>
        )}
      </div>
    </div>
  );
}
