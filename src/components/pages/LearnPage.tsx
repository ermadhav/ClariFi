'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Play, Award, HelpCircle, FileText, TrendingUp, Calculator, Shield } from 'lucide-react';

const articles = [
  { title: 'What is the Stock Market?', desc: 'A beginner\'s guide to how stock markets work in India', icon: TrendingUp, category: 'Basics', time: '5 min' },
  { title: 'How to Read Financial Statements', desc: 'Understanding balance sheets, P&L, and cash flow statements', icon: FileText, category: 'Fundamentals', time: '8 min' },
  { title: 'Understanding P/E, P/B & ROE', desc: 'Key financial ratios every investor should know', icon: Calculator, category: 'Ratios', time: '6 min' },
  { title: 'Guide to Diversification', desc: 'Why you shouldn\'t put all eggs in one basket', icon: Shield, category: 'Strategy', time: '4 min' },
  { title: 'How to Do Tax Loss Harvesting', desc: 'Save taxes legally by strategically booking losses', icon: Calculator, category: 'Tax', time: '7 min' },
  { title: 'Reading Quarterly Results', desc: 'What to look for in quarterly earnings reports', icon: FileText, category: 'Fundamentals', time: '6 min' },
];

const glossary = [
  { term: 'XIRR', def: 'Extended Internal Rate of Return - measures annualized returns accounting for irregular cash flows' },
  { term: 'CAGR', def: 'Compound Annual Growth Rate - average annual growth rate of an investment over time' },
  { term: 'P/E Ratio', def: 'Price-to-Earnings ratio - stock price divided by earnings per share, shows valuation' },
  { term: 'Beta', def: 'Measure of stock\'s volatility relative to the market. Beta > 1 = more volatile' },
  { term: 'EBITDA', def: 'Earnings Before Interest, Taxes, Depreciation & Amortization - operating profitability measure' },
  { term: 'Market Cap', def: 'Total market value of a company = Share Price × Total Shares Outstanding' },
  { term: 'Dividend Yield', def: 'Annual dividend per share ÷ stock price, expressed as percentage' },
  { term: 'STCG', def: 'Short Term Capital Gains - gains from selling stocks held less than 1 year, taxed at 20%' },
  { term: 'LTCG', def: 'Long Term Capital Gains - gains from selling stocks held over 1 year, taxed at 12.5% above ₹1.25L' },
];

export default function LearnPage() {
  return (
    <div className="space-y-8 animate-in">
      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center mx-auto mb-4">
          <BookOpen className="w-8 h-8 text-indigo-400" />
        </div>
        <h2 className="text-2xl font-bold gradient-text mb-2">Learn Investing</h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">Master the fundamentals of stock market investing with our curated guides and glossary.</p>
      </motion.div>

      {/* Articles */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-4">Investment Guides</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {articles.map((a, i) => (
            <motion.div key={a.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card glass-card-hover p-5 cursor-pointer group">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                  <a.icon className="w-5 h-5 text-indigo-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="badge badge-info">{a.category}</span>
                    <span className="text-[10px] text-muted-foreground">{a.time} read</span>
                  </div>
                  <h4 className="text-sm font-medium text-foreground group-hover:text-indigo-400 transition-colors">{a.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{a.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Glossary */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-4">Financial Glossary</h3>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card overflow-hidden">
          <div className="divide-y divide-border/50">
            {glossary.map((g) => (
              <div key={g.term} className="flex items-start gap-4 p-4 hover:bg-white/[0.02] transition-colors">
                <span className="text-sm font-semibold text-indigo-400 min-w-[100px]">{g.term}</span>
                <span className="text-sm text-muted-foreground">{g.def}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
