import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import signalRService from '../services/signalRService';

const SignalRContext = createContext(null);

export const SignalRProvider = ({ children }) => {
  const { isAuthenticated, token } = useAuth();
  const [connectionState, setConnectionState] = useState('disconnected');
  const listenersRef = useRef({});

  useEffect(() => {
    if (!isAuthenticated || !token) {
      signalRService.stop();
      setConnectionState('disconnected');
      return;
    }

    signalRService.start();
    const interval = setInterval(() => {
      setConnectionState(signalRService.connectionState);
    }, 500);

    return () => {
      clearInterval(interval);
      signalRService.stop();
    };
  }, [isAuthenticated, token]);

  const on = useCallback((event, callback) => {
    const key = `${event}_${callback.toString()}`;
    if (listenersRef.current[key]) return;
    listenersRef.current[key] = callback;
    signalRService.on(event, callback);
  }, []);

  const off = useCallback((event, callback) => {
    const key = `${event}_${callback.toString()}`;
    delete listenersRef.current[key];
    signalRService.off(event, callback);
  }, []);

  const value = { connectionState, on, off, signalRService };

  return (
    <SignalRContext.Provider value={value}>
      {children}
    </SignalRContext.Provider>
  );
};

export const useSignalR = () => {
  const context = useContext(SignalRContext);
  if (!context) {
    throw new Error('useSignalR must be used within a SignalRProvider');
  }
  return context;
};
