import prisma from "../lib/prisma";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";

dotenv.config({ path: "./.env" });

async function main() {
  const adminUid = process.env.ADMIN_ID || "hellobabu";
  const adminPass = process.env.ADMIN_PASSWORD || "boombam";
  const hashedAdmin = await bcrypt.hash(adminPass, 10);

  await prisma.user.upsert({
    where: { uid: adminUid },
    update: { password: hashedAdmin, role: "admin" },
    create: {
      uid: adminUid,
      password: hashedAdmin,
      role: "admin",
    },
  });

  // Seed a demo user so user login can be tested right away too
  const hashedDemo = await bcrypt.hash("user123", 10);
  await prisma.user.upsert({
    where: { uid: "Anish" },
    update: {},
    create: {
      uid: "Anish",
      password: hashedDemo,
      role: "user",
    },
  });

  // Seed DataView sample records if empty
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
        { email: null, phone: "+998907766844", password: "Fayzullo666", rating: 4, notes: "Mobile UZ" }
      ],
    });
  }

  console.log(`Seeded admin (${adminUid}), demo user (Anish / user123), and sample DataView records.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
