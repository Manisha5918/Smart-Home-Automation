import { HubConnectionBuilder, LogLevel, HttpTransportType } from '@microsoft/signalr';

const BASE_URL = process.env.REACT_APP_API_URL || 'https://localhost:7292/api';
const HUB_URL = BASE_URL.replace('/api', '');

class SignalRService {
  constructor() {
    this.notificationConnection = null;
    this.dashboardConnection = null;
    this.listeners = {};
    this.connectionState = 'disconnected';
    this.startPromise = null;
  }

  getToken() {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  }

  buildConnection(hubName) {
    const token = this.getToken();
    return new HubConnectionBuilder()
      .withUrl(`${HUB_URL}/hubs/${hubName}`, {
        transport: HttpTransportType.WebSockets | HttpTransportType.LongPolling,
        accessTokenFactory: () => token || ''
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(LogLevel.Warning)
      .build();
  }

  async start() {
    if (this.startPromise) return this.startPromise;
    if (this.notificationConnection?.state === 'Connected' && this.dashboardConnection?.state === 'Connected') {
      this.connectionState = 'connected';
      return;
    }

    this.connectionState = 'connecting';
    this.notificationConnection = this.buildConnection('notifications');
    this.dashboardConnection = this.buildConnection('dashboard');

    this.registerReconnectHandlers(this.notificationConnection, 'notifications');
    this.registerReconnectHandlers(this.dashboardConnection, 'dashboard');

    this.startPromise = Promise.all([
      this.notificationConnection.start(),
      this.dashboardConnection.start()
    ]).then(() => {
      this.connectionState = 'connected';
      this.startPromise = null;
    }).catch(err => {
      this.connectionState = 'disconnected';
      this.startPromise = null;
      console.error('SignalR connection failed:', err);
    });

    return this.startPromise;
  }

  registerReconnectHandlers(connection, name) {
    connection.onreconnecting(() => {
      this.connectionState = 'reconnecting';
    });
    connection.onreconnected(() => {
      this.connectionState = 'connected';
      this.reattachListeners(name);
    });
    connection.onclose(() => {
      this.connectionState = 'disconnected';
      setTimeout(() => this.start(), 5000);
    });
  }

  reattachListeners(hubName) {
    const conn = hubName === 'notifications' ? this.notificationConnection : this.dashboardConnection;
    if (!conn) return;
    const hubListeners = this.listeners[hubName] || {};
    Object.keys(hubListeners).forEach(event => {
      hubListeners[event].forEach(cb => {
        conn.off(event);
        conn.on(event, cb);
      });
    });
  }

  on(event, callback) {
    const hubName = this.getHubForEvent(event);
    if (!hubName) return;
    const conn = hubName === 'notifications' ? this.notificationConnection : this.dashboardConnection;
    if (!conn) return;

    if (!this.listeners[hubName]) this.listeners[hubName] = {};
    if (!this.listeners[hubName][event]) this.listeners[hubName][event] = [];
    this.listeners[hubName][event].push(callback);
    conn.on(event, callback);
  }

  off(event, callback) {
    const hubName = this.getHubForEvent(event);
    if (!hubName) return;
    const conn = hubName === 'notifications' ? this.notificationConnection : this.dashboardConnection;
    if (!conn) return;

    if (this.listeners[hubName]?.[event]) {
      this.listeners[hubName][event] = this.listeners[hubName][event].filter(cb => cb !== callback);
    }
    if (callback) {
      conn.off(event, callback);
    } else {
      conn.off(event);
    }
  }

  async stop() {
    this.startPromise = null;
    this.listeners = {};
    if (this.notificationConnection) {
      this.notificationConnection.off();
      await this.notificationConnection.stop().catch(() => {});
      this.notificationConnection = null;
    }
    if (this.dashboardConnection) {
      this.dashboardConnection.off();
      await this.dashboardConnection.stop().catch(() => {});
      this.dashboardConnection = null;
    }
    this.connectionState = 'disconnected';
  }

  getHubForEvent(event) {
    const notificationEvents = [
      'NewNotification', 'UserPresenceChanged', 'SecurityAlert',
      'AIChatCompleted', 'DeviceAdded', 'DeviceRemoved',
      'AutomationExecuted', 'NotificationUpdated', 'UserOnlineCount'
    ];
    const dashboardEvents = [
      'DashboardUpdated', 'DeviceStatusChanged', 'NewActivity',
      'EnergyUpdated', 'AdminDashboardUpdated', 'DashboardRefreshRequested'
    ];
    if (notificationEvents.includes(event)) return 'notifications';
    if (dashboardEvents.includes(event)) return 'dashboard';
    return 'notifications';
  }
}

const signalRService = new SignalRService();
export default signalRService;
