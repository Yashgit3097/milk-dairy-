import axiosClient from './axiosClient';

export const customerApi = {
  list: async (filters = {}) => {
    return axiosClient.get('/customers', { params: filters });
  },
  getById: async (id) => {
    return axiosClient.get(`/customers/${id}`);
  },
  create: async (customerData) => {
    return axiosClient.post('/customers', customerData);
  },
  update: async (id, updateData) => {
    return axiosClient.put(`/customers/${id}`, updateData);
  },
  remove: async (id) => {
    return axiosClient.delete(`/customers/${id}`);
  },
  getEntries: async (id) => {
    return axiosClient.get(`/customers/${id}/entries`);
  },
  getEntryByMonth: async (id, month) => {
    return axiosClient.get(`/customers/${id}/entries/${month}`);
  },
  activate: async (activationCode, mobile) => {
    return axiosClient.post('/customer/activate', { activationCode, mobile });
  },
  getMeOverview: async () => {
    return axiosClient.get('/customer/me/overview');
  },
  subscribePush: async (subscription) => {
    return axiosClient.post('/customer/push/subscribe', { subscription });
  },
  unsubscribePush: async (endpoint) => {
    return axiosClient.post('/customer/push/unsubscribe', { endpoint });
  },
};
