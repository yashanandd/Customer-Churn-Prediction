import axios from 'axios';

// Detect whether running locally or in production
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? "http://localhost:8000/api"
  : "https://customer-churn-backend-0xco.onrender.com/api";

export const api = axios.create({
  baseURL: API_URL,
});

// Axios Request Interceptor to inject bearer auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export const uploadDataset = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/upload/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const getUploadHistory = async () => {
  const response = await api.get('/upload/history');
  return response.data;
};

export const selectActiveDataset = async (recordId: number) => {
  const response = await api.post(`/upload/select/${recordId}`);
  return response.data;
};

export const trainModel = async (modelType: string = 'rf') => {
  const response = await api.post(`/ml/train?model_type=${modelType}`);
  return response.data;
};

export const getKPIs = async () => {
  const response = await api.get('/analytics/kpi');
  return response.data;
};

export const getTrends = async () => {
  const response = await api.get('/analytics/trends');
  return response.data;
};

export const getDepartmentChurn = async () => {
  const response = await api.get('/analytics/departments');
  return response.data;
};

export const getInsights = async () => {
  const response = await api.get('/ml/insights');
  return response.data;
};

export const predictChurn = async (features: Record<string, any>) => {
  const response = await api.post('/ml/predict', { features });
  return response.data;
};

export const getCustomers = async (page: number, limit: number, search: string, riskSegment: string, churnStatus: string) => {
  const response = await api.get('/analytics/customers', {
    params: { page, limit, search, risk_segment: riskSegment, churn_status: churnStatus }
  });
  return response.data;
};

export const getModelMetrics = async () => {
  const response = await api.get('/ml/metrics');
  return response.data;
};

export const getPredictionHistory = async () => {
  const response = await api.get('/ml/predictions');
  return response.data;
};
