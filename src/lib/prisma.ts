import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  // Jika ada env variables dari Turso, gunakan Turso remote db (untuk Vercel/Production).
  // Jika tidak, gunakan local file dev.db.
  const url = process.env.TURSO_DATABASE_URL || "file:./dev.db";
  const authToken = process.env.TURSO_AUTH_TOKEN;

  // ── FIX: Prisma runtime mewajibkan DATABASE_URL ada di process.env sebagai dummy
  process.env.DATABASE_URL = "file:./dev.db";

  const adapter = new PrismaLibSql({ url, authToken });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
