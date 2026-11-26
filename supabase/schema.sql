-- Run this in Supabase Dashboard -> SQL Editor to create the tables.

CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT PRIMARY KEY,
  "uid" TEXT UNIQUE NOT NULL,
  "password" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'user',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Session" (
  "id" TEXT PRIMARY KEY,
  "uid" TEXT NOT NULL,
  "token" TEXT UNIQUE NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "DataRecord" (
  "id" SERIAL PRIMARY KEY,
  "email" TEXT,
  "phone" TEXT,
  "password" TEXT,
  "notes" TEXT,
  "rating" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Allow API access via Supabase anon/publishable key
ALTER TABLE "User" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Session" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "DataRecord" DISABLE ROW LEVEL SECURITY;

-- Optional: Enable Supabase Realtime on DataRecord (safe if Realtime is disabled)
DO $$
BEGIN
  ALTER TABLE "DataRecord" REPLICA IDENTITY FULL;
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'DataRecord'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE "DataRecord";
  END IF;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;
