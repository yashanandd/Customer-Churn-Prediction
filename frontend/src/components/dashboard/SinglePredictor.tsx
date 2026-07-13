import React, { useEffect, useState } from 'react';
import { predictChurn, getPredictionHistory } from '../../services/api';
import { ShieldAlert, RefreshCw, AlertTriangle, ShieldCheck, Clock, UserCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SinglePredictor: React.FC = () => {
  const [formData, setFormData] = useState({
    customerID: '',
    tenure: '12',
    MonthlyCharges: '70',
    TotalCharges: '840',
    Contract: 'Month-to-month',
    InternetService: 'Fiber optic',
    PaymentMethod: 'Electronic check',
    TechSupport: 'No',
    OnlineSecurity: 'No',
    PaperlessBilling: 'Yes'
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      const data = await getPredictionHistory();
      setHistory(data);
    } catch (err) {
      console.error("Failed to fetch prediction history", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      // Auto-calculate TotalCharges if tenure or monthly charges change
      if (name === 'tenure' || name === 'MonthlyCharges') {
        const t = parseFloat(updated.tenure) || 0;
        const m = parseFloat(updated.MonthlyCharges) || 0;
        updated.TotalCharges = (t * m).toFixed(2);
      }
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    // Cast numeric fields and package features
    const features = {
      ...formData,
      customerID: formData.customerID.trim() || 'SIM-CUST',
      tenure: parseInt(formData.tenure) || 0,
      MonthlyCharges: parseFloat(formData.MonthlyCharges) || 0.0,
      TotalCharges: parseFloat(formData.TotalCharges) || 0.0
    };

    try {
      const res = await predictChurn(features);
      setResult(res);
      // Reload history ledger
      fetchHistory();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || "Prediction request failed. Make sure the model is trained.");
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Individual Retention Predictor</h2>
        <p className="text-gray-400 text-sm">Simulate subscriber variables to estimate single account churn probabilities.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Input Form Column */}
        <div className="lg:col-span-7 glass-card p-6">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-primary" />
            Subscriber Parameters
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Subscriber Ref ID (Optional)</label>
                <input
                  type="text"
                  name="customerID"
                  className="form-input"
                  placeholder="e.g. CUST-9921"
                  value={formData.customerID}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="form-label">Contract Plan</label>
                <select
                  name="Contract"
                  className="form-input bg-background"
                  value={formData.Contract}
                  onChange={handleChange}
                >
                  <option value="Month-to-month">Month-to-month</option>
                  <option value="One year">One year</option>
                  <option value="Two year">Two year</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Tenure (Months)</label>
                <input
                  type="number"
                  name="tenure"
                  min="0"
                  max="120"
                  className="form-input"
                  value={formData.tenure}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="form-label">Monthly Billing Rate ($)</label>
                <input
                  type="number"
                  name="MonthlyCharges"
                  min="0"
                  step="0.01"
                  className="form-input"
                  value={formData.MonthlyCharges}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Calculated Total Billing ($)</label>
                <input
                  type="number"
                  name="TotalCharges"
                  readOnly
                  disabled
                  className="form-input opacity-60 cursor-not-allowed"
                  value={formData.TotalCharges}
                />
              </div>

              <div>
                <label className="form-label">Internet Service Provider</label>
                <select
                  name="InternetService"
                  className="form-input bg-background"
                  value={formData.InternetService}
                  onChange={handleChange}
                >
                  <option value="DSL">DSL</option>
                  <option value="Fiber optic">Fiber optic</option>
                  <option value="No">None (No Internet)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Billing Type</label>
                <select
                  name="PaperlessBilling"
                  className="form-input bg-background"
                  value={formData.PaperlessBilling}
                  onChange={handleChange}
                >
                  <option value="Yes">Paperless (Yes)</option>
                  <option value="No">Traditional Mail (No)</option>
                </select>
              </div>

              <div>
                <label className="form-label">Payment Gateway</label>
                <select
                  name="PaymentMethod"
                  className="form-input bg-background"
                  value={formData.PaymentMethod}
                  onChange={handleChange}
                >
                  <option value="Electronic check">Electronic Check</option>
                  <option value="Mailed check">Mailed Check</option>
                  <option value="Bank transfer (automatic)">Bank Transfer (Automatic)</option>
                  <option value="Credit card (automatic)">Credit Card (Automatic)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Online Security Add-on</label>
                <select
                  name="OnlineSecurity"
                  className="form-input bg-background"
                  value={formData.OnlineSecurity}
                  onChange={handleChange}
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>

              <div>
                <label className="form-label">Tech Support Add-on</label>
                <select
                  name="TechSupport"
                  className="form-input bg-background"
                  value={formData.TechSupport}
                  onChange={handleChange}
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-danger/10 border border-danger/20 text-danger text-sm rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                "Calculate Churn Probability"
              )}
            </button>
          </form>
        </div>

        {/* Prediction Output & Ledger Column */}
        <div className="lg:col-span-5 space-y-6">
          <AnimatePresence mode="wait">
            {!result ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="glass-card p-8 flex flex-col items-center justify-center text-center min-h-[250px] border-dashed border-white/10"
              >
                <ShieldAlert className="w-12 h-12 text-gray-500 mb-4 animate-pulse" />
                <h4 className="text-white font-semibold mb-2">No Active Forecast</h4>
                <p className="text-gray-400 text-sm max-w-xs">
                  Fill in the subscriber parameters and click calculate to generate risk segments and retention actions.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {/* Verdict Card */}
                <div className="glass-card p-6 relative overflow-hidden">
                  <div className={`absolute -right-8 -top-8 w-24 h-24 bg-gradient-to-br ${
                    result.risk_segment === 'High' ? 'from-danger' : result.risk_segment === 'Medium' ? 'from-warning' : 'from-secondary'
                  } to-transparent opacity-10 blur-2xl rounded-full`} />

                  <h3 className="text-md font-semibold text-gray-400 mb-4 uppercase tracking-wider">Churn Risk Verdict</h3>
                  
                  <div className="flex flex-col items-center py-2">
                    {/* Ring indicator */}
                    <div className="relative w-32 h-32 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle
                          cx="64"
                          cy="64"
                          r="52"
                          className="stroke-white/5"
                          strokeWidth="8"
                          fill="transparent"
                        />
                        <circle
                          cx="64"
                          cy="64"
                          r="52"
                          className={
                            result.risk_segment === 'High' ? 'stroke-danger' : result.risk_segment === 'Medium' ? 'stroke-warning' : 'stroke-secondary'
                          }
                          strokeWidth="8"
                          fill="transparent"
                          strokeDasharray={2 * Math.PI * 52}
                          strokeDashoffset={2 * Math.PI * 52 * (1 - result.probability)}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center">
                        <span className="text-2xl font-extrabold text-white">
                          {Math.round(result.probability * 100)}%
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium">Probability</span>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-col items-center">
                      <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-bold ${
                        result.risk_segment === 'High' 
                          ? 'bg-danger/10 text-danger border border-danger/20' 
                          : result.risk_segment === 'Medium' 
                            ? 'bg-warning/10 text-warning border border-warning/20' 
                            : 'bg-secondary/10 text-secondary border border-secondary/20'
                      }`}>
                        {result.risk_segment === 'High' ? (
                          <AlertTriangle className="w-4 h-4" />
                        ) : (
                          <ShieldCheck className="w-4 h-4" />
                        )}
                        {result.risk_segment} Risk
                      </span>
                    </div>
                  </div>
                </div>

                {/* AI Advice Card */}
                <div className="glass-card p-6 space-y-4">
                  <h4 className="text-white font-bold">AI Prescriptive Assessment</h4>
                  <div className="p-3 bg-white/5 border border-white/5 rounded-xl text-sm text-gray-300">
                    <p className="font-semibold text-white mb-1 text-xs">Reasoning Details:</p>
                    <p className="text-xs text-gray-400 leading-relaxed">{result.explanation}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* History Ledger Card */}
          <div className="glass-card p-5 space-y-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              Recent Simulations History
            </h4>

            {historyLoading ? (
              <div className="flex items-center justify-center py-6 text-xs text-gray-500">
                <RefreshCw className="w-4 h-4 animate-spin text-gray-500 mr-2" />
                Loading ledger...
              </div>
            ) : history.length === 0 ? (
              <div className="text-xs text-gray-500 py-6 text-center">
                No simulations run yet.
              </div>
            ) : (
              <div className="space-y-2">
                {history.map((record) => (
                  <div 
                    key={record.id} 
                    className="p-3 bg-white/3 border border-white/5 rounded-xl flex items-center justify-between text-xs hover:bg-white/5 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-gray-400" />
                        <span className="font-mono font-bold text-white">{record.customer_id}</span>
                      </div>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        Time: {formatTimestamp(record.timestamp)}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-white">
                        {Math.round(record.probability * 100)}%
                      </span>
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        record.risk_segment === 'High' 
                          ? 'bg-danger/10 text-danger' 
                          : record.risk_segment === 'Medium' 
                            ? 'bg-warning/10 text-warning' 
                            : 'bg-secondary/10 text-secondary'
                      }`}>
                        {record.risk_segment}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SinglePredictor;
