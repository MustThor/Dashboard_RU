"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials, getRoleDisplayName, formatTanggalWaktu } from "@/lib/utils";

interface User {
  id: string; name: string; email: string; role: string; isActive: boolean;
  lastLogin: string | null; createdAt: string;
  _count: { inbounds: number; outbounds: number; transfers: number };
}

const roleVariant: Record<string, "default" | "secondary" | "info" | "success" | "warning" | "destructive"> = {
  SUPER_ADMIN: "destructive", ADMIN_GUDANG: "default", SUPERVISOR: "info",
  STAFF: "success", AUDITOR: "warning", VIEWER: "secondary",
};

export default function PenggunaPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetch("/api/users").then((r) => r.json()).then((j) => { if (j.success) setUsers(j.data); }).finally(() => setLoading(false)); }, []);

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;

  return (
    <div className="space-y-6">
      <div><h2 className="text-lg font-semibold">Manajemen Pengguna</h2><p className="text-sm text-muted-foreground">{users.length} pengguna terdaftar</p></div>
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pengguna</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Login Terakhir</TableHead>
                <TableHead className="text-center">Aktivitas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9"><AvatarFallback className="text-xs">{getInitials(u.name)}</AvatarFallback></Avatar>
                      <div>
                        <p className="font-medium text-sm">{u.name}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant={roleVariant[u.role] ?? "secondary"}>{getRoleDisplayName(u.role)}</Badge></TableCell>
                  <TableCell><Badge variant={u.isActive ? "success" : "secondary"}>{u.isActive ? "Aktif" : "Nonaktif"}</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{u.lastLogin ? formatTanggalWaktu(u.lastLogin) : "Belum pernah"}</TableCell>
                  <TableCell className="text-center text-xs text-muted-foreground">{u._count.inbounds + u._count.outbounds + u._count.transfers} trx</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
