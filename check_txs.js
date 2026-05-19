require('dotenv').config();
const { PrismaClient } = require('./node_modules/.prisma/client');
const prisma = new PrismaClient();

async function main() {
  const txs = await prisma.transaction.findMany();
  console.log(JSON.stringify(txs, null, 2));
  await prisma.$disconnect();
}

main().catch(console.error);
