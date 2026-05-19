const { PrismaClient } = require('./node_modules/.prisma/client');
const p = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL });

async function main() {
  const alerts = await p.alert.findMany({
    select: { id: true, symbol: true, targetValue: true, type: true, isActive: true, triggered: true, userId: true }
  });
  console.log(JSON.stringify(alerts, null, 2));
  await p.$disconnect();
}

main().catch(console.error);
