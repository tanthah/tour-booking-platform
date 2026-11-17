import axiosAdmin from '../../config/axiosAdmin';

// ============ ADMIN ENDPOINTS ============
export const listAllJourneysAdmin = (params = {}) =>
  axiosAdmin.get('/admin/journeys', { params });

export const getAvailableDeparturesAdmin = () =>
  axiosAdmin.get('/admin/journeys/available-departures');

export const getAvailableGuidesAdmin = () =>
  axiosAdmin.get('/admin/journeys/guides');

export const createJourneyAdmin = (data) =>
  axiosAdmin.post('/admin/journeys/create', data);

export const getJourneyLogsAdmin = (journeyId, params = {}) =>
  axiosAdmin.get(`/admin/journeys/${journeyId}/logs`, { params });

export const assignGuideAdmin = (journeyId, data) =>
  axiosAdmin.patch(`/admin/journeys/${journeyId}/assign-guide`, data);

export const cancelJourneyAdmin = (journeyId, data) =>
  axiosAdmin.patch(`/admin/journeys/${journeyId}/cancel`, data);

// ============ STAFF / SHARED ENDPOINTS ============
export const getAssignedJourneysStaff = (params = {}) =>
  axiosAdmin.get('/journeys/assigned', { params });

export const getJourneyDetail = (journeyId) =>
  axiosAdmin.get(`/journeys/${journeyId}`);

export const startJourney = (journeyId, data = {}) =>
  axiosAdmin.post(`/journeys/${journeyId}/start`, data);

export const completeJourney = (journeyId, data = {}) =>
  axiosAdmin.post(`/journeys/${journeyId}/complete`, data);

export const updateStopStatus = (journeyId, stopId, data) =>
  axiosAdmin.patch(`/journeys/${journeyId}/stops/${stopId}/status`, data);

export const skipStop = (journeyId, stopId, data) =>
  axiosAdmin.patch(`/journeys/${journeyId}/stops/${stopId}/skip`, data);

export const addStop = (journeyId, data) =>
  axiosAdmin.post(`/journeys/${journeyId}/stops`, data);

export const reorderStops = (journeyId, data) =>
  axiosAdmin.patch(`/journeys/${journeyId}/stops/reorder`, data);

export const adjustStopTime = (journeyId, stopId, data) =>
  axiosAdmin.patch(`/journeys/${journeyId}/stops/${stopId}/time`, data);

export const updateStopNote = (journeyId, stopId, data) =>
  axiosAdmin.patch(`/journeys/${journeyId}/stops/${stopId}/note`, data);

