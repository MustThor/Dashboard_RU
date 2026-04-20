import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

import { createClient } from "@libsql/client";

function createPrismaClient(): PrismaClient {
  // Jika ada env variables dari Turso, gunakan Turso remote db (untuk Vercel/Production).
  // Jika tidak, gunakan local file dev.db.
  const url = process.env.TURSO_DATABASE_URL || `file:${process.cwd()}/dev.db`;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  const libsql = createClient({
    url,
    authToken,
  });

  const adapter = new PrismaLibSql(libsql);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
