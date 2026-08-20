import React, { createContext, useContext, useState, useEffect } from 'react';
import { adminApi } from '../api/adminApi';
import { customerApi } from '../api/customerApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [token, setToken] = useState(null);
  const [userRole, setUserRole] = useState(null); // 'admin' | 'customer' | null
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check session details on load
    const storedToken = localStorage.getItem('token');
    const storedRole = localStorage.getItem('role');

    if (storedToken && storedRole) {
      setToken(storedToken);
      setUserRole(storedRole);

      try {
        if (storedRole === 'admin') {
          const storedAdmin = localStorage.getItem('admin');
          if (storedAdmin) setAdmin(JSON.parse(storedAdmin));
        } else if (storedRole === 'customer') {
          const storedCustomer = localStorage.getItem('customer');
          if (storedCustomer) setCustomer(JSON.parse(storedCustomer));
        }
      } catch (e) {
        console.error('Failed to parse user session details', e);
        logout();
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await adminApi.login(email, password);
      if (response.success && response.data) {
        const { token: userToken, admin: adminData } = response.data;
        
        localStorage.setItem('token', userToken);
        localStorage.setItem('role', 'admin');
        localStorage.setItem('admin', JSON.stringify(adminData));
        
        setToken(userToken);
        setUserRole('admin');
        setAdmin(adminData);
        setCustomer(null);
        return { success: true };
      }
      return { success: false, error: response.error || 'Login failed' };
    } catch (err) {
      return { success: false, error: err.error || err.message || 'Login failed' };
    }
  };

  const activate = async (activationCode, mobile) => {
    try {
      const response = await customerApi.activate(activationCode, mobile);
      if (response.success && response.data) {
        const { token: customerToken, customer: customerData } = response.data;

        localStorage.setItem('token', customerToken);
        localStorage.setItem('role', 'customer');
        localStorage.setItem('customer', JSON.stringify(customerData));

        setToken(customerToken);
        setUserRole('customer');
        setCustomer(customerData);
        setAdmin(null);
        return { success: true };
      }
      return { success: false, error: response.error || 'Activation failed' };
    } catch (err) {
      return { success: false, error: err.error || err.message || 'Activation failed' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('admin');
    localStorage.removeItem('customer');
    setToken(null);
    setUserRole(null);
    setAdmin(null);
    setCustomer(null);
  };

  const val = {
    admin,
    customer,
    token,
    userRole,
    isLoading,
    isAuthenticated: !!token,
    isAdmin: userRole === 'admin',
    isCustomer: userRole === 'customer',
    login,
    activate,
    logout,
  };

  return <AuthContext.Provider value={val}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }
  return context;
}
