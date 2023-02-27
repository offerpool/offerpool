import { PrismaClient } from "@prisma/client";
import { cats } from "./catinfo.js";

const prisma = new PrismaClient();
async function main() {
  for (const catInfo of cats) {
    await prisma.catInfo.upsert({
      where: { id: catInfo.id },
      update: catInfo,
      create: catInfo,
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
