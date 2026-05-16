'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Target, Wallet, Link2, ArrowRight, ArrowLeft, Check, Shield, TrendingUp, Zap, BarChart3, PieChart } from 'lucide-react';

interface OnboardingPageProps {
  onComplete: () => void;
}

const steps = [
  { id: 'welcome', title: 'Welcome to ClariFi', icon: Zap },
  { id: 'profile', title: 'Personal Details', icon: User },
  { id: 'risk', title: 'Risk Appetite', icon: Shield },
  { id: 'goals', title: 'Investment Goals', icon: Target },
  { id: 'broker', title: 'Connect Broker', icon: Link2 },
];

const riskLevels = [
  { id: 'conservative', label: 'Conservative', desc: 'Prefer stable returns with minimal risk. Focus on large caps and debt.', color: 'from-blue-500/20 to-blue-500/5', border: 'border-blue-500/30', icon: Shield, emoji: '🛡️' },
  { id: 'moderate', label: 'Moderate', desc: 'Balance between growth and safety. Mix of large and mid caps.', color: 'from-indigo-500/20 to-indigo-500/5', border: 'border-indigo-500/30', icon: BarChart3, emoji: '⚖️' },
  { id: 'aggressive', label: 'Aggressive', desc: 'High growth potential with higher risk. Small caps and sector bets.', color: 'from-orange-500/20 to-orange-500/5', border: 'border-orange-500/30', icon: TrendingUp, emoji: '🚀' },
];

const goals = [
  { id: 'wealth', label: 'Wealth Creation', emoji: '💰', desc: 'Long-term wealth building' },
  { id: 'retirement', label: 'Retirement', emoji: '🏖️', desc: 'Plan for retirement' },
  { id: 'shortterm', label: 'Short-term Gains', emoji: '⚡', desc: 'Quick returns in months' },
  { id: 'dividend', label: 'Dividend Income', emoji: '💵', desc: 'Regular passive income' },
  { id: 'tax', label: 'Tax Saving', emoji: '📋', desc: 'ELSS and tax-efficient investing' },
  { id: 'education', label: 'Education', emoji: '🎓', desc: 'Children\'s education fund' },
];

const brokers = [
  { id: 'zerodha', name: 'Zerodha', desc: 'Kite Connect API', color: '#387ed1' },
  { id: 'groww', name: 'Groww', desc: 'Direct integration', color: '#5367ff' },
  { id: 'upstox', name: 'Upstox', desc: 'Upstox API v2', color: '#6c3baa' },
  { id: 'angelone', name: 'Angel One', desc: 'SmartAPI', color: '#f26522' },
  { id: 'manual', name: 'Manual Entry', desc: 'Add stocks manually', color: '#71717a' },
];

