import { useState, useEffect } from 'react';
import Layout from './components/layout/Layout';
import DragDropUpload from './components/upload/DragDropUpload';
import KPICards from './components/dashboard/KPICards';
import ChurnCharts from './components/dashboard/ChurnCharts';
import AIInsights from './components/insights/AIInsights';
import { getKPIs, getTrends, getDepartmentChurn, getInsights } from './services/api';
import { RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [kpiData, setKpiData] = useState<any>(null);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [deptData, setDeptData] = useState<any[]>([]);
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [kpiRes, trendRes, deptRes, insightsRes] = await Promise.all([
        getKPIs(),
        getTrends(),
        getDepartmentChurn(),
        getInsights()
      ]);
      setKpiData(kpiRes);
      setTrendData(trendRes);
      setDeptData(deptRes);
      setInsights(insightsRes);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const renderContent = () => {
    if (activeTab === 'upload') {
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 flex items-center justify-center min-h-[80vh]"
        >
          <DragDropUpload onUploadSuccess={() => {
            fetchData();
            setActiveTab('dashboard');
          }} />
        </motion.div>
      );
    }

    if (loading || !kpiData) {
      return (
        <div className="flex items-center justify-center min-h-[80vh]">
          <RefreshCw className="w-10 h-10 animate-spin text-primary" />
        </div>
      );
    }

    if (kpiData.total_customers === 0) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] text-center space-y-4">
          <div className="w-20 h-20 bg-surface rounded-full flex items-center justify-center border border-white/10 mb-4">
            <RefreshCw className="w-10 h-10 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold">No Data Available</h2>
          <p className="text-gray-400 max-w-md">
            Please upload a customer dataset to train the model and generate insights.
          </p>
          <button 
            onClick={() => setActiveTab('upload')}
            className="btn-primary mt-4"
          >
            Go to Upload
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-6 pb-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Dashboard Overview</h1>
            <p className="text-gray-400">Welcome back. Here is the latest customer churn data.</p>
          </div>
          <button onClick={fetchData} className="btn-secondary flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        <KPICards data={kpiData} />
        <ChurnCharts trendData={trendData} deptData={deptData} />
        
        {insights && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-white mb-4">AI Recommendations</h2>
            <AIInsights insights={insights} />
          </div>
        )}
      </div>
    );
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}
    </Layout>
  );
}

export default App;
