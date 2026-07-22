import React, { createContext, useState, useEffect, useContext } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

const CLAIM_ROLE = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';
const CLAIM_NAME = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name';
const CLAIM_EMAIL = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress';

const decodeToken = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      fullName: payload[CLAIM_NAME] || payload.name || payload.fullName || '',
      email: payload[CLAIM_EMAIL] || payload.email || payload.sub || '',
      role: payload[CLAIM_ROLE] || payload.role || 'User',
    };
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize Auth state from localStorage by decoding the token
  useEffect(() => {
    const savedToken = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (savedToken) {
      const decoded = decodeToken(savedToken);
      if (decoded) {
        setToken(savedToken);
        setUser(decoded);
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password, rememberMe = true) => {
    setLoading(true);
    setError(null);
    try {
      const data = await authService.login(email, password, rememberMe);
      const decoded = decodeToken(data.token);
      const userData = {
        fullName: data.fullName || decoded.fullName || '',
        email: data.email || decoded.email || '',
        role: data.role || decoded.role || 'User',
      };
      setToken(data.token);
      setUser(userData);
      return { ...data, ...userData };
    } catch (err) {
      let message = 'Invalid email or password.';
      let needsVerification = false;
      let status = 0;
      if (err.response) {
        status = err.response.status;
        message = err.response.data?.message || err.response.data?.title || 'Unauthorized access.';
        needsVerification = err.response.data?.needsVerification === true;
      } else if (err.request) {
        message = `Cannot connect to the backend server. Please verify it is running on ${process.env.REACT_APP_API_URL || 'https://localhost:7292/api'}`;
      } else {
        message = err.message;
      }
      setError(message);
      const loginError = new Error(message);
      loginError.status = status;
      loginError.needsVerification = needsVerification;
      throw loginError;
    } finally {
      setLoading(false);
    }
  };

  const register = async (fullName, email, password) => {
    setLoading(true);
    setError(null);
    try {
      const data = await authService.register(fullName, email, password);
      return data;
    } catch (err) {
      let message = 'Registration failed.';
      let emailDelivered = true;
      if (err.response) {
        message = err.response.data?.message || err.response.data?.title || 'Validation error.';
        emailDelivered = err.response.data?.emailDelivered !== false;
      } else if (err.request) {
        message = `Cannot connect to the backend server. Please verify it is running on ${process.env.REACT_APP_API_URL || 'https://localhost:7292/api'}`;
      } else {
        message = err.message;
      }
      setError(message);
      const regError = new Error(message);
      regError.emailDelivered = emailDelivered;
      throw regError;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    setToken(null);
  };

  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        isAuthenticated,
        login,
        register,
        logout,
        setUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
