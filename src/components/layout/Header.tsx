"use client";

import { signOut, useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import { usePathname, useRouter } from "next/navigation";
import { Bell, LogOut, Moon, Search, Sun, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials, getRoleDisplayName } from "@/lib/utils";
import { useState, useRef, useEffect } from "react";
import { hasPermission, type Role } from "@/types";

// ── Notification Bell — fetch unread count from API ────────────────────────────
function NotifBell() {
  const [unread, setUnread] = useState(0);
  const router = useRouter();

  useEffect(() => {
    function fetch_() {
      fetch("/api/notifications")
        .then(r => r.json())
        .then(j => { if (j.success) setUnread(j.unreadCount ?? 0); })
        .catch(() => {});
    }
    fetch_();
    const id = setInterval(fetch_, 30_000); // refresh tiap 30 detik
    return () => clearInterval(id);
  }, []);

  return (
    <Button
      variant="ghost" size="icon"
      className="relative h-9 w-9"
      onClick={() => router.push("/dashboard/notifikasi")}
      aria-label="Notifikasi"
    >
      <Bell size={16} />
      {unread > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
          {unread > 99 ? "99+" : unread}
        </span>
      )}
    </Button>
  );
}


const breadcrumbMap: Record<string, string> = {
  "/dashboard":              "Dashboard",
  "/dashboard/inventaris":   "Daftar Barang",
  "/dashboard/kategori":     "Kategori",
  "/dashboard/lokasi":       "Lokasi Penyimpanan",
  "/dashboard/barang-masuk": "Barang Masuk",
  "/dashboard/barang-keluar":"Barang Keluar",
  "/dashboard/transfer":     "Transfer",
  "/dashboard/stok-opname":  "Stok Opname",
  "/dashboard/supplier":     "Supplier",
  "/dashboard/laporan":      "Laporan",
  "/dashboard/notifikasi":   "Notifikasi",
  "/dashboard/pengguna":     "Pengguna",
};

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  // Guard: theme is only available after client hydration
  const [mounted, setMounted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);

  const pageTitle = breadcrumbMap[pathname] ?? "Dashboard";

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b bg-background/80 backdrop-blur-lg px-4 md:px-6">
      {/* Left: hamburger (mobile) + breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Hamburger – mobile only */}
        <button
          onClick={onMenuClick}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md hover:bg-accent transition-colors lg:hidden cursor-pointer"
          aria-label="Buka menu"
        >
          <Menu size={20} />
        </button>

        {/* Breadcrumb – hidden when mobile search is open */}
        <div className={showSearch ? "hidden sm:block" : "block"}>
          <p className="hidden text-xs text-muted-foreground sm:block">
            Sistem Manajemen Gudang
            <span className="mx-1.5">/</span>
            <span className="text-foreground font-medium">{pageTitle}</span>
          </p>
          <h1 className="text-base font-semibold leading-tight sm:text-lg">{pageTitle}</h1>
        </div>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-1 md:gap-2">
        {/* Search – desktop always visible, mobile as expandable */}
        {showSearch ? (
          <div className="flex items-center gap-1 sm:hidden">
            <input
              autoFocus
              placeholder="Cari..."
              className="h-9 w-40 rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => setShowSearch(false)}>
              <Sun size={16} className="hidden" />✕
            </Button>
          </div>
        ) : (
          <>
            {/* Mobile search trigger */}
            <Button
              variant="ghost" size="icon" className="h-9 w-9 sm:hidden"
              onClick={() => setShowSearch(true)}
            >
              <Search size={16} />
            </Button>
            {/* Desktop search */}
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
              <input
                placeholder="Cari barang, PO, SO..."
                className="h-9 w-48 md:w-64 rounded-md border bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </>
        )}

        {/* Theme toggle – only render after mount to prevent hydration mismatch */}
        {!showSearch && mounted && (
          <Button
            variant="ghost" size="icon" className="h-9 w-9"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle tema"
          >
            {theme === "dark"
              ? <Sun size={16} />
              : <Moon size={16} />}
          </Button>
        )}

        {/* Notification — hidden for roles without notification:view */}
        {!showSearch && hasPermission((session?.user?.role ?? "VIEWER") as Role, "notification:view") && (
          <NotifBell />
        )}

        {/* User menu */}
        <div ref={menuRef} className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-accent transition-colors cursor-pointer"
          >
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback className="text-xs">
                {getInitials(session?.user?.name ?? "U")}
              </AvatarFallback>
            </Avatar>
            {/* Name – only on md+ */}
            <div className="hidden md:flex flex-col items-start">
              <span className="text-sm font-medium leading-none">{session?.user?.name}</span>
              <span className="text-[10px] text-muted-foreground mt-0.5">
                {getRoleDisplayName(session?.user?.role ?? "VIEWER")}
              </span>
            </div>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-52 rounded-xl border bg-popover p-1.5 shadow-lg animate-fade-in z-50">
              <div className="px-3 py-2 border-b mb-1">
                <p className="text-sm font-medium truncate">{session?.user?.name}</p>
                <p className="text-xs text-muted-foreground truncate">{session?.user?.email}</p>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
              >
                <LogOut size={14} />
                Keluar
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
