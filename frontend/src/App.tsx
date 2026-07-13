import { useState, useEffect } from 'react';
import Sidebar from './components/layout/Sidebar';
import DragDropUpload from './components/upload/DragDropUpload';
import HistoryList from './components/upload/HistoryList';
import KPICards from './components/dashboard/KPICards';
import ChurnCharts from './components/dashboard/ChurnCharts';
import AIInsights from './components/insights/AIInsights';
import CustomerList from './components/dashboard/CustomerList';
import AnalyticsDeepDive from './components/dashboard/AnalyticsDeepDive';
import SinglePredictor from './components/dashboard/SinglePredictor';
import AuthPage from './components/auth/AuthPage';
import ChangePasswordModal from './components/auth/ChangePasswordModal';
import { getKPIs, getTrends, getDepartmentChurn, getInsights, getModelMetrics } from './services/api';
import { RefreshCw, Activity, User as UserIcon, LogOut } from 'lucide-react';

function App() {
  // Authentication state
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<any | null>(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  // Layout navigation states
  const [activeDataset, setActiveDataset] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [refreshHistory, setRefreshHistory] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  // Analysis data states
  const [kpiData, setKpiData] = useState<any>(null);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [deptData, setDeptData] = useState<any[]>([]);
  const [insights, setInsights] = useState<any>(null);
  const [modelMetrics, setModelMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleAuthSuccess = (newToken: string, newUser: any) => {
    setToken(newToken);
    setUser(newUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setActiveDataset(null);
  };

  const fetchData = async () => {
    if (!activeDataset) return;
    setLoading(true);
    try {
      const [kpiRes, trendRes, deptRes, insightsRes, metricsRes] = await Promise.all([
        getKPIs(),
        getTrends(),
        getDepartmentChurn(),
        getInsights(),
        getModelMetrics()
      ]);
      setKpiData(kpiRes);
      setTrendData(trendRes);
      setDeptData(deptRes);
      setInsights(insightsRes);
      setModelMetrics(metricsRes);
    } catch (error) {
      console.error("Error fetching analysis data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && activeDataset) {
      fetchData();
    }
  }, [activeDataset, token]);

  // View: Unauthenticated
  if (!token) {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />;
  }

  // View: Authenticated but no dataset active (Main landing page with Upload + History)
  if (!activeDataset) {
    return (
      <div className="min-h-screen bg-background text-gray-100 flex flex-col font-sans">
        {/* Simple topbar header */}
        <header className="bg-surface border-b border-white/5 px-8 py-4 flex justify-between items-center z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-purple-500 flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              ChurnAI
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-white/3 border border-white/5 px-4 py-1.5 rounded-xl text-sm font-semibold">
              <UserIcon className="w-4 h-4 text-primary" />
              <span>{user?.username}</span>
            </div>
            <button 
              onClick={handleLogout}
              className="text-gray-400 hover:text-danger hover:bg-danger/10 p-2 rounded-xl transition-all"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Start page main workspace layout */}
        <main className="flex-1 max-w-6xl w-full mx-auto p-8 overflow-y-auto space-y-12">
          {/* Grid for Upload widget and History side-by-side */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7">
              <DragDropUpload 
                onUploadSuccess={(filename) => {
                  setRefreshHistory(r => !r);
                  setActiveDataset(filename);
                  setActiveTab('dashboard');
                }} 
              />
            </div>
            <div className="lg:col-span-5">
              <HistoryList 
                onSelectHistory={(filename) => {
                  setActiveDataset(filename);
                  setActiveTab('dashboard');
                }}
                refreshTrigger={refreshHistory}
              />
            </div>
          </div>
        </main>
      </div>
    );
  }

  // View: Dataset Active (Sidebar analysis dashboard layout)
  const renderActiveTabContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[70vh]">
          <RefreshCw className="w-10 h-10 animate-spin text-primary mb-3" />
          <p className="text-gray-400 text-sm">Processing subscriber features...</p>
        </div>
      );
    }

    if (!kpiData) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[75vh] text-center">
          <p className="text-danger font-semibold mb-2">Failed to load dataset metrics.</p>
          <button onClick={fetchData} className="btn-primary flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      );
    }

    switch (activeTab) {
      case 'analytics':
        return <AnalyticsDeepDive />;
      case 'customers':
        return <CustomerList />;
      case 'predictor':
        return <SinglePredictor />;
      case 'insights':
        return insights ? (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">AI Recommendation Playbooks</h2>
              <p className="text-gray-400 text-sm">Explore targeted retention strategies powered by churn indicator analysis.</p>
            </div>
            <AIInsights insights={insights} />
          </div>
        ) : null;
      case 'dashboard':
      default:
        return (
          <div className="space-y-6 pb-12">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-3xl font-extrabold text-white tracking-tight mb-1">Dashboard Overview</h1>
                <p className="text-gray-400 text-sm">Active Dataset: <span className="text-primary font-bold">{activeDataset}</span></p>
              </div>
              <button onClick={fetchData} className="btn-secondary flex items-center gap-2 text-xs font-semibold py-2">
                <RefreshCw className="w-4 h-4" /> Refresh
              </button>
            </div>

            {modelMetrics && modelMetrics.accuracy > 0 && (
              <div className="glass-card p-4 flex flex-wrap items-center justify-between gap-4 border-l-4 border-l-primary">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Activity className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm">Active AI Model Performance</h4>
                    <p className="text-gray-400 text-xs mt-0.5">Algorithm: <span className="font-semibold text-gray-300">{modelMetrics.model_type === 'lr' ? 'Logistic Regression' : 'Random Forest Classifier'}</span></p>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  {[
                    { label: "Accuracy", val: (modelMetrics.accuracy * 100).toFixed(1) + "%" },
                    { label: "Precision", val: (modelMetrics.precision * 100).toFixed(1) + "%" },
                    { label: "Recall", val: (modelMetrics.recall * 100).toFixed(1) + "%" },
                    { label: "F1 Score", val: (modelMetrics.f1_score * 100).toFixed(1) + "%" }
                  ].map(m => (
                    <div key={m.label} className="text-center">
                      <p className="text-gray-500 text-[10px] uppercase font-bold tracking-wider">{m.label}</p>
                      <p className="text-sm font-bold text-white mt-0.5">{m.val}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <KPICards data={kpiData} />
            <ChurnCharts trendData={trendData} deptData={deptData} />
          </div>
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-background text-gray-100 font-sans">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onBackToUploads={() => setActiveDataset(null)}
        onLogout={handleLogout}
        onChangePasswordOpen={() => setIsChangePasswordOpen(true)}
        user={user}
      />
      
      <main className="flex-1 ml-64 p-8 overflow-y-auto min-h-screen">
        {renderActiveTabContent()}
      </main>

      <ChangePasswordModal 
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />
    </div>
  );
}

export default App;
