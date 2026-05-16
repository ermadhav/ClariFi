'use client';
import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Mail, Phone, Chrome, Apple, ArrowRight, Shield, Eye, EyeOff, Fingerprint } from 'lucide-react';

interface LoginPageProps {
  onLogin: () => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [method, setMethod] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [showOtp, setShowOtp] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSendOtp = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setShowOtp(true);
    }, 1500);
  };

  const handleVerifyOtp = async () => {
    setLoading(true);
    try {
      const res = await signIn('otp-login', {
        identifier: method === 'email' ? email : phone,
        otp: otp.join(''),
        redirect: false,
      });
      if (res?.ok) {
        onLogin();
      } else {
        alert('Invalid OTP');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      const next = document.getElementById(`otp-${index + 1}`);
      next?.focus();
    }
    if (newOtp.every((d) => d !== '')) {
      setTimeout(handleVerifyOtp, 300);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left - Branding */}
      <div className="hidden lg:flex flex-1 flex-col justify-between p-12 bg-gradient-to-br from-indigo-950 via-[#0a0a1a] to-purple-950 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-[100px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border border-indigo-500/5 rounded-full" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] border border-indigo-500/3 rounded-full" />
        </div>

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-bold gradient-text">ClariFi</span>
        </div>

        {/* Feature highlights */}
        <div className="relative z-10 space-y-8">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-4xl font-bold text-white leading-tight">
            Your Complete<br />
            <span className="gradient-text">Portfolio Tracker</span><br />
            for Indian Markets
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-lg text-white/50 max-w-md">
            Track stocks, mutual funds, dividends, and capital gains with AI-powered insights. Built for Indian retail investors.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex flex-col gap-3">
            {[
              'Real-time NSE/BSE portfolio tracking',
              'AI-powered stock insights & predictions',
              'Automated tax loss harvesting',
              'Multi-broker integration (Zerodha, Groww, Upstox)',
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 text-white/70 text-sm">
                <div className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                </div>
                {feature}
              </div>
            ))}
          </motion.div>
        </div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="relative z-10 flex gap-8">
          {[
            { value: '50K+', label: 'Active Users' },
            { value: '₹2,500Cr+', label: 'Portfolio Tracked' },
            { value: '4.8★', label: 'App Rating' },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="text-xl font-bold text-white">{stat.value}</div>
              <div className="text-xs text-white/40">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Right - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[#09090b]">
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold gradient-text">ClariFi</span>
          </div>

          {/* Heading */}
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              {mode === 'login' ? 'Welcome back' : 'Create your account'}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {mode === 'login' ? 'Sign in to access your portfolio' : 'Start tracking your investments today'}
            </p>
          </div>

          {/* OAuth Buttons */}
          <div className="space-y-3">
            <button onClick={onLogin} className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-border bg-white/[0.03] hover:bg-white/[0.06] transition-all text-sm font-medium text-foreground">
              <Chrome className="w-4 h-4" /> Continue with Google
            </button>
            <button onClick={onLogin} className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-border bg-white/[0.03] hover:bg-white/[0.06] transition-all text-sm font-medium text-foreground">
              <Apple className="w-4 h-4" /> Continue with Apple
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">or continue with</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Method Toggle */}
          <div className="flex gap-1 bg-white/5 rounded-lg p-0.5">
            <button onClick={() => { setMethod('email'); setShowOtp(false); }} className={`tab-button flex-1 flex items-center justify-center gap-2 ${method === 'email' ? 'active' : ''}`}>
              <Mail className="w-3.5 h-3.5" /> Email
            </button>
            <button onClick={() => { setMethod('phone'); setShowOtp(false); }} className={`tab-button flex-1 flex items-center justify-center gap-2 ${method === 'phone' ? 'active' : ''}`}>
              <Phone className="w-3.5 h-3.5" /> Phone
            </button>
          </div>

          <AnimatePresence mode="wait">
            {!showOtp ? (
              <motion.div key="input" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                {method === 'email' ? (
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">Email Address</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="input-field py-3" />
                  </div>
                ) : (
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">Phone Number</label>
                    <div className="flex gap-2">
                      <div className="input-field py-3 w-16 text-center text-sm">+91</div>
                      <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="98765 43210" className="input-field py-3 flex-1" />
                    </div>
                  </div>
                )}
                <button onClick={handleSendOtp} disabled={loading} className="btn-primary w-full py-3 disabled:opacity-50">
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>Send OTP <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </motion.div>
            ) : (
              <motion.div key="otp" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-3 block">Enter the 6-digit code sent to {method === 'email' ? email : `+91 ${phone}`}</label>
                  <div className="flex gap-2 justify-center">
                    {otp.map((digit, i) => (
                      <input key={i} id={`otp-${i}`} type="text" inputMode="numeric" maxLength={1} value={digit} onChange={(e) => handleOtpChange(i, e.target.value)}
                        className="w-12 h-14 text-center text-lg font-bold rounded-xl border border-border bg-white/[0.03] text-foreground outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                      />
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <button onClick={() => setShowOtp(false)} className="text-muted-foreground hover:text-foreground transition-colors">← Change {method}</button>
                  <button className="text-indigo-400 hover:text-indigo-300 transition-colors">Resend OTP</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Toggle mode */}
          <p className="text-center text-sm text-muted-foreground">
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} className="text-indigo-400 font-medium hover:text-indigo-300 transition-colors">
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>

          {/* Security note */}
          <div className="flex items-center gap-2 justify-center text-[10px] text-muted-foreground/50">
            <Shield className="w-3 h-3" />
            Secured with 256-bit encryption. Your data is safe with us.
          </div>
        </motion.div>
      </div>
    </div>
  );
}
