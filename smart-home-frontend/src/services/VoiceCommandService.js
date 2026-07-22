import api from './api';

export const voiceCommandService = {
  processVoiceCommand: async (text) => {
    const response = await api.post('/voice/process', { text });
    return response.data;
  },
};
