import { io } from 'socket.io-client';
import axiosClient from '../../config/axiosClient';

const SOCKET_URL = 'http://localhost:5000';

export const getMyJourneys = () => axiosClient.get('/journeys/my');

export const getJourneyDetail = (journeyId) => axiosClient.get(`/journeys/${journeyId}`);

export const getJourneyNotifications = (journeyId, limit = 50) =>
  axiosClient.get(`/journeys/${journeyId}/notifications`, { params: { limit } });

export const markNotificationRead = (journeyId, notifId) =>
  axiosClient.patch(`/journeys/${journeyId}/notifications/${notifId}/read`);

export const markAllNotificationsRead = (journeyId) =>
  axiosClient.patch(`/journeys/${journeyId}/notifications/read-all`);

export function createJourneySocket() {
  const token = localStorage.getItem('token');
  return io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1500,
  });
}

