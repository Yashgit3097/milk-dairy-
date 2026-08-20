import { io } from 'socket.io-client';

const socketURL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

/**
 * Creates an un-connected Socket.IO client instance.
 * Allows injection of authorization token into handshake parameters.
 */
export const createSocket = (token) => {
  return io(socketURL, {
    auth: {
      token,
    },
    autoConnect: false, // Allow context manager to control connection initiation
  });
};
export default createSocket;
