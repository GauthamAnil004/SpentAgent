import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_URL = 'https://spentagent-api.onrender.com/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 90000,
});

// Automatically retry once on a 503 (Render cold-start), after a short delay
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    const status = error.response?.status;

    if (status === 503) {
      config._retryCount = (config._retryCount || 0) + 1;
      if (config._retryCount <= 2) {
        const delay = config._retryCount === 1 ? 8000 : 15000; // 8s, then 15s
        await new Promise((resolve) => setTimeout(resolve, delay));
        return api(config);
      }
    }

    return Promise.reject(error);
  }
);

// Helper to save token and user info
export const saveToken = async (token, userName) => {
  try {
    await SecureStore.setItemAsync('userToken', token);
    if (userName) {
      await SecureStore.setItemAsync('userName', userName);
    }
  } catch (error) {
    console.error('Error saving token', error);
  }
};

export const getToken = async () => {
  try {
    return await SecureStore.getItemAsync('userToken');
  } catch (error) {
    console.error('Error getting token', error);
    return null;
  }
};

export const getUserName = async () => {
  try {
    return await SecureStore.getItemAsync('userName');
  } catch (error) {
    return null;
  }
};

export const clearToken = async () => {
  try {
    await SecureStore.deleteItemAsync('userToken');
    await SecureStore.deleteItemAsync('userName');
  } catch (error) {
    console.error('Error clearing token', error);
  }
};

// Request interceptor to attach JWT token
api.interceptors.request.use(
  async (config) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Helper to extract error message from FastAPI responses
export const getErrorMessage = (err) => {
  if (err.response && err.response.data && err.response.data.detail) {
    const detail = err.response.data.detail;
    // FastAPI validation errors are arrays of objects with a 'msg' property
    if (Array.isArray(detail)) {
      return detail.map(d => d.msg).join(', ');
    }
    // Standard HttpException details are usually strings
    if (typeof detail === 'string') {
      return detail;
    }
  }
  return err.message || 'An unexpected error occurred. Please try again.';
};

// --- AUTHENTICATION ROUTES ---

export const registerUser = (name, email, password) => {
  return api.post('/auth/register', { name, email, password });
};

export const loginUser = (email, password) => {
  return api.post('/auth/login', { email, password });
};

export const forgotPassword = (email) => {
  return api.post('/auth/forgot-password', { email });
};

export const verifyOtp = (email, otp) => {
  return api.post('/auth/verify-otp', { email, otp });
};

export const resetPassword = (reset_token, new_password) => {
  return api.post('/auth/reset-password', { reset_token, new_password });
};

// --- RECEIPT/POLICY UPLOAD ---

export const submitReceipt = (formData) => {
  return api.post('/submit-receipt', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const uploadPolicy = (formData) => {
  return api.post('/upload-policy', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

// --- XAI REASONING ---

export const getXaiReasoning = (transactionId) => {
  return api.get(`/get-xai-reasoning/${transactionId}`);
};

// --- PERSONAL FINANCE TRACKER ---

export const addExpense = (payload) => {
  return api.post('/personal/add-expense', payload);
};

export const getExpenses = () => {
  return api.get('/personal/expenses');
};

export const analyzeSpending = () => {
  return api.get('/personal/analyze');
};

// --- FRIEND LEDGER ---

export const addLedgerEntry = (payload) => {
  return api.post('/ledger/add', payload);
};

export const getLedgerRecords = () => {
  return api.get('/ledger/records');
};

export const settleLedgerEntry = (id) => {
  return api.patch(`/ledger/settle/${id}`);
};

export default api;
