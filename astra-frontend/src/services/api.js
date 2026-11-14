const BASE = 'http://localhost:8000';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Astronauts
  getAstronauts: () => request('/api/astronauts'),
  getAstronaut: (id) => request(`/api/astronauts/${id}`),
  createAstronaut: (data) => request('/api/astronauts', { method: 'POST', body: JSON.stringify(data) }),

  // Measurements
  getMeasurements: (id, limit = 50) => request(`/api/astronauts/${id}/measurements?limit=${limit}`),
  addMeasurement: (id, data) => request(`/api/astronauts/${id}/measurements`, { method: 'POST', body: JSON.stringify(data) }),

  // Anomaly detection
  detectAnomaly: (id, data) => request(`/api/astronauts/${id}/detect`, { method: 'POST', body: JSON.stringify(data) }),

  // Baselines
  getBaselines: (id) => request(`/api/astronauts/${id}/baselines`),

  // Forecasts
  getForecast: (id, metric) => request(`/api/astronauts/${id}/forecast/${metric}`),
  getAllForecasts: (id) => request(`/api/astronauts/${id}/forecasts`),

  // Wellness checkins
  getCheckins: (id, limit = 50) => request(`/api/astronauts/${id}/checkins?limit=${limit}`),
  addCheckin: (id, data) => request(`/api/astronauts/${id}/checkins`, { method: 'POST', body: JSON.stringify(data) }),

  // Reaction game
  getReactionResults: (id, limit = 50) => request(`/api/astronauts/${id}/reaction?limit=${limit}`),
  addReactionResult: (id, data) => request(`/api/astronauts/${id}/reaction`, { method: 'POST', body: JSON.stringify(data) }),

  // Environment
  getEnvironment: (limit = 100) => request(`/api/environment?limit=${limit}`),
  getCumulativeRadiation: () => request('/api/environment/cumulative'),
  addEnvironmentReading: (data) => request('/api/environment', { method: 'POST', body: JSON.stringify(data) }),

  // Alerts
  getAlerts: (id, resolved) => request(`/api/astronauts/${id}/alerts${resolved !== undefined ? `?resolved=${resolved}` : ''}`),
  getAllAlerts: (severity) => request(`/api/alerts${severity ? `?severity=${severity}` : ''}`),
  resolveAlert: (id) => request(`/api/alerts/${id}/resolve`, { method: 'PUT' }),

  // Mission Control
  getMissionControlOverview: () => request('/api/mission-control/overview'),

  // Copilot
  askCopilot: (question) => request('/api/copilot/ask', { method: 'POST', body: JSON.stringify({ question }) }),

  // Demo
  seedDemo: () => request('/api/demo/seed', { method: 'POST' }),
  simulateMeasurement: (id) => request(`/api/demo/simulate-measurement/${id}`, { method: 'POST' }),

  // Health
  health: () => request('/api/health'),
};
