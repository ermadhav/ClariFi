'use client';

import { useState } from 'react';
import { toast } from 'sonner';

interface BrokerConnectCardProps {
  broker: 'ZERODHA' | 'UPSTOX' | 'ANGEL_ONE';
  isConnected: boolean;
  lastSynced?: Date;
}

export function BrokerConnectCard({ broker, isConnected, lastSynced }: BrokerConnectCardProps) {
  const [loading, setLoading] = useState(false);
  
  const brokerInfo = {
    ZERODHA: { name: 'Zerodha', logo: '/brokers/zerodha.svg', color: '#387ED1' },
    UPSTOX: { name: 'Upstox', logo: '/brokers/upstox.svg', color: '#6C5CE7' },
    ANGEL_ONE: { name: 'Angel One', logo: '/brokers/angelone.svg', color: '#E74C3C' },
  };
  
  const info = brokerInfo[broker];
  
  const handleConnect = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/brokers/${broker.toLowerCase()}/auth`);
      const data = await response.json();
      
      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (error) {
      toast.error('Failed to connect broker');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSync = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/brokers/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ broker }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Portfolio synced successfully');
      } else {
        toast.error('Sync failed');
      }
    } catch (error) {
      toast.error('Failed to sync portfolio');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="glass-card p-6 rounded-xl border border-white/5">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg flex items-center justify-center font-bold text-white text-sm" style={{ backgroundColor: info.color }}>
            {info.name.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{info.name}</h3>
            {isConnected && lastSynced && (
              <p className="text-sm text-muted-foreground">
                Last synced: {new Date(lastSynced).toLocaleString()}
              </p>
            )}
            {!isConnected && (
              <p className="text-sm text-muted-foreground">Not connected</p>
            )}
          </div>
        </div>
        
        <div className="flex gap-2">
          {isConnected ? (
            <>
              <button className="btn-primary px-4 py-2 text-sm" onClick={handleSync} disabled={loading}>
                {loading ? 'Syncing...' : 'Sync Now'}
              </button>
              <button className="btn-secondary px-4 py-2 text-sm" onClick={() => {/* Disconnect logic */}}>
                Disconnect
              </button>
            </>
          ) : (
            <button className="btn-primary px-4 py-2 text-sm" onClick={handleConnect} disabled={loading}>
              {loading ? 'Connecting...' : 'Connect'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
