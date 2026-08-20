import { io } from 'socket.io-client';

const socketURL = import.meta.env.VITE_SOCKET_URL || 'https://milk-dairy-4bi2.onrender.com';

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
