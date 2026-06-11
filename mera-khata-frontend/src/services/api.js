import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

// ── Inventory ──────────────────────────────────────────────────────────────
export const getInventory = () => api.get('/inventory').then(r => r.data);
export const addInventoryItem = (item) =>
  api.post('/inventory', {
    item_name: item.name,
    quantity: Number(item.quantity),
    unit: item.unit,
    cost_price: Number(item.price),
    sell_price: Number(item.price),
  }).then(r => r.data);

export const updateInventoryItem = (id, updates) =>
  api.patch(`/inventory/${id}`, updates).then(r => r.data);

export const deleteInventoryItem = (id) =>
  api.delete(`/inventory/${id}`).then(r => r.data);

// ── Customers ──────────────────────────────────────────────────────────────
export const getCustomers = () => api.get('/customers').then(r => r.data);

export const addCustomer = (customer) =>
  api.post('/customers', customer).then(r => r.data);

export const settleCustomer = (id, amount) =>
  api.patch(`/customers/${id}/settle`, { amount }).then(r => r.data);

// ── Transactions ───────────────────────────────────────────────────────────
export const getTransactions = () =>
  api.get('/transactions').then(r => r.data);

export const addTransaction = (txn) =>
  api.post('/transactions', txn).then(r => r.data);

// ── Voice Pipeline ─────────────────────────────────────────────────────────
/**
 * Send audio blob to voice-commit endpoint.
 * Returns: { transcript, extracted, customer, transaction, tts_audio_base64, tts_text }
 */
export const voiceCommit = async (audioBlob) => {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'recording.webm');

  const response = await api.post('/transactions/voice-commit', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000, // voice pipeline can take longer
  });
  return response.data;
};

// ── Health ─────────────────────────────────────────────────────────────────
export const checkHealth = () => api.get('/health').then(r => r.data);

export default api;

export const deleteCustomer = (id) =>
  api.delete(`/customers/${id}`).then(r => r.data);

export const resetAllData = () =>
  api.post("/admin/reset-all")
     .then(r => r.data);