export default function OnboardingPage({ onComplete }: OnboardingPageProps) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [selectedRisk, setSelectedRisk] = useState('moderate');
  const [selectedGoals, setSelectedGoals] = useState<string[]>(['wealth']);
  const [selectedBroker, setSelectedBroker] = useState('');
  const [loading, setLoading] = useState(false);

  const progress = ((step + 1) / steps.length) * 100;

  const canProceed = () => {
    if (step === 1) return name.trim().length > 0;
    return true;
  };

  const next = async () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      setLoading(true);
      try {
        // Save profile data
        await fetch('/api/user/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            riskAppetite: selectedRisk.toUpperCase(),
            goals: selectedGoals,
            isOnboarded: true
          }),
        });

        // Simulate broker connection to seed database
        if (selectedBroker && selectedBroker !== 'manual') {
          const brokerDetails = brokers.find(b => b.id === selectedBroker);
          await fetch('/api/broker/simulate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ brokerName: brokerDetails?.name || 'Zerodha' }),
          });
        }
        
        onComplete();
      } catch (e) {
        console.error("Failed onboarding", e);
        onComplete(); // Still complete so user isn't stuck
      } finally {
        setLoading(false);
      }
    }
  };

  const prev = () => {
    if (step > 0) setStep(step - 1);
  };

  const toggleGoal = (id: string) => {
    setSelectedGoals((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-[#09090b] flex flex-col">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <div className="h-1 bg-white/5">
          <motion.div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500" animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-8 py-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold gradient-text">ClariFi</span>
        </div>
        <button onClick={onComplete} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
          Skip for now →
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-lg">
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {steps.map((s, i) => (
              <div key={s.id} className={`flex items-center gap-2 ${i <= step ? 'text-foreground' : 'text-muted-foreground/30'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${i < step ? 'bg-indigo-500 text-white' : i === step ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/50' : 'bg-white/5 text-muted-foreground/50'}`}>
                  {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
                </div>
                {i < steps.length - 1 && <div className={`w-8 h-px ${i < step ? 'bg-indigo-500' : 'bg-white/10'}`} />}
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* Step 0: Welcome */}
            {step === 0 && (
              <motion.div key="welcome" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="text-center space-y-6">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center mx-auto">
                  <Zap className="w-10 h-10 text-indigo-400" />
                </div>
                <h2 className="text-3xl font-bold text-foreground">Welcome to ClariFi! 🎉</h2>
                <p className="text-muted-foreground max-w-sm mx-auto">Let&apos;s set up your portfolio in just a few steps. This will help us personalize your experience.</p>
                <div className="grid grid-cols-3 gap-4 pt-4">
                  {[
                    { icon: PieChart, label: 'Track Portfolio' },
                    { icon: TrendingUp, label: 'AI Insights' },
                    { icon: BarChart3, label: 'Tax Reports' },
                  ].map((f) => (
                    <div key={f.label} className="glass-card p-4 text-center">
                      <f.icon className="w-6 h-6 text-indigo-400 mx-auto mb-2" />
                      <span className="text-xs text-muted-foreground">{f.label}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 1: Profile */}
            {step === 1 && (
              <motion.div key="profile" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-foreground">Tell us about yourself</h2>
                  <p className="text-sm text-muted-foreground mt-1">We&apos;ll use this to personalize your dashboard</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">Full Name</label>
                    <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Rahul Sharma" className="input-field py-3" autoFocus />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">Date of Birth (optional)</label>
                    <input type="date" className="input-field py-3" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">PAN Number (optional, for tax)</label>
                    <input placeholder="ABCDE1234F" className="input-field py-3 uppercase" maxLength={10} />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Risk */}
            {step === 2 && (
              <motion.div key="risk" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-foreground">What&apos;s your risk appetite?</h2>
                  <p className="text-sm text-muted-foreground mt-1">This helps us tailor insights and recommendations</p>
                </div>
                <div className="space-y-3">
                  {riskLevels.map((r) => (
                    <button key={r.id} onClick={() => setSelectedRisk(r.id)} className={`w-full p-5 rounded-xl border text-left transition-all ${selectedRisk === r.id ? `bg-gradient-to-r ${r.color} ${r.border}` : 'border-border bg-white/[0.02] hover:bg-white/[0.04]'}`}>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{r.emoji}</span>
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-foreground">{r.label}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{r.desc}</div>
                        </div>
                        {selectedRisk === r.id && <Check className="w-5 h-5 text-indigo-400" />}
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 3: Goals */}
            {step === 3 && (
              <motion.div key="goals" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-foreground">What are your investment goals?</h2>
                  <p className="text-sm text-muted-foreground mt-1">Select one or more goals</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {goals.map((g) => (
                    <button key={g.id} onClick={() => toggleGoal(g.id)} className={`p-4 rounded-xl border text-left transition-all ${selectedGoals.includes(g.id) ? 'border-indigo-500/50 bg-indigo-500/10' : 'border-border bg-white/[0.02] hover:bg-white/[0.04]'}`}>
                      <span className="text-xl">{g.emoji}</span>
                      <div className="text-sm font-medium text-foreground mt-2">{g.label}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{g.desc}</div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 4: Broker */}
            {step === 4 && (
              <motion.div key="broker" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-foreground">Connect your broker</h2>
                  <p className="text-sm text-muted-foreground mt-1">Auto-import your holdings or add manually</p>
                </div>
                <div className="space-y-2">
                  {brokers.map((b) => (
                    <button key={b.id} onClick={() => setSelectedBroker(b.id)} className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${selectedBroker === b.id ? 'border-indigo-500/50 bg-indigo-500/10' : 'border-border bg-white/[0.02] hover:bg-white/[0.04]'}`}>
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold text-white" style={{ background: b.color }}>
                        {b.name.substring(0, 2)}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-foreground">{b.name}</div>
                        <div className="text-xs text-muted-foreground">{b.desc}</div>
                      </div>
                      {selectedBroker === b.id && <Check className="w-5 h-5 text-indigo-400" />}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8">
            <button onClick={prev} className={`btn-secondary text-sm ${step === 0 ? 'invisible' : ''}`}>
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button onClick={next} disabled={!canProceed() || loading} className="btn-primary text-sm disabled:opacity-50">
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : step === steps.length - 1 ? 'Get Started' : 'Continue'} {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
