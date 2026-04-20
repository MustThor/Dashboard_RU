// ============================================================================
// ROLE & PERMISSION TYPES
// ============================================================================

export type Role =
  | "SUPER_ADMIN"
  | "ADMIN_GUDANG"
  | "SUPERVISOR"
  | "STAFF"
  | "AUDITOR"
  | "VIEWER";

export type Permission =
  | "dashboard:view"
  | "inventory:view"
  | "inventory:create"
  | "inventory:edit"
  | "inventory:delete"
  | "category:view"
  | "category:manage"
  | "location:view"
  | "location:manage"
  | "inbound:view"
  | "inbound:create"
  | "inbound:approve"
  | "outbound:view"
  | "outbound:create"
  | "outbound:approve"
  | "transfer:view"
  | "transfer:create"
  | "transfer:approve"
  | "opname:view"
  | "opname:create"
  | "opname:approve"
  | "supplier:view"
  | "supplier:manage"
  | "report:view"
  | "report:export"
  | "notification:view"
  | "user:view"
  | "user:manage";

/**
 * Permission matrix — maps each role to its allowed permissions.
 */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  SUPER_ADMIN: [
    "dashboard:view",
    "inventory:view", "inventory:create", "inventory:edit", "inventory:delete",
    "category:view", "category:manage",
    "location:view", "location:manage",
    "inbound:view", "inbound:create", "inbound:approve",
    "outbound:view", "outbound:create", "outbound:approve",
    "transfer:view", "transfer:create", "transfer:approve",
    "opname:view", "opname:create", "opname:approve",
    "supplier:view", "supplier:manage",
    "report:view", "report:export",
    "notification:view",
    "user:view", "user:manage",
  ],
  ADMIN_GUDANG: [
    "dashboard:view",
    "inventory:view", "inventory:create", "inventory:edit", "inventory:delete",
    "category:view", "category:manage",
    "location:view", "location:manage",
    "inbound:view", "inbound:create",
    "outbound:view", "outbound:create",
    "transfer:view", "transfer:create",
    "opname:view", "opname:create",
    "supplier:view", "supplier:manage",
    "report:view", "report:export",
    "notification:view",
    "user:view",
  ],
  SUPERVISOR: [
    "dashboard:view",
    "inventory:view",
    "category:view",
    "location:view",
    "inbound:view", "inbound:approve",
    "outbound:view", "outbound:approve",
    "transfer:view", "transfer:create", "transfer:approve",
    "opname:view", "opname:approve",
    "supplier:view",
    "report:view", "report:export",
    "notification:view",
  ],
  STAFF: [
    "dashboard:view",
    "inventory:view", "inventory:create", "inventory:edit",
    "category:view",
    "location:view",
    "inbound:view", "inbound:create",
    "outbound:view", "outbound:create",
    "transfer:view", "transfer:create",
    "opname:view", "opname:create",
    "notification:view",
  ],
  AUDITOR: [
    "dashboard:view",
    "inventory:view",
    "category:view",
    "location:view",
    "opname:view", "opname:create",
    "report:view", "report:export",
    "notification:view",
  ],
  VIEWER: [
    "dashboard:view",
    "inventory:view",
  ],
};

/**
 * Check if a role has a specific permission.
 */
export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

// ============================================================================
// MENU NAVIGATION TYPES
// ============================================================================

export interface NavItem {
  title: string;
  href: string;
  icon: string;
  permission: Permission;
  badge?: number;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

// ============================================================================
// STATUS & LOCATION TYPES
// ============================================================================

export type ItemStatus = "TERSEDIA" | "STOK_RENDAH" | "HABIS";

export type InboundStatus = "PENDING" | "DITERIMA" | "DIPERIKSA" | "DISIMPAN";

export type OutboundStatus = "PENDING" | "DISETUJUI" | "DIKEMAS" | "DIKIRIM";

export type TransferStatus = "PENDING" | "DIPROSES" | "SELESAI";

export type OpnameStatus = "DRAFT" | "DALAM_PROSES" | "SELESAI" | "DISETUJUI";

export type LocationType = "GUDANG" | "RAK" | "COLD_STORAGE" | "LOADING_DOCK";

export type NotificationType =
  | "INFO"
  | "WARNING"
  | "SUCCESS"
  | "ERROR"
  | "STOCK"
  | "TRANSACTION";

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  total?: number;
}

export interface PaginationParams {
  page: number;
  limit: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface DashboardStats {
  totalItems: number;
  totalInboundToday: number;
  totalOutboundToday: number;
  lowStockCount: number;
  totalValue: number;
  totalCategories: number;
  totalLocations: number;
  totalSuppliers: number;
}

// ============================================================================
// DOMAIN ENTITY TYPES  (shared across pages)
// ============================================================================

export interface Category {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
}

export interface Location {
  id: string;
  code: string;
  name: string;
  type: string;
  capacity: number;
  used: number;
  isActive: boolean;
}

export interface Item {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  stock: number;
  minStock: number;
  unit: string;
  price: number;
  weight: number | null;
  status: string;
  category: Pick<Category, 'id' | 'name'>;
  location: Pick<Location, 'id' | 'name'>;
}

export interface Supplier {
  id: string;
  code: string;
  name: string;
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  isActive: boolean;
}

export interface InboundTransaction {
  id: string;
  poNumber: string;
  date: string;
  status: string;
  notes: string | null;
  totalValue: number;
  supplier: Pick<Supplier, 'name'>;
  receiver: { name: string } | null;
  items: Array<{ quantity: number; price: number; item: Pick<Item, 'name' | 'sku'> }>;
}

export interface OutboundTransaction {
  id: string;
  soNumber: string;
  date: string;
  destination: string;
  status: string;
  notes: string | null;
  totalValue: number;
  shipper: { name: string } | null;
  items: Array<{ quantity: number; price: number; item: Pick<Item, 'name' | 'sku'> }>;
}

export interface TransferTransaction {
  id: string;
  transferNumber: string;
  date: string;
  status: string;
  notes: string | null;
  fromLocation: Pick<Location, 'name'>;
  toLocation: Pick<Location, 'name'>;
  transferBy: { name: string } | null;
  items: Array<{ quantity: number; item: Pick<Item, 'name' | 'sku'> }>;
}

export interface StockOpname {
  id: string;
  opnameNumber: string;
  date: string;
  status: string;
  notes: string | null;
  location: Pick<Location, 'name'>;
  auditor: { name: string } | null;
  items: Array<{ systemStock: number; physicalStock: number; difference: number; item: Pick<Item, 'name' | 'sku'> }>;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  user: { name: string } | null;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  lastLogin: string | null;
  createdAt: string;
  _count: { inbounds: number; outbounds: number; transfers: number };
}

// ── Shared badge variant map (status → badge variant) ──────────────────────
export const STATUS_BADGE_VARIANT: Record<string, 'success' | 'warning' | 'destructive' | 'info' | 'secondary'> = {
  TERSEDIA:    'success',
  STOK_RENDAH: 'warning',
  HABIS:       'destructive',
  PENDING:     'secondary',
  DITERIMA:    'info',
  DIPERIKSA:   'info',
  DISIMPAN:    'success',
  DISETUJUI:   'success',
  DIKEMAS:     'info',
  DIKIRIM:     'success',
  DIPROSES:    'info',
  SELESAI:     'success',
  DRAFT:       'secondary',
  DALAM_PROSES:'warning',
};

