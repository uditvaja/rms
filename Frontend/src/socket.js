// src/socket.js
import { io } from 'socket.io-client';

let socket = null;

export const initializeSocket = () => {
  if (!socket) {
    socket = io('http://localhost:8080', {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });
  }
  return socket;
};

export const getSocket = () => {
  if (!socket) {
    return initializeSocket();
  }
  return socket;
};
