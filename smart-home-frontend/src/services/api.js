import axios from 'axios';

// Base API URL
const BASE_URL = process.env.REACT_APP_API_URL || 'https://localhost:7292/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT token if it exists in localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle 401 Unauthorized errors with refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Don't intercept auth endpoints — they don't need token refresh
    if (originalRequest.url?.includes('/auth/login') ||
        originalRequest.url?.includes('/auth/register') ||
        originalRequest.url?.includes('/auth/verify-email') ||
        originalRequest.url?.includes('/auth/forgot-password') ||
        originalRequest.url?.includes('/auth/reset-password') ||
        originalRequest.url?.includes('/auth/resend-verification')) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (!token) {
          localStorage.removeItem('token');
          sessionStorage.removeItem('token');
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
          return Promise.reject(error);
        }

        const refreshResponse = await axios.post(`${BASE_URL}/auth/refresh`, { token });
        const newToken = refreshResponse.data.token;

        const storage = localStorage.getItem('token') ? localStorage : sessionStorage;
        storage.setItem('token', newToken);

        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// --- AUTH API SERVICE ---
export const authService = {
  login: async (email, password, persist = true) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data && response.data.token) {
      const storage = persist ? localStorage : sessionStorage;
      storage.setItem('token', response.data.token);
    }
    return response.data;
  },
  register: async (fullName, email, password) => {
    const response = await api.post('/auth/register', { fullName, email, password });
    return response.data;
  },
  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
  refreshToken: async () => {
    const response = await api.post('/auth/refresh');
    return response.data;
  },
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.warn('Server logout failed:', err);
    } finally {
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      window.location.href = '/login';
    }
  },
  verifyEmail: async (token) => {
    const response = await api.post('/auth/verify-email', { token });
    return response.data;
  },
  resendVerification: async (email) => {
    const response = await api.post('/auth/resend-verification', { email });
    return response.data;
  },
  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },
  resetPassword: async (token, password) => {
    const response = await api.post('/auth/reset-password', { token, password });
    return response.data;
  }
};

// --- DASHBOARD SERVICE ---
export const dashboardService = {
  getDashboardData: async () => {
    const response = await api.get('/Dashboard');
    return response.data; // statistics, recentActivities, recentAlerts, upcomingMaintenance
  },
  getRecentActivities: async () => {
    const response = await api.get('/dashboard/recent-activities');
    return response.data;
  },
  getRecentAlerts: async () => {
    const response = await api.get('/dashboard/recent-alerts');
    return response.data;
  },
  getUpcomingMaintenance: async () => {
    const response = await api.get('/dashboard/upcoming-maintenance');
    return response.data;
  }
};

// --- DEVICES SERVICE ---
export const deviceService = {
  getDevices: async () => {
    const response = await api.get('/device');
    return response.data;
  },
  getDevice: async (id) => {
    const response = await api.get(`/device/${id}`);
    return response.data;
  },
  createDevice: async (deviceData) => {
    const response = await api.post('/device', deviceData);
    return response.data;
  },
  updateDevice: async (id, deviceData) => {
    const response = await api.put(`/device/${id}`, deviceData);
    return response.data;
  },
  updateDeviceStatus: async (id, status) => {
    const response = await api.put(`/device/${id}/status`, { status });
    return response.data;
  },
  updatePowerConsumption: async (id, powerConsumption) => {
    const response = await api.put(`/device/${id}/power`, { powerConsumption });
    return response.data;
  },
  deleteDevice: async (id) => {
    const response = await api.delete(`/device/${id}`);
    return response.data;
  }
};

// --- ROOMS SERVICE ---
export const roomService = {
  getRooms: async () => {
    const response = await api.get('/room');
    return response.data;
  },
  getRoom: async (id) => {
    const response = await api.get(`/room/${id}`);
    return response.data;
  },
  createRoom: async (roomData) => {
    // roomData should be { roomName, description }
    const response = await api.post('/room', roomData);
    return response.data;
  },
  updateRoom: async (id, roomData) => {
    const response = await api.put(`/room/${id}`, roomData);
    return response.data;
  },
  getRoomDevices: async (id) => {
    const response = await api.get(`/room/${id}/devices`);
    return response.data; // { roomId, roomName, totalDevices, devices }
  },
  deleteRoom: async (id) => {
    const response = await api.delete(`/room/${id}`);
    return response.data;
  }
};

