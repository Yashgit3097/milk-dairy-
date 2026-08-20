import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { createSocket } from '../sockets/socketClient';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { token, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      // Disconnect and clean up if not authenticated
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Initialize socket connection
    const clientSocket = createSocket(token);
    setSocket(clientSocket);

    clientSocket.on('connect', () => {
      setIsConnected(true);
      console.log('[Socket] Connected to server.');
    });

    clientSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('[Socket] Disconnected from server.');
    });

    clientSocket.on('connect_error', (error) => {
      setIsConnected(false);
      console.error('[Socket] Connection error:', error.message);
    });

    clientSocket.connect();

    return () => {
      clientSocket.disconnect();
    };
  }, [token, isAuthenticated]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used inside a SocketProvider');
  }
  return context;
}
export default SocketContext;
