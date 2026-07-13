import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, File, CheckCircle, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { uploadDataset, trainModel } from '../../services/api';

interface DragDropUploadProps {
  onUploadSuccess: (filename: string) => void;
}

const DragDropUpload: React.FC<DragDropUploadProps> = ({ onUploadSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isTraining, setIsTraining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<any>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setError(null);
      setSuccessMsg(null);
      setMetrics(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
    },
    maxFiles: 1,
  });

  const handleUploadAndTrain = async () => {
    if (!file) return;

    try {
      setIsUploading(true);
      setError(null);
      
      // Upload
      await uploadDataset(file);
      setSuccessMsg("Dataset uploaded successfully!");
      
      // Train
      setIsUploading(false);
      setIsTraining(true);
      const result = await trainModel('rf'); // Default Random Forest
      setMetrics(result);
      setSuccessMsg("Model trained successfully!");
      onUploadSuccess(file.name);
      
    } catch (err: any) {
      setError(err.response?.data?.detail || "An error occurred");
    } finally {
      setIsUploading(false);
      setIsTraining(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      <div className="text-center space-y-2 mb-8">
        <h2 className="text-3xl font-bold">Upload Customer Dataset</h2>
        <p className="text-gray-400">Upload your CSV file to train the AI churn prediction model.</p>
      </div>

      <div
        {...getRootProps()}
        className={`glass-card p-12 border-2 border-dashed transition-all duration-300 cursor-pointer flex flex-col items-center justify-center min-h-[300px] relative overflow-hidden group
          ${isDragActive ? 'border-primary bg-primary/5' : 'border-white/20 hover:border-primary/50'}`}
      >
        <input {...getInputProps()} />
        
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <div className="relative z-10 flex flex-col items-center">
          <motion.div
            animate={{ y: isDragActive ? -10 : 0 }}
            className="w-20 h-20 mb-6 rounded-full bg-surface border border-white/10 flex items-center justify-center shadow-2xl"
          >
            <UploadCloud className={`w-10 h-10 ${isDragActive ? 'text-primary' : 'text-gray-400'}`} />
          </motion.div>
          
          <h3 className="text-xl font-semibold mb-2">
            {isDragActive ? 'Drop your CSV here' : 'Drag & Drop your CSV file here'}
          </h3>
          <p className="text-gray-400 mb-6">or click to browse from your computer</p>
          
          {file && (
            <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-lg border border-white/10">
              <File className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">{file.name}</span>
            </div>
          )}
        </div>
      </div>

      {successMsg && !metrics && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3 text-emerald-500">
          <CheckCircle className="w-5 h-5" />
          <p>{successMsg}</p>
        </motion.div>
      )}

      {error && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-danger/10 border border-danger/20 rounded-xl flex items-center gap-3 text-danger">
          <AlertCircle className="w-5 h-5" />
          <p>{error}</p>
        </motion.div>
      )}

      {metrics && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-6 glass-card border-secondary/20">
          <div className="flex items-center gap-3 text-secondary mb-4">
            <CheckCircle className="w-6 h-6" />
            <h3 className="text-lg font-semibold">Training Complete</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Accuracy", val: (metrics.accuracy * 100).toFixed(1) + "%" },
              { label: "Precision", val: (metrics.precision * 100).toFixed(1) + "%" },
              { label: "Recall", val: (metrics.recall * 100).toFixed(1) + "%" },
              { label: "F1 Score", val: (metrics.f1_score * 100).toFixed(1) + "%" }
            ].map(m => (
              <div key={m.label} className="bg-surface p-4 rounded-xl border border-white/5 text-center">
                <p className="text-gray-400 text-sm mb-1">{m.label}</p>
                <p className="text-2xl font-bold text-white">{m.val}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <div className="flex justify-end">
        <button
          onClick={handleUploadAndTrain}
          disabled={!file || isUploading || isTraining}
          className={`btn-primary px-8 py-3 flex items-center gap-2 ${(!file || isUploading || isTraining) ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isUploading ? (
            <span className="flex items-center gap-2">
              <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              Uploading...
            </span>
          ) : isTraining ? (
            <span className="flex items-center gap-2">
              <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              Training Model...
            </span>
          ) : (
            <>
              <UploadCloud className="w-5 h-5" />
              Upload & Train
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default DragDropUpload;
