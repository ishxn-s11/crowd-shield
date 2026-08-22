// CrowdShield Mobile — API Service
export const API = 'http://localhost:8000';
const API_BASE = API;

async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  return res.json();
}

export const api = {
  // Risk & Zones
  getRiskLive: () => apiFetch('/api/risk/live'),

  // Alerts
  getActiveAlerts: () => apiFetch('/api/alerts/active'),
  acknowledgeAlert: (id: string) => apiFetch(`/api/alerts/${id}/acknowledge`, { method: 'POST' }),

  // Missing Reports
  getMissingPersons: (status = 'MISSING') => apiFetch(`/api/missing/persons?status=${status}`),
  getMissingItems: (status = 'MISSING') => apiFetch(`/api/missing/items?status=${status}`),
  createMissingPerson: (data: any) => apiFetch('/api/missing/persons', { method: 'POST', body: JSON.stringify(data) }),
  createMissingItem: (data: any) => apiFetch('/api/missing/items', { method: 'POST', body: JSON.stringify(data) }),
  updateMissingStatus: (type: string, id: string, status: string) => apiFetch(`/api/missing/${type}/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  // Incidents
  getIncidents: () => apiFetch('/api/incidents'),
  createIncident: (data: any) => apiFetch('/api/incidents', { method: 'POST', body: JSON.stringify(data) }),

  // Simulation
  getSimState: () => apiFetch('/api/simulation/state'),
  startSim: (scenario: string) => apiFetch('/api/simulation/start', { method: 'POST', body: JSON.stringify({ scenario }) }),
  stopSim: () => apiFetch('/api/simulation/stop', { method: 'POST' }),

  // Teams
  getTeams: () => apiFetch('/api/teams'),
  createTeam: (data: any) => apiFetch('/api/teams', { method: 'POST', body: JSON.stringify(data) }),

  // AI Assistant
  chat: (message: string) => apiFetch('/api/ai/chat', { method: 'POST', body: JSON.stringify({ message }) }),
};
