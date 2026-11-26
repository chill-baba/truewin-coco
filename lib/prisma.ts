// lib/prisma.ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
  // eslint-disable-next-line no-var
  var __dbInitPromise: Promise<void> | undefined;
}

// On Vercel serverless functions, the root filesystem is strictly read-only.
// Only /tmp is writable. If DATABASE_URL is not explicitly set or points to ./prisma/dev.db or ./dev.db,
// we automatically copy/route it to /tmp/dev.db in serverless/production environments.
function getDatabaseUrl(): string {
  if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith("postgres")) {
    return process.env.DATABASE_URL;
  }

  // If running on Vercel or production serverless
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NODE_ENV === "production") {
    const tmpDbPath = path.join("/tmp", "dev.db");
    
    // Copy bundled seed database if it exists in local directory
    if (!fs.existsSync(tmpDbPath)) {
      const candidates = [
        path.join(process.cwd(), "prisma", "dev.db"),
        path.join(process.cwd(), "dev.db"),
      ];
      for (const cand of candidates) {
        if (fs.existsSync(cand)) {
          try {
            fs.copyFileSync(cand, tmpDbPath);
            break;
          } catch {
            // ignore
          }
        }
      }
    }
    return `file:${tmpDbPath}`;
  }

  return process.env.DATABASE_URL || "file:./prisma/dev.db";
}

const dbUrl = getDatabaseUrl();
process.env.DATABASE_URL = dbUrl;

const prisma =
  global.__prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: dbUrl,
      },
    },
  });

if (process.env.NODE_ENV !== "production") {
  global.__prisma = prisma;
}

export async function ensureDbReady(): Promise<void> {
  if (!global.__dbInitPromise) {
    global.__dbInitPromise = (async () => {
      try {
        await prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS "User" (
            "id" TEXT PRIMARY KEY,
            "uid" TEXT UNIQUE NOT NULL,
            "password" TEXT NOT NULL,
            "role" TEXT NOT NULL DEFAULT 'user',
            "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
          );
        `);

        await prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS "Session" (
            "id" TEXT PRIMARY KEY,
            "uid" TEXT NOT NULL,
            "token" TEXT UNIQUE NOT NULL,
            "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
          );
        `);

        await prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS "DataRecord" (
            "id" INTEGER PRIMARY KEY AUTOINCREMENT,
            "email" TEXT,
            "phone" TEXT,
            "password" TEXT,
            "notes" TEXT,
            "rating" INTEGER NOT NULL DEFAULT 0,
            "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
          );
        `);

        // Ensure default admin exists
        const adminId = process.env.ADMIN_ID || "hellobabu";
        const adminPassword = process.env.ADMIN_PASSWORD || "boombam";

        const existingAdmin = await prisma.user.findUnique({
          where: { uid: adminId },
        });

        if (!existingAdmin) {
          const hashedPassword = await bcrypt.hash(adminPassword, 10);
          await prisma.user.create({
            data: {
              uid: adminId,
              password: hashedPassword,
              role: "admin",
            },
          });
        }

        // Seed default demo user Anish / user123
        const demoUser = await prisma.user.findUnique({ where: { uid: "Anish" } });
        if (!demoUser) {
          const hashedDemo = await bcrypt.hash("user123", 10);
          await prisma.user.create({
            data: {
              uid: "Anish",
              password: hashedDemo,
              role: "user",
            },
          });
        }

        // Seed demo records if empty
        const count = await prisma.dataRecord.count();
        if (count === 0) {
          await prisma.dataRecord.createMany({
            data: [
              { email: "testmaul@gmail.com", phone: null, password: "testmail", rating: 0, notes: "Test account" },
              { email: "adhamovfayzullo11082004@gmail.com", phone: null, password: "Fayzullo666", rating: 4, notes: "Primary" },
              { email: "gustavopereira2001@yahoo.com", phone: null, password: "03076349066$Gu", rating: 3, notes: "Yahoo backup" },
              { email: null, phone: "5551982579260", password: "03076349066$Gu", rating: 2, notes: "Phone only" },
              { email: "yoshlar79@gmail.com", phone: null, password: "ficbo8-gocFyh-wihsox", rating: 5, notes: "Verified" },
              { email: "gzhdjzjsusisjj@gmail.com", phone: null, password: "sjjsjdhdbd", rating: 1, notes: "" },
              { email: "sjhsdbjsbsjsbshs@gmail.com", phone: null, password: "syushshehe", rating: 0, notes: "" },
              { email: null, phone: "+998907766844", password: "Fayzullo666", rating: 4, notes: "Mobile UZ" },
            ],
          });
        }
      } catch (err) {
        console.error("ensureDbReady error:", err);
      }
    })();
  }

  await global.__dbInitPromise;
}

export default prisma;
