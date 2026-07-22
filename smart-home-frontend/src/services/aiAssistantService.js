import api from './api';
import signalRService from './signalRService';

export const aiAssistantService = {
  chat: async (message) => {
    const res = await api.post('/aiassistant/chat', { message });
    return res.data;
  },

  streamChat: (message, onChunk, onError, onDone) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const url = `${api.defaults.baseURL}/aiassistant/stream`;

    const xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.responseType = 'text';

    let buffer = '';

    xhr.onprogress = () => {
      buffer += xhr.responseText.substring(xhr.responseText.lastIndexOf('\n', buffer.length - 1) + 1);
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data: ')) continue;
        const data = trimmed.substring(6);

        if (data === '[DONE]') {
          if (onDone) onDone();
          continue;
        }

        try {
          const parsed = JSON.parse(data);
          if (parsed.error) {
            if (onError) onError(parsed.error);
          } else if (typeof parsed === 'string') {
            if (onChunk) onChunk(parsed);
          }
        } catch {
          if (onChunk) onChunk(data);
        }
      }
    };

    xhr.onerror = () => {
      if (onError) onError('Connection failed');
    };

    xhr.send(JSON.stringify({ message }));
    return () => xhr.abort();
  },

  executeCommand: async (command) => {
    const res = await api.post('/aiassistant/command', { command });
    return res.data;
  },

  explain: async (message) => {
    const res = await api.post('/aiassistant/explain', { message });
    return res.data;
  },

  generateReport: async (type) => {
    const res = await api.post('/aiassistant/report', { type });
    return res.data;
  },

  generateFullReport: async (type) => {
    const res = await api.post('/report/generate', { type });
    return res.data;
  },

  getReportTypes: async () => {
    const res = await api.get('/report/types');
    return res.data;
  },

  getContext: async () => {
    const res = await api.get('/aiassistant/context');
    return res.data;
  },

  getHistory: async () => {
    const res = await api.get('/aiassistant/history');
    return res.data;
  },

  clearConversation: async () => {
    const res = await api.delete('/aiassistant/clear');
    return res.data;
  },

  subscribeToAIEvents: (handlers) => {
    const { onNewNotification, onDeviceChange, onEnergyEvent, onSecurityAlert, onAutomationEvent } = handlers;

    signalRService.on('NewNotification', (data) => {
      if (onNewNotification) onNewNotification(data);
    });

    signalRService.on('DeviceStatusChanged', (data) => {
      if (onDeviceChange) onDeviceChange(data);
    });

    signalRService.on('EnergyUpdated', (data) => {
      if (onEnergyEvent) onEnergyEvent(data);
    });

    signalRService.on('SecurityAlert', (data) => {
      if (onSecurityAlert) onSecurityAlert(data);
    });

    signalRService.on('AutomationExecuted', (data) => {
      if (onAutomationEvent) onAutomationEvent(data);
    });
  }
};

export { aiAssistantService as default };
