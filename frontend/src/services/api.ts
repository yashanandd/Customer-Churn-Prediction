import axios from 'axios';

const API_URL = "https://customer-churn-backend-0xco.onrender.com/api";
export const api = axios.create({
  baseURL: API_URL,
});

export const uploadDataset = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/upload/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
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
