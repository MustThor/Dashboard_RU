"use client";

import { useState, useEffect } from "react";
import { Sidebar, SIDEBAR_W, SIDEBAR_W_MINI } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed]     = useState(false);
  const [isDesktop, setIsDesktop]     = useState(false);

  // Detect desktop breakpoint after mount (SSR-safe)
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(c => !c)}
      />

      {/*
        Sidebar is ALWAYS position:fixed — zero impact on layout flow.
        suppressHydrationWarning because paddingLeft changes after mount.
      */}
      <div
        className="flex flex-col min-h-screen"
        style={{ paddingLeft: isDesktop ? (collapsed ? SIDEBAR_W_MINI : SIDEBAR_W) : 0 }}
        suppressHydrationWarning
      >
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 pb-24 lg:p-6 lg:pb-6 animate-fade-in">
          {children}
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
