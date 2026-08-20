import axiosClient from './axiosClient';

export const entryApi = {
  quickAdd: async (payload) => {
    return axiosClient.post('/entries/quick-add', payload);
  },
  undo: async (customerId, date) => {
    const params = date ? { date } : {};
    return axiosClient.delete(`/entries/${customerId}/undo`, { params });
  },
  getByMonthForAll: async (month) => {
    return axiosClient.get(`/entries/month/${month}`);
  },
};
export default entryApi;
