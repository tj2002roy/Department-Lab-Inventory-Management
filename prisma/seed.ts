import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Preparing fresh deployment database state...");

  // 1. Wipe all existing tables for a clean, production-ready deployment
  await prisma.activityLog.deleteMany({});
  await prisma.item.deleteMany({});
  await prisma.system.deleteMany({});
  await prisma.labAssignment.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.lab.deleteMany({});
  console.log("🧹 Previous database tables cleared.");

  // 2. Seed ONLY the Head of Department Admin Account
  const adminPasswordHash = hashPassword("sayak123");

  const hodAdmin = await prisma.user.create({
    data: {
      username: "sayak",
      password: adminPasswordHash,
      name: "Professor Sayak Pramanik",
      email: "sayak.pramanik@uem.edu.in",
      role: "ADMIN",
      designation: "Head of Department",
      prefix: "Prof.",
      firstName: "Sayak",
      lastName: "Pramanik",
      employeeCode: "HOD-UEM",
      contactNumber: "+91 9830000000",
      position: "Faculty",
    },
  });
  console.log(`✅ Seeded Head of Department Admin (${hodAdmin.name} - username: ${hodAdmin.username}).`);

  // 3. Seed 5 Institutional Baseline Laboratories (Clean State - 0 Equipment)
  const labData = [
    {
      name: "Digital Lab",
      description: "Computational Workstations and CAD Facility",
      workingPcs: 0,
      inactivePcs: 0,
    },
    {
      name: "Lab 1",
      description: "Software Engineering and Algorithm Systems",
      workingPcs: 0,
      inactivePcs: 0,
    },
    {
      name: "Lab 2",
      description: "Database and Enterprise Network Systems",
      workingPcs: 0,
      inactivePcs: 0,
    },
    {
      name: "Lab 3",
      description: "Artificial Intelligence and Data Science Facility",
      workingPcs: 0,
      inactivePcs: 0,
    },
    {
      name: "Lab 4",
      description: "IoT, Embedded Computing and Robotics Facility",
      workingPcs: 0,
      inactivePcs: 0,
    },
  ];

  for (const l of labData) {
    await prisma.lab.create({
      data: {
        name: l.name,
        description: l.description,
        workingPcs: l.workingPcs,
        inactivePcs: l.inactivePcs,
      },
    });
  }
  console.log(`✅ Seeded ${labData.length} clean institutional laboratories (0 equipment, ready for in-charge assignment).`);

  // 4. Initial Audit Log
  await prisma.activityLog.create({
    data: {
      action_type: "SYSTEM_INIT",
      comment_text: `Production deployment initialized. Head of Department (${hodAdmin.name}) configured as master administrator.`,
      userId: hodAdmin.id,
      userName: hodAdmin.name,
    },
  });

  console.log("🚀 Application is 100% freshly initialized and ready for deployment!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
