import { io } from 'socket.io-client';

// This creates ONE single connection for the entire app to share
export const socket = io('http://localhost:5000', {
  autoConnect: true,
});