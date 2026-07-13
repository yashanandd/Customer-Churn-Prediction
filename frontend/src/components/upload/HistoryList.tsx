import React, { useEffect, useState } from 'react';
import { getUploadHistory, selectActiveDataset } from '../../services/api';
import { Calendar, FileSpreadsheet, Eye, RefreshCw, Layers } from 'lucide-react';
import { motion } from 'framer-motion';

interface HistoryListProps {
  onSelectHistory: (filename: string) => void;
  refreshTrigger: boolean;
}

const HistoryList: React.FC<HistoryListProps> = ({ onSelectHistory, refreshTrigger }) => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activatingId, setActivatingId] = useState<number | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await getUploadHistory();
      setHistory(data);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError("Failed to fetch upload history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [refreshTrigger]);

  const handleSelect = async (id: number, filename: string) => {
    setActivatingId(id);
    try {
      await selectActiveDataset(id);
      onSelectHistory(filename);
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to activate this dataset.");
    } finally {
      setActivatingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-surface/30 border border-white/5 rounded-xl min-h-[200px]">
        <RefreshCw className="w-8 h-8 animate-spin text-primary mb-2" />
        <p className="text-gray-400 text-sm">Loading history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-danger/10 border border-danger/20 rounded-xl text-danger text-sm text-center">
        {error}
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-surface/20 border border-white/5 border-dashed rounded-2xl text-center">
        <FileSpreadsheet className="w-12 h-12 text-gray-500 mb-4" />
        <h4 className="text-white font-semibold mb-1">No Uploads Yet</h4>
        <p className="text-gray-400 text-sm max-w-xs">
          Your upload history will appear here once you upload your first CSV dataset.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Layers className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-bold text-white">Upload History</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {history.map((record, idx) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            key={record.id}
            className="glass-card p-5 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    <FileSpreadsheet className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-white font-semibold truncate text-sm" title={record.filename}>
                      {record.filename}
                    </h4>
                    <p className="text-gray-400 text-xs mt-0.5">
                      {record.row_count.toLocaleString()} customers
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-gray-400 text-xs mb-4">
                <Calendar className="w-3.5 h-3.5" />
                <span>{formatDate(record.timestamp)}</span>
              </div>
            </div>

            <button
              onClick={() => handleSelect(record.id, record.filename)}
              disabled={activatingId !== null}
              className="btn-secondary w-full py-2 flex items-center justify-center gap-2 text-xs font-semibold"
            >
              {activatingId === record.id ? (
                <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Eye className="w-4 h-4" />
                  Analyze Dataset
                </>
              )}
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default HistoryList;