// --- NOTIFICATIONS SERVICE ---
export const notificationService = {
  getNotifications: async () => {
    const response = await api.get('/notification');
    return response.data;
  },
  getNotification: async (id) => {
    const response = await api.get(`/notification/${id}`);
    return response.data;
  },
  createNotification: async (notificationData) => {
    const response = await api.post('/notification', notificationData);
    return response.data;
  },
  markAsRead: async (id) => {
    const response = await api.put(`/notification/${id}/read`);
    return response.data;
  },
  getUnreadCount: async () => {
    const response = await api.get('/notification/unread-count');
    return response.data;
  },
  deleteNotification: async (id) => {
    const response = await api.delete(`/notification/${id}`);
    return response.data;
  }
};

// --- ACTIVITY LOGS SERVICE ---
export const activityLogService = {
  getActivityLogs: async () => {
    const response = await api.get('/activitylog');
    return response.data;
  },
  getActivityLog: async (id) => {
    const response = await api.get(`/activitylog/${id}`);
    return response.data;
  },
  createActivityLog: async (logData) => {
    const response = await api.post('/activitylog', logData);
    return response.data;
  },
  deleteActivityLog: async (id) => {
    const response = await api.delete(`/activitylog/${id}`);
    return response.data;
  }
};

// --- AUTOMATION RULES SERVICE ---
export const automationRuleService = {
  getAutomationRules: async () => {
    const response = await api.get('/automationrule');
    return response.data;
  },
  getAutomationRule: async (id) => {
    const response = await api.get(`/automationrule/${id}`);
    return response.data;
  },
  createAutomationRule: async (ruleData) => {
    const response = await api.post('/automationrule', ruleData);
    return response.data;
  },
  updateAutomationRule: async (id, ruleData) => {
    const response = await api.put(`/automationrule/${id}`, ruleData);
    return response.data;
  },
  toggleAutomationRule: async (id) => {
    const response = await api.put(`/automationrule/${id}/toggle`);
    return response.data;
  },
  deleteAutomationRule: async (id) => {
    const response = await api.delete(`/automationrule/${id}`);
    return response.data;
  }
};

// --- AI SUGGESTIONS SERVICE ---
export const aiSuggestionService = {
  generateSuggestions: async () => {
    const response = await api.post('/aisuggestion/generate');
    return response.data;
  },
  getSuggestions: async () => {
    const response = await api.get('/aisuggestion');
    return response.data;
  },
  acceptSuggestion: async (id) => {
    const response = await api.post(`/aisuggestion/${id}/accept`);
    return response.data;
  }
};

// --- AI CHAT SERVICE ---
export const aiChatService = {
  chat: async (message) => {
    const response = await api.post('/ai/chat', { message });
    return response.data;
  },
  getRoutines: async () => {
    const response = await api.get('/ai/routines');
    return response.data;
  }
};

// --- AI ASSISTANT SERVICE (v2) ---
export const aiAssistantService = {
  chat: async (message) => {
    const response = await api.post('/aiassistant/chat', { message });
    return response.data;
  },
  executeCommand: async (command) => {
    const response = await api.post('/aiassistant/command', { command });
    return response.data;
  },
  generateReport: async (type) => {
    const response = await api.post('/aiassistant/report', { type });
    return response.data;
  },
  generateFullReport: async (type) => {
    const response = await api.post('/report/generate', { type });
    return response.data;
  },
  getReportTypes: async () => {
    const response = await api.get('/report/types');
    return response.data;
  },
  getContext: async () => {
    const response = await api.get('/aiassistant/context');
    return response.data;
  },
  getHistory: async () => {
    const response = await api.get('/aiassistant/history');
    return response.data;
  },
  clearConversation: async () => {
    const response = await api.delete('/aiassistant/clear');
    return response.data;
  }
};

