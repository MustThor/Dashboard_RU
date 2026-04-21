"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard, Package, Tag, TruckIcon,
  PackageOpen, ClipboardCheck, Building2,
  FileBarChart, Bell, Users, Warehouse, X, ChevronLeft, ChevronRight, MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { hasPermission, type Role, type Permission } from "@/types";
import { getRoleDisplayName, getInitials } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// ─── Navigation config ────────────────────────────────────────────────────────

interface NavLink { title: string; href: string; icon: React.ReactNode; permission: Permission }
interface NavSection { title: string; links: NavLink[] }

const NAV: NavSection[] = [
  { title: "Utama", links: [
    { title: "Dashboard",     href: "/dashboard",              icon: <LayoutDashboard size={18} />, permission: "dashboard:view"  },
  ]},
  { title: "Inventaris", links: [
    { title: "Daftar Barang", href: "/dashboard/inventaris",   icon: <Package size={18} />,         permission: "inventory:view"  },
    { title: "Kategori",      href: "/dashboard/kategori",     icon: <Tag size={18} />,              permission: "category:view"   },
    { title: "Lokasi",        href: "/dashboard/lokasi",       icon: <MapPin size={18} />,           permission: "location:view"   },
  ]},
  { title: "Operasional", links: [
    { title: "Barang Masuk",  href: "/dashboard/barang-masuk", icon: <TruckIcon size={18} />,       permission: "inbound:view"    },
    { title: "Barang Keluar", href: "/dashboard/barang-keluar",icon: <PackageOpen size={18} />,     permission: "outbound:view"   },
    { title: "Stok Opname",   href: "/dashboard/stok-opname",  icon: <ClipboardCheck size={18} />, permission: "opname:view"     },
  ]},
  { title: "Manajemen", links: [
    { title: "Supplier",      href: "/dashboard/supplier",     icon: <Building2 size={18} />,       permission: "supplier:view"   },
    { title: "Laporan",       href: "/dashboard/laporan",      icon: <FileBarChart size={18} />,    permission: "report:view"     },
  ]},
  { title: "Sistem", links: [
    { title: "Notifikasi",    href: "/dashboard/notifikasi",   icon: <Bell size={18} />,            permission: "notification:view"},
    { title: "Pengguna",      href: "/dashboard/pengguna",     icon: <Users size={18} />,           permission: "user:view"       },
  ]},
];

export const SIDEBAR_W      = 260; // px – expanded
export const SIDEBAR_W_MINI = 68;  // px – collapsed

// ─── Props ────────────────────────────────────────────────────────────────────

interface SidebarProps {
  open: boolean;           // mobile drawer
  onClose: () => void;
  collapsed: boolean;      // desktop icon-only
  onToggleCollapse: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Sidebar({ open, onClose, collapsed, onToggleCollapse }: SidebarProps) {
  const pathname  = usePathname();
  const { data: session } = useSession();
  const userRole  = (session?.user?.role ?? "VIEWER") as Role;

  return (
    <>
      {/* Mobile backdrop — tap to close */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/*
        KEY INSIGHT: sidebar is ALWAYS position:fixed.
        — Mobile: slides in/out with translateX (GPU, zero layout impact)
        — Desktop: always visible, width changes but since it's fixed it
          does NOT cause layout reflow in the main content area.
        The main content uses padding-left that switches instantly.
      */}
      <aside
        style={{ width: collapsed ? SIDEBAR_W_MINI : SIDEBAR_W }}
        className={cn(
          // Always fixed — never in the flex flow → no layout reflow
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r",
          "bg-sidebar text-sidebar-foreground",
          // Width animates only on desktop (GPU-composited because position:fixed)
          "lg:transition-[width] lg:duration-200 lg:ease-out",
          // Mobile: slide in/out with transform (GPU)
          "transition-transform duration-200 ease-out",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        {/* Logo */}
        <div className={cn(
          "flex h-16 shrink-0 items-center border-b",
          collapsed ? "lg:justify-center lg:px-0" : "justify-between px-4"
        )}>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow">
              <Warehouse size={18} />
            </div>
            <div className={cn(collapsed ? "lg:hidden" : "")}>
              <p className="text-sm font-bold leading-none">DashboardRU</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Rumah Ungu WMS</p>
            </div>
          </div>
          {/* Mobile close */}
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground lg:hidden cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-4 space-y-4">
          {NAV.map((section) => {
            const links = section.links.filter(l => hasPermission(userRole, l.permission));
            if (!links.length) return null;

            return (
              <div key={section.title}>
                <p className={cn(
                  "mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground",
                  "overflow-hidden whitespace-nowrap",
                  collapsed && "lg:hidden"
                )}>
                  {section.title}
                </p>
                <div className="space-y-0.5">
                  {links.map((link) => {
                    const active = link.href === "/dashboard"
                      ? pathname === "/dashboard"
                      : pathname.startsWith(link.href);

                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={onClose}
                        title={collapsed ? link.title : undefined}
                        className={cn(
                          "flex items-center gap-3 rounded-lg py-2.5 text-sm font-medium",
                          "transition-colors duration-150",
                          collapsed ? "lg:justify-center lg:px-2" : "px-3",
                          active
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        )}
                      >
                        <span className="shrink-0">{link.icon}</span>
                        <span className={cn("overflow-hidden whitespace-nowrap", collapsed && "lg:hidden")}>
                          {link.title}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* User */}
        {session?.user && (
          <div className={cn("shrink-0 border-t p-3", collapsed && "lg:flex lg:justify-center")}>
            <div className={cn("flex items-center gap-3 rounded-lg px-2 py-2", collapsed && "lg:hidden")}>
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="text-xs">{getInitials(session.user.name ?? "")}</AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-medium">{session.user.name}</span>
                <span className="truncate text-[11px] text-muted-foreground">{getRoleDisplayName(session.user.role)}</span>
              </div>
            </div>
            {/* Icon-only user avatar when collapsed */}
            <Avatar className={cn("h-8 w-8 shrink-0", collapsed ? "lg:flex hidden" : "hidden")}>
              <AvatarFallback className="text-xs">{getInitials(session.user.name ?? "")}</AvatarFallback>
            </Avatar>
          </div>
        )}

        {/* Desktop collapse toggle */}
        <button
          onClick={onToggleCollapse}
          className="absolute -right-3 top-20 hidden h-6 w-6 items-center justify-center rounded-full border bg-background text-muted-foreground shadow hover:text-foreground cursor-pointer lg:flex"
        >
          {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
        </button>
      </aside>
    </>
  );
}
