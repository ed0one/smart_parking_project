// src/utils/apiClient.js - Enhanced API Client with Error Handling

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';

class ApiClient {
  constructor(baseURL = API_BASE_URL) {
    this.baseURL = baseURL;
    this.isOnline = navigator.onLine;
    
    // Monitor network status
    window.addEventListener('online', () => {
      this.isOnline = true;
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  async request(endpoint, options = {}) {
    // Check network connectivity
    if (!this.isOnline) {
      throw new Error('Nu există conexiune la internet');
    }

    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      console.log(`🔌 API Call: ${config.method || 'GET'} ${url}`);
      
      const response = await fetch(url, config);
      
      // Check if we received HTML instead of JSON (common when server is down)
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        console.error('❌ Server returned HTML instead of JSON - Server might be down');
        throw new Error('Serverul nu este disponibil. Verificați dacă backend-ul rulează pe portul 3000.');
      }

      // Try to parse JSON
      let data;
      try {
        const text = await response.text();
        if (text) {
          data = JSON.parse(text);
        } else {
          data = null;
        }
      } catch (parseError) {
        console.error('❌ JSON Parse Error:', parseError);
        console.error('❌ Response Text:', await response.text());
        throw new Error('Răspuns invalid de la server (format JSON incorect)');
      }

      if (!response.ok) {
        const errorMessage = data?.error || data?.message || `HTTP ${response.status}`;
        console.error(`❌ API Error ${response.status}:`, errorMessage);
        throw new Error(errorMessage);
      }

      console.log(`✅ API Success:`, data);
      return data;

    } catch (error) {
      // Network errors (server down, DNS issues, etc.)
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        console.error('❌ Network Error - Server might be down');
        throw new Error('Nu se poate conecta la server. Verificați dacă backend-ul rulează pe http://localhost:3000');
      }
      
      // Re-throw other errors
      throw error;
    }
  }

  // HTTP Methods
  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // Health check method
  async healthCheck() {
    try {
      await this.get('/api/health');
      return true;
    } catch {
      return false;
    }
  }
}

// Create singleton instance
const apiClient = new ApiClient();

// Export specific API methods for parking system
export const parkingApi = {
  // Parcare endpoints
  async getParcareCompleta(id = 1) {
    return apiClient.get(`/api/parcare-completa/${id}`);
  },

  // Utilizator endpoints  
  async loginUser(credentials) {
    return apiClient.post('/api/auth/login', credentials);
  },

  async registerUser(userData) {
    return apiClient.post('/api/auth/register', userData);
  },

  // Vehicule endpoints
  async getUserVehicles(userId) {
    return apiClient.get(`/api/user/${userId}/vehicule`);
  },

  async addVehicle(vehicleData) {
    return apiClient.post('/api/user/vehicule', vehicleData);
  },

  // Locuri endpoints
  async simulateParking(locId, data) {
    return apiClient.put(`/api/locuri/${locId}/simulare`, data);
  },

  async reserveParking(locId, data) {
    return apiClient.post(`/api/locuri/${locId}/rezervare`, data);
  },

  // Abonamente endpoints
  async getUserSubscriptions(userId) {
    return apiClient.get(`/api/user/${userId}/abonamente`);
  },

  async buySubscription(subscriptionData) {
    return apiClient.post('/api/user/abonamente', subscriptionData);
  },

  async getTariffs() {
    return apiClient.get('/api/tarife/abonamente');
  },

  // Health check
  async checkHealth() {
    return apiClient.healthCheck();
  }
};

export default apiClient;