// --- PROFILE SERVICE ---
export const profileService = {
  getProfile: async () => {
    const response = await api.get('/profile');
    return response.data; // { userId, fullName, email, role, createdAt, totalDevices, activeDevices }
  },
  updateProfile: async (profileData) => {
    const response = await api.put('/profile', profileData);
    return response.data;
  },
  changePassword: async (passwordData) => {
    const response = await api.put('/profile/change-password', passwordData);
    return response.data;
  }
};

// --- ADDITIONAL ANALYTICS SERVICE ---
export const analyticsService = {
  getOverview: async () => {
    const response = await api.get('/analytics/overview');
    return response.data;
  },
  getPowerByRoom: async () => {
    const response = await api.get('/analytics/power-by-room');
    return response.data;
  },
  getPowerByLocation: async () => {
    const response = await api.get('/analytics/power-by-location');
    return response.data;
  },
  getPowerByDevice: async () => {
    const response = await api.get('/analytics/power-by-device');
    return response.data;
  },
  getHighestConsumingDevice: async () => {
    const response = await api.get('/analytics/highest-consuming-device');
    return response.data;
  },
  getEnergyHistory: async () => {
    const response = await api.get('/analytics/energy-history');
    return response.data;
  },
  getDailyEnergyUsage: async () => {
    const response = await api.get('/analytics/daily');
    return response.data;
  },
  getEnergySummary: async () => {
    const response = await api.get('/energyusage/summary');
    return response.data;
  },
  getDeviceEnergyChart: async (deviceId) => {
    const response = await api.get(`/energyusage/chart/${deviceId}`);
    return response.data; // { deviceId, deviceName, data: [{ time, power }] }
  }
};

// --- ENERGY ANALYTICS SERVICE ---
export const energyAnalyticsService = {
  getDashboardData: async () => {
    const response = await api.get('/EnergyAnalytics/dashboard');
    return response.data;
  },
  getBillPrediction: async () => {
    const response = await api.get('/EnergyAnalytics/bill-prediction');
    return response.data;
  },
  getDailyTrend: async () => {
    const response = await api.get('/EnergyAnalytics/daily-trend');
    return response.data;
  },
  getDeviceUsage: async () => {
    const response = await api.get('/EnergyAnalytics/device-usage');
    return response.data;
  },
  getMonthlyTrend: async () => {
    const response = await api.get('/EnergyAnalytics/monthly-trend');
    return response.data;
  },
  getUsageShare: async () => {
    const response = await api.get('/EnergyAnalytics/usage-share');
    return response.data;
  },
  getRecommendations: async () => {
    const response = await api.get('/EnergyAnalytics/recommendations');
    return response.data;
  },
  getEnergyAdvisor: async () => {
    const response = await api.get('/EnergyAnalytics/energy-advisor');
    return response.data;
  },
  getCarbonFootprint: async () => {
    const response = await api.get('/EnergyAnalytics/carbon-footprint');
    return response.data;
  }
};




// --- VACATION MODE SERVICE ---
export const vacationModeService = {
  getSummary: async () => {
    const response = await api.get('/VacationMode/summary');
    return response.data;
  },
  enable: async (dto) => {
    const response = await api.post('/VacationMode/enable', dto);
    return response.data;
  },
  disable: async () => {
    const response = await api.post('/VacationMode/disable');
    return response.data;
  }
};

// --- ENERGY USAGE SERVICE ---
export const energyUsageService = {
  getEnergyUsage: async () => {
    const response = await api.get('/energyusage');
    return response.data;
  },
  getDeviceEnergyUsage: async (deviceId) => {
    const response = await api.get(`/energyusage/device/${deviceId}`);
    return response.data;
  },
  getSummary: async () => {
    const response = await api.get('/energyusage/summary');
    return response.data;
  }
};

export const monthlyReportService = {
  getMonthlyReport: async () => {
    const response = await api.get('/MonthlyReport');
    return response.data;
  }
};

// --- VOICE COMMAND SERVICE ---
export const voiceService = {
  processVoiceCommand: async (text) => {
    const response = await api.post('/voice/process', { text });
    return response.data;
  }
};

