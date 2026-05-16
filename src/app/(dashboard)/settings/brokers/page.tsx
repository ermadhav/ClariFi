import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { BrokerConnectCard } from '@/components/brokers/BrokerConnectCard';

export default async function BrokersPage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect('/login');
  }
  
  const brokerAccounts = await prisma.brokerAccount.findMany({
    where: { userId: session.user.id }
  });
  
  const zerodha = brokerAccounts.find(b => b.brokerName === 'ZERODHA');
  const upstox = brokerAccounts.find(b => b.brokerName === 'UPSTOX');
  const angelone = brokerAccounts.find(b => b.brokerName === 'ANGEL_ONE');
  
  return (
    <div className="space-y-6 max-w-4xl mx-auto py-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Connected Brokers</h1>
        <p className="text-muted-foreground mt-2">
          Link your broker accounts to automatically sync your portfolio and transactions.
        </p>
      </div>
      
      <div className="grid gap-4 mt-8">
        <BrokerConnectCard
          broker="ZERODHA"
          isConnected={zerodha?.isConnected || false}
          lastSynced={zerodha?.lastSynced || undefined}
        />
        <BrokerConnectCard
          broker="UPSTOX"
          isConnected={upstox?.isConnected || false}
          lastSynced={upstox?.lastSynced || undefined}
        />
        <BrokerConnectCard
          broker="ANGEL_ONE"
          isConnected={angelone?.isConnected || false}
          lastSynced={angelone?.lastSynced || undefined}
        />
      </div>
    </div>
  );
}
