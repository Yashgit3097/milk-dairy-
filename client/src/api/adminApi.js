import axiosClient from './axiosClient';

export const adminApi = {
  login: async (email, password) => {
    return axiosClient.post('/admin/login', { email, password });
  },
  getDashboardOverview: async () => {
    return axiosClient.get('/admin/dashboard');
  },
  listPricing: async () => {
    return axiosClient.get('/admin/pricing');
  },
  createPricing: async (payload) => {
    return axiosClient.post('/admin/pricing', payload);
  },
};