// --- ADMIN SERVICE ---
export const adminService = {
  getDashboardData: async () => {
    const response = await api.get('/Admin/dashboard');
    return response.data;
  },
  getAnalytics: async () => {
    const response = await api.get('/Admin/analytics');
    return response.data;
  },
  getUsers: async () => {
    const response = await api.get('/Admin/users');
    return response.data;
  },
  getAllUserDetails: async () => {
    const response = await api.get('/Admin/users-details');
    return response.data;
  },
  getUser: async (id) => {
    const response = await api.get(`/Admin/users/${id}`);
    return response.data;
  },
  getUserDevices: async (id) => {
    const response = await api.get(`/Admin/users/${id}/devices`);
    return response.data;
  },
  getUserLoginHistory: async (id) => {
    const response = await api.get(`/Admin/users/${id}/login-history`);
    return response.data;
  },
  updateUserRole: async (id, role) => {
    const response = await api.put(`/Admin/users/${id}/role`, { role });
    return response.data;
  },
  unlockUser: async (id) => {
    const response = await api.put(`/Admin/users/${id}/unlock`);
    return response.data;
  },
  deleteUser: async (id, reason, additionalNotes) => {
    const response = await api.delete(`/Admin/users/${id}`, { data: { reason, additionalNotes } });
    return response.data;
  },
  getFailedLogins: async () => {
    const response = await api.get('/Admin/failed-logins');
    return response.data;
  },
  getDangerUsers: async () => {
    const response = await api.get('/Admin/danger-users');
    return response.data;
  },
  getRecentUsers: async () => {
    const response = await api.get('/Admin/recent-users');
    return response.data;
  },
  getTopUsers: async () => {
    const response = await api.get('/Admin/top-users');
    return response.data;
  },
  getDeviceTypes: async () => {
    const response = await api.get('/Admin/device-types');
    return response.data;
  },
  getUserGrowth: async () => {
    const response = await api.get('/Admin/user-growth');
    return response.data;
  },
  getUserActivity: async () => {
    const response = await api.get('/Admin/user-activity');
    return response.data;
  },
  getDeletedUsers: async () => {
    const response = await api.get('/Admin/deleted-users');
    return response.data;
  },
  getDeletionHistory: async () => {
    const response = await api.get('/Admin/deletion-history');
    return response.data;
  },
  getVacationUsers: async () => {
    const response = await api.get('/Admin/vacation-users');
    return response.data;
  },
  getVacationSecurityEvents: async () => {
    const response = await api.get('/Admin/vacation-security-events');
    return response.data;
  },
  getAllDevices: async () => {
    const response = await api.get('/Admin/all-devices');
    return response.data;
  },
  getActivityLogs: async (page = 1, pageSize = 50) => {
    const response = await api.get(`/Admin/all-activity-logs?page=${page}&pageSize=${pageSize}`);
    return response.data;
  },
  getEnergyOverview: async () => {
    const response = await api.get('/Admin/energy/overview');
    return response.data;
  },
  getEnergyReport: async (period = 'month') => {
    const response = await api.get(`/Admin/energy/report?period=${period}`);
    return response.data;
  },
  getSystemHealth: async () => {
    const response = await api.get('/Admin/system-health');
    return response.data;
  },
  getDeviceMetrics: async () => {
    const response = await api.get('/Admin/analytics/device-metrics');
    return response.data;
  },
  getActivitySummary: async () => {
    const response = await api.get('/Admin/analytics/activity-summary');
    return response.data;
  },
  getEnergySummary: async () => {
    const response = await api.get('/Admin/analytics/energy-summary');
    return response.data;
  }
};

// --- AI EXPLAINABILITY SERVICE ---
export const aiExplainabilityService = {
  query: async (message) => {
    const response = await api.post('/aiexplainability/query', { message });
    return response.data;
  },
  clearHistory: async () => {
    const response = await api.delete('/aiexplainability/clear');
    return response.data;
  }
};

// --- ADMIN USER MANAGEMENT SERVICE (aliases for backward compat) ---
export const adminUserService = {
  getUsers: () => adminService.getUsers(),
  getUser: (id) => adminService.getUser(id),
  updateUserRole: (id, role) => adminService.updateUserRole(id, role),
  deleteUser: (id) => adminService.deleteUser(id, 'Deleted by admin'),
  getFailedLogins: () => adminService.getFailedLogins(),
  getSecurityEvents: () => adminService.getVacationSecurityEvents()
};

