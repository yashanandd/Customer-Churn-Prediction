import React from 'react';
import { Users, TrendingDown, DollarSign, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

interface KPICardsProps {
  data: {
    total_customers: number;
    churn_rate: number;
    revenue_impact: number;
    retention_rate: number;
  };
}

const KPICards: React.FC<KPICardsProps> = ({ data }) => {
  const cards = [
    {
      title: "Total Customers",
      value: data.total_customers.toLocaleString(),
      icon: Users,
      color: "from-blue-500 to-cyan-400",
      trend: "+12% this month"
    },
    {
      title: "Churn Rate",
      value: `${data.churn_rate}%`,
      icon: TrendingDown,
      color: "from-danger to-pink-500",
      trend: "-2.1% from last month"
    },
    {
      title: "Revenue Impact",
      value: `$${data.revenue_impact.toLocaleString()}`,
      icon: DollarSign,
      color: "from-warning to-orange-500",
      trend: "+5.4% this quarter"
    },
    {
      title: "Retention Rate",
      value: `${data.retention_rate}%`,
      icon: Activity,
      color: "from-secondary to-emerald-400",
      trend: "Steady"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            key={card.title}
            className="glass-card p-6 relative overflow-hidden group"
          >
            {/* Glow effect */}
            <div className={`absolute -right-8 -top-8 w-32 h-32 bg-gradient-to-br ${card.color} opacity-10 blur-3xl rounded-full group-hover:opacity-20 transition-opacity duration-500`} />
            
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-gray-400 text-sm font-medium mb-1">{card.title}</p>
                <h3 className="text-3xl font-bold text-white">{card.value}</h3>
              </div>
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} p-[1px]`}>
                <div className="w-full h-full bg-surface rounded-xl flex items-center justify-center">
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            
            <p className="text-sm text-gray-500 font-medium">
              {card.trend}
            </p>
          </motion.div>
        );
      })}
    </div>
  );
};

export default KPICards;
