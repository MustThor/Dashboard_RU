"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCircle, AlertTriangle, Info, XCircle, Package, ArrowRightLeft } from "lucide-react";
import { formatTanggalWaktu } from "@/lib/utils";

interface Notification {
  id: string; type: string; title: string; message: string; isRead: boolean; createdAt: string;
  user: { name: string } | null;
}

const typeIcon: Record<string, React.ReactNode> = {
  INFO: <Info size={16} className="text-blue-500" />,
  WARNING: <AlertTriangle size={16} className="text-amber-500" />,
  SUCCESS: <CheckCircle size={16} className="text-emerald-500" />,
  ERROR: <XCircle size={16} className="text-red-500" />,
  STOCK: <Package size={16} className="text-purple-500" />,
  TRANSACTION: <ArrowRightLeft size={16} className="text-indigo-500" />,
};

const typeVariant: Record<string, "info" | "warning" | "success" | "destructive" | "default" | "secondary"> = {
  INFO: "info", WARNING: "warning", SUCCESS: "success", ERROR: "destructive", STOCK: "default", TRANSACTION: "secondary",
};

export default function NotifikasiPage() {
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetch("/api/notifications").then((r) => r.json()).then((j) => { if (j.success) setNotifs(j.data); }).finally(() => setLoading(false)); }, []);

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-lg font-semibold">Notifikasi</h2><p className="text-sm text-muted-foreground">{notifs.filter((n) => !n.isRead).length} belum dibaca</p></div>
      </div>

      <div className="space-y-3">
        {notifs.map((n) => (
          <Card key={n.id} className={`transition-shadow hover:shadow-md ${!n.isRead ? "border-l-4 border-l-primary" : ""}`}>
            <CardContent className="flex items-start gap-4 p-4">
              <div className="mt-0.5">{typeIcon[n.type] ?? <Bell size={16} />}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold">{n.title}</h3>
                  <Badge variant={typeVariant[n.type] ?? "secondary"} className="text-[10px]">{n.type}</Badge>
                  {!n.isRead && <span className="h-2 w-2 rounded-full bg-primary" />}
                </div>
                <p className="text-sm text-muted-foreground">{n.message}</p>
                <p className="text-xs text-muted-foreground mt-1">{formatTanggalWaktu(n.createdAt)}</p>
              </div>
            </CardContent>
          </Card>
        ))}
        {notifs.length === 0 && <p className="text-center text-muted-foreground py-8">Tidak ada notifikasi</p>}
      </div>
    </div>
  );
}
