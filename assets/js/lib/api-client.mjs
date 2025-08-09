// /assets/js/lib/api-client.mjs
import config from './config.mjs';
import { AUTH } from './constants.mjs';
import * as storage from './storage.mjs';

// Make an authenticated API request

export async function apiRequest(endpoint, options = {}) {
  try {
    const token = storage.getItem(AUTH.TOKEN_KEY);
    
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    if (token) {
      defaultOptions.headers.Authorization = `Bearer ${token}`;
    }
    
    const fetchOptions = {
      ...defaultOptions,
      ...options,
      headers: { ...defaultOptions.headers, ...options.headers }
    };
    
    if (fetchOptions.body && typeof fetchOptions.body === 'object') {
      fetchOptions.body = JSON.stringify(fetchOptions.body);
    }
    
    const url = `${config.api.baseUrl}/${endpoint}`;
    const response = await fetch(url, fetchOptions);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API request failed with status ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`API request error for ${endpoint}:`, error);
    throw error;
  }
}

export function get(endpoint, params = {}) {
  const queryString = new URLSearchParams(params).toString();
  const url = queryString ? `${endpoint}?${queryString}` : endpoint;
  return apiRequest(url, { method: 'GET' });
}

export function post(endpoint, data = {}) {
  return apiRequest(endpoint, {
    method: 'POST',
    body: data
  });
}

export function put(endpoint, data = {}) {
  return apiRequest(endpoint, {
    method: 'PUT',
    body: data
  });
}

export function del(endpoint) {
  return apiRequest(endpoint, { method: 'DELETE' });
}

const apiClient = {
  apiRequest,
  get,
  post,
  put,
  del
};

export default apiClient;