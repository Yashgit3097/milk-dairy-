import axiosClient from './axiosClient';

export const entryApi = {
  quickAdd: async (payload) => {
    return axiosClient.post('/entries/quick-add', payload);
  },
  undo: async (customerId, date, shift) => {
    const params = {};
    if (date) params.date = date;
    if (shift) params.shift = shift;
    return axiosClient.delete(`/entries/${customerId}/undo`, { params });
  },
  getByMonthForAll: async (month) => {
    return axiosClient.get(`/entries/month/${month}`);
  },
};
export default entryApi;
