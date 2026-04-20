"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Package, TruckIcon, Bell, Tag,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { title: "Dashboard",  href: "/dashboard",             icon: LayoutDashboard },
  { title: "Barang",     href: "/dashboard/inventaris",  icon: Package         },
  { title: "Masuk",      href: "/dashboard/barang-masuk",icon: TruckIcon       },
  { title: "Kategori",   href: "/dashboard/kategori",    icon: Tag             },
  { title: "Notifikasi", href: "/dashboard/notifikasi",  icon: Bell            },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t bg-background/95 backdrop-blur-md lg:hidden safe-bottom">
      {navItems.map(({ title, href, icon: Icon }) => {
        const isActive =
          href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className="flex flex-1 flex-col items-center justify-center gap-0.5 py-1 transition-colors"
          >
            <Icon
              size={20}
              className={cn(
                "transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            />
            <span
              className={cn(
                "text-[10px] font-medium transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              {title}
            </span>
            {isActive && (
              <span className="absolute top-0 h-0.5 w-8 rounded-full bg-primary" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
