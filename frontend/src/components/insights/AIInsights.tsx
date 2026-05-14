import React from 'react';
import { Lightbulb, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface AIInsightsProps {
  insights: {
    reasons: string[];
    strategies: string[];
  };
}

const AIInsights: React.FC<AIInsightsProps> = ({ insights }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-card p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-danger/20 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-danger" />
          </div>
          <h3 className="text-xl font-semibold text-white">Top Churn Drivers</h3>
        </div>
        
        <div className="space-y-4">
          {insights.reasons.map((reason, idx) => (
            <div key={idx} className="flex gap-3 bg-surface p-4 rounded-xl border border-white/5">
              <span className="text-danger font-bold">{idx + 1}.</span>
              <p className="text-gray-300">{reason}</p>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5 }}
        className="glass-card p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center">
            <Lightbulb className="w-5 h-5 text-secondary" />
          </div>
          <h3 className="text-xl font-semibold text-white">Recommended Strategies</h3>
        </div>
        
        <div className="space-y-4">
          {insights.strategies.map((strategy, idx) => (
            <div key={idx} className="flex gap-3 bg-surface p-4 rounded-xl border border-white/5">
              <CheckCircle2 className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
              <p className="text-gray-300">{strategy}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default AIInsights;