// --- ADMIN SYSTEM SETTINGS SERVICE ---
export const adminSettingsService = {
  getSettings: async () => {
    const response = await api.get('/Admin/settings');
    return response.data;
  },
  updateSettings: async (settings) => {
    const response = await api.put('/Admin/settings', settings);
    return response.data;
  },
  getSystemHealth: async () => {
    const response = await api.get('/Admin/system-health');
    return response.data;
  }
};

// --- ADMIN ENERGY SERVICE ---
export const adminEnergyService = {
  getOverview: () => adminService.getEnergyOverview(),
  getDetailedReport: (period) => adminService.getEnergyReport(period)
};

// --- ADMIN REPORTS SERVICE ---
export const adminReportsService = {
  generateReport: async (type, format, dateRange) => {
    const period = (dateRange && dateRange.period) || dateRange || 'month';
    const response = await api.post('/Admin/reports/generate', { type, format, period });
    return response.data;
  },
  getReports: async () => {
    const response = await api.get('/Admin/reports');
    return response.data;
  }
};

// --- MAINTENANCE SERVICE ---
export const maintenanceService = {
  getTracker: async () => {
    const response = await api.get('/Maintenance/tracker');
    return response.data;
  },
  addMaintenance: async (model) => {
    const response = await api.post('/Maintenance', model);
    return response.data;
  },
  updateMaintenance: async (id, model) => {
    const response = await api.put(`/Maintenance/${id}`, model);
    return response.data;
  }
};

// --- PREDICTIVE MAINTENANCE SERVICE ---
export const predictiveMaintenanceService = {
  getMyPredictions: async () => {
    const response = await api.get('/PredictiveMaintenance/my-devices');
    return response.data;
  },
  getAllPredictions: async () => {
    const response = await api.get('/PredictiveMaintenance/all-devices');
    return response.data;
  }
};

// --- DEVICE HEALTH SERVICE ---
export const deviceHealthService = {
  getMyDevices: async () => {
    const response = await api.get('/DeviceHealth/my-devices');
    return response.data;
  },
  getAllDevices: async () => {
    const response = await api.get('/DeviceHealth/all-devices');
    return response.data;
  }
};

// --- SECURITY SERVICE ---
export const securityService = {
  getRisk: async () => {
    const response = await api.get('/Security/risk');
    return response.data;
  },
  getLoginActivity: async () => {
    const response = await api.get('/Security/login-activity');
    return response.data;
  },
  getSummary: async () => {
    const response = await api.get('/Security/summary');
    return response.data;
  }
};

// --- ENERGY GOAL SERVICE ---
export const energyGoalService = {
  getGoal: async () => {
    const response = await api.get('/EnergyGoal');
    return response.data;
  },
  setGoal: async (dto) => {
    const response = await api.post('/EnergyGoal', dto);
    return response.data;
  }
};

// --- Advanced Energy Analytics ---
export const advancedEnergyService = {
  getCarbonFootprint: async () => {
    const response = await api.get('/EnergyAnalytics/carbon-footprint');
    return response.data;
  },
  getCostComparison: async () => {
    const response = await api.get('/EnergyAnalytics/cost-comparison');
    return response.data;
  },
  getEnergyAdvisor: async () => {
    const response = await api.get('/EnergyAnalytics/energy-advisor');
    return response.data;
  },
  getRecommendations: async () => {
    const response = await api.get('/EnergyAnalytics/recommendations');
    return response.data;
  },
  getTopDevices: async () => {
    const response = await api.get('/EnergyAnalytics/top-devices');
    return response.data;
  }
};

// --- FAVORITE DEVICE SERVICE ---
export const favoriteDeviceService = {
  getFavorites: async () => {
    const response = await api.get('/FavoriteDevice');
    return response.data;
  },
  addFavorite: async (deviceId) => {
    const response = await api.post('/FavoriteDevice', { deviceId });
    return response.data;
  },
  removeFavorite: async (id) => {
    const response = await api.delete(`/FavoriteDevice/${id}`);
    return response.data;
  }
};

export default api;
