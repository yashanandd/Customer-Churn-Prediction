import { api } from './api';

export const registerUser = async (email: string, username: string, password: string) => {
  const response = await api.post('/auth/register', { email, username, password });
  return response.data;
};

export const loginUser = async (usernameOrEmail: string, password: string) => {
  const response = await api.post('/auth/login', {
    username_or_email: usernameOrEmail,
    password
  });
  return response.data;
};

export const forgotPassword = async (email: string) => {
  const response = await api.post('/auth/forgot-password', { email });
  return response.data;
};

export const verifyOtp = async (email: string, otp: string, newPassword: string) => {
  const response = await api.post('/auth/verify-otp', {
    email,
    otp,
    new_password: newPassword
  });
  return response.data;
};

export const changePassword = async (oldPassword: string, newPassword: string) => {
  const response = await api.post('/auth/change-password', {
    old_password: oldPassword,
    new_password: newPassword
  });
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};
