import React, { useEffect, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import { getDepartmentChurn, getKPIs } from '../../services/api';
import { RefreshCw, BarChart2, PieChart as PieIcon, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

const AnalyticsDeepDive: React.FC = () => {
  const [deptData, setDeptData] = useState<any[]>([]);
  const [kpis, setKpis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [deptRes, kpisRes] = await Promise.all([
        getDepartmentChurn(),
        getKPIs()
      ]);
      setDeptData(deptRes);
      setKpis(kpisRes);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError("Failed to fetch detailed analytics data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6'];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-surface border border-white/10 p-3 rounded-lg shadow-xl font-sans">
          <p className="text-white font-semibold text-xs mb-1.5">{label || payload[0].name}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color || entry.fill }} className="text-sm font-medium">
              {entry.name}: {entry.value.toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 min-h-[400px]">
        <RefreshCw className="w-10 h-10 animate-spin text-primary mb-3" />
        <p className="text-gray-400 text-sm">Aggregating dataset metrics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 bg-danger/10 border border-danger/20 rounded-2xl text-danger text-center">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Deep-Dive Statistical Analysis</h2>
        <p className="text-gray-400 text-sm">Review demographic and billing distribution metrics for active segments.</p>
      </div>

      {/* KPI mini-cards row */}
      {kpis && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: "Active Subscribers", value: (kpis.total_customers * (kpis.retention_rate / 100)).toFixed(0), desc: "Healthy customer base" },
            { label: "Lost Customers", value: (kpis.total_customers * (kpis.churn_rate / 100)).toFixed(0), desc: "Churned accounts" },
            { label: "Revenue Leakage", value: `$${kpis.revenue_impact.toLocaleString()}`, desc: "Impact from cancellations" }
          ].map((item, idx) => (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              key={item.label}
              className="glass-card p-5"
            >
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">{item.label}</p>
              <h3 className="text-3xl font-extrabold text-white mb-1">{parseInt(item.value) ? parseInt(item.value).toLocaleString() : item.value}</h3>
              <p className="text-gray-500 text-xs font-medium">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Segment Churn Counts */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-6"
        >
          <div className="flex items-center gap-2 mb-6">
            <BarChart2 className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-bold text-white">Segment-wise Churn Breakdown</h3>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="department" stroke="rgba(255,255,255,0.4)" tickLine={false} style={{ fontSize: 11 }} />
                <YAxis stroke="rgba(255,255,255,0.4)" tickLine={false} style={{ fontSize: 11 }} />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.02)' }} content={<CustomTooltip />} />
                <Bar dataKey="churn" name="Churned Users" fill="#4F46E5" radius={[6, 6, 0, 0]}>
                  {deptData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Segment Pie Proportion */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
          className="glass-card p-6"
        >
          <div className="flex items-center gap-2 mb-6">
            <PieIcon className="w-5 h-5 text-secondary" />
            <h3 className="text-lg font-bold text-white">Churn Share Distribution</h3>
          </div>
          
          <div className="h-[300px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={deptData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="churn"
                  nameKey="department"
                >
                  {deptData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  iconType="circle"
                  formatter={(value) => <span className="text-xs text-gray-300 font-semibold">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AnalyticsDeepDive;
