"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { UserX, UserCheck } from "lucide-react";
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
  const [users,   setUsers]   = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const { data: session } = useSession();
  const isSuperAdmin = session?.user?.role === "SUPER_ADMIN";

  function loadUsers() {
    return fetch("/api/users").then(r => r.json()).then(j => { if (j.success) setUsers(j.data); });
  }

  useEffect(() => { loadUsers().finally(() => setLoading(false)); }, []);

  async function toggleStatus(user: User) {
    setToggling(user.id);
    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: user.id, isActive: !user.isActive }),
      });
      const json = await res.json();
      if (json.success) await loadUsers();
      else alert(json.error);
    } finally { setToggling(null); }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Manajemen Pengguna</h2>
        <p className="text-sm text-muted-foreground">{users.length} pengguna terdaftar</p>
      </div>

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
                {isSuperAdmin && <TableHead className="text-right">Aksi</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => {
                const isSelf = u.id === session?.user?.id;
                return (
                  <TableRow key={u.id} className={!u.isActive ? "opacity-50" : ""}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="text-xs">{getInitials(u.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{u.name}</p>
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={roleVariant[u.role] ?? "secondary"}>
                        {getRoleDisplayName(u.role)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.isActive ? "success" : "secondary"}>
                        {u.isActive ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {u.lastLogin ? formatTanggalWaktu(u.lastLogin) : "Belum pernah"}
                    </TableCell>
                    <TableCell className="text-center text-xs text-muted-foreground">
                      {u._count.inbounds + u._count.outbounds + u._count.transfers} trx
                    </TableCell>

                    {/* Tombol toggle — hanya SUPER_ADMIN, tidak bisa ke diri sendiri */}
                    {isSuperAdmin && (
                      <TableCell className="text-right">
                        {!isSelf ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 gap-1.5 text-xs"
                            disabled={toggling === u.id}
                            onClick={() => toggleStatus(u)}
                          >
                            {toggling === u.id ? (
                              <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            ) : u.isActive ? (
                              <><UserX size={12} /> Nonaktifkan</>
                            ) : (
                              <><UserCheck size={12} /> Aktifkan</>
                            )}
                          </Button>
                        ) : (
                          <span className="text-[11px] text-muted-foreground">(Anda)</span>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
