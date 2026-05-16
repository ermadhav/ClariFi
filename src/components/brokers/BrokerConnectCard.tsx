'use client';

import { useState } from 'react';
import { showToast } from '@/components/ui/Toast';
import { X } from 'lucide-react';

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
  
  const [showAngelModal, setShowAngelModal] = useState(false);
  const [angelCreds, setAngelCreds] = useState({ clientId: '', password: '', totp: '' });
  
  const handleConnect = async () => {
    if (broker === 'ANGEL_ONE') {
      setShowAngelModal(true);
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`/api/brokers/${broker.toLowerCase()}/auth?t=${Date.now()}`, { 
        cache: 'no-store',
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else if (data.error) {
        showToast(data.error, 'error');
      }
    } catch (error) {
      showToast('Failed to connect broker', 'error');
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
        cache: 'no-store'
      });
      
      const data = await response.json();
      
      if (data.success) {
        showToast('Portfolio synced successfully', 'success');
      } else {
        showToast('Sync failed', 'error');
      }
    } catch (error) {
      showToast('Failed to sync portfolio', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAngelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('/api/brokers/angelone/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(angelCreds),
      });
      const data = await response.json();
      
      if (data.success) {
        showToast('Angel One connected successfully!', 'success');
        setShowAngelModal(false);
        // Page reload to reflect state, or ideally update state via props
        window.location.reload(); 
      } else {
        showToast(data.error || 'Failed to connect', 'error');
      }
    } catch (error) {
      showToast('Connection failed', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <>
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

      {/* Angel One Credential Modal */}
      {showAngelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#13141b] border border-white/10 rounded-xl p-6 w-full max-w-md shadow-2xl relative">
            <button onClick={() => setShowAngelModal(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold mb-4">Connect Angel One</h3>
            <p className="text-sm text-muted-foreground mb-6">Angel One requires your credentials and TOTP to authenticate via SmartAPI.</p>
            
            <form onSubmit={handleAngelSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Client ID</label>
                <input required value={angelCreds.clientId} onChange={e => setAngelCreds({...angelCreds, clientId: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white" placeholder="Enter Client ID" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">PIN / Password</label>
                <input required type="password" value={angelCreds.password} onChange={e => setAngelCreds({...angelCreds, password: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white" placeholder="Enter PIN" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">TOTP (Authenticator App)</label>
                <input required value={angelCreds.totp} onChange={e => setAngelCreds({...angelCreds, totp: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white" placeholder="123456" />
              </div>
              <button type="submit" disabled={loading} className="w-full bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg py-2 text-sm font-medium transition-colors mt-2">
                {loading ? 'Connecting...' : 'Secure Login'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
