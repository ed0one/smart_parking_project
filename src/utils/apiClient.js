// src/utils/apiClient.js
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';

class ApiClient {
  constructor(baseURL = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    try {
      const response = await fetch(url, { ...options, headers });
      
      // Gestionăm cazul în care serverul returnează HTML (eroare de server/proxy)
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        throw new Error('Eroare server: Răspunsul nu este JSON valid.');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || `Eroare API: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`Eroare la apelul ${endpoint}:`, error);
      throw error;
    }
  }

  get(endpoint) { return this.request(endpoint, { method: 'GET' }); }
  post(endpoint, body) { return this.request(endpoint, { method: 'POST', body: JSON.stringify(body) }); }
  put(endpoint, body) { return this.request(endpoint, { method: 'PUT', body: JSON.stringify(body) }); }
  delete(endpoint) { return this.request(endpoint, { method: 'DELETE' }); }
  
  // Health check
  async healthCheck() {
      return this.get('/api/health');
  }
}

const apiClient = new ApiClient();

export const parkingApi = {
  // Parcare & Zone
  getParcari: () => apiClient.get('/api/parcari'),
  getParcareCompleta: (id) => apiClient.get(`/api/parcare-completa/${id}`),
  
  // Auth
  loginUser: (creds) => apiClient.post('/api/auth/login', creds),
  registerUser: (data) => apiClient.post('/api/auth/register', data),
  
  // Vehicule
  getUserVehicles: (userId) => apiClient.get(`/api/user/${userId}/vehicule`),
  addVehicle: (data) => apiClient.post('/api/user/vehicule', data),
  
  // Abonamente & Tarife
  getUserSubscriptions: (userId) => apiClient.get(`/api/user/${userId}/abonamente`),
  getTariffs: () => apiClient.get('/api/tarife/abonamente'),
  buySubscription: (data) => apiClient.post('/api/user/abonamente', data),
  
  // Locuri (Rezervare & Simulare)
  reserveParking: (locId, data) => apiClient.post(`/api/locuri/${locId}/rezervare`, data),
  simulateParking: (locId, data) => apiClient.put(`/api/locuri/${locId}/simulare`, data),
  
  checkHealth: () => apiClient.healthCheck()
};

export default apiClient;