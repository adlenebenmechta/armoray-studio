import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  prismaBootstrapped: boolean | undefined
}

// On serverless hosts (Vercel) the repo filesystem is read-only: SQLite must
// live in /tmp. We bootstrap the schema once per cold start with raw SQL.
function resolveDatasourceUrl(): string | undefined {
  if (process.env.VERCEL) {
    const url = process.env.DATABASE_URL || "";
    if (!url || url.startsWith("file:")) {
      return "file:/tmp/armoray.db";
    }
    return undefined; // external db (Turso/Postgres) — leave as configured
  }
  return undefined;
}

const datasourceUrl = resolveDatasourceUrl();

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV !== 'production' ? ['query'] : ['error'],
    ...(datasourceUrl ? { datasources: { db: { url: datasourceUrl } } } : {}),
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

// Bootstrap ephemeral schema on serverless (once per lambda instance).
if (process.env.VERCEL && datasourceUrl && !globalForPrisma.prismaBootstrapped) {
  globalForPrisma.prismaBootstrapped = true;
  db.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "Project" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'chat',
    "locale" TEXT NOT NULL DEFAULT 'ar',
    "refVideoName" TEXT,
    "refDuration" REAL,
    "refTranscript" TEXT,
    "refAnalysis" TEXT,
    "productName" TEXT,
    "productUrl" TEXT,
    "productDesc" TEXT,
    "productImage" TEXT,
    "productSize" TEXT,
    "productFacts" TEXT,
    "credits" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
  )`).catch(() => {});
  db.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "Message" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "projectId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'text',
    "meta" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE
  )`).catch(() => {});
  db.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "Scene" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "projectId" TEXT NOT NULL,
    "index" INTEGER NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'demo',
    "description" TEXT NOT NULL,
    "camera" TEXT,
    "onScreenText" TEXT,
    "duration" REAL NOT NULL DEFAULT 5,
    "isProductScene" BOOLEAN NOT NULL DEFAULT false,
    "newPrompt" TEXT,
    "newVoiceover" TEXT,
    "onScreenNew" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "taskId" TEXT,
    "videoUrl" TEXT,
    "error" TEXT,
    "speechQa" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE
  )`).catch(() => {});
}
