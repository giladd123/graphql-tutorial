// 1
import { PrismaClient } from "@prisma/client";
import { ALL } from "dns";

// 2
const prisma = new PrismaClient();

// 3
async function main() {
  //   const newLink = await prisma.link.create({
  //     data: {
  //       description: "Fullstack tutorial for GraphQl",
  //       url: "www.howtographql.com",
  //     },
  //   });
  const allLinks = await prisma.link.deleteMany();
  console.log(allLinks);
}

// 4
main()
  .catch((e) => {
    throw e;
  })
  // 5
  .finally(async () => {
    await prisma.$disconnect();
  });
