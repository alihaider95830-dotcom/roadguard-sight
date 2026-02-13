import type { InspectionRecord, Alert, DashboardStats, Operator, AuditLog, ChartDataPoint, ReportConfig } from '@/types';

// ---- helpers ----

function getToken(): string | null {
  try {
    const raw = localStorage.getItem('atis-auth');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.state?.token ?? null;
  } catch {
    return null;
  }
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Only set Content-Type for JSON bodies (not FormData)
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(url, { ...options, headers });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }

  return res.json();
}

// ---- Event system for real-time updates (SocketIO) ----

type EventCallback<T> = (data: T) => void;
const eventListeners: Map<string, Set<EventCallback<unknown>>> = new Map();

export const subscribeToEvents = <T>(event: string, callback: EventCallback<T>): (() => void) => {
  if (!eventListeners.has(event)) {
    eventListeners.set(event, new Set());
  }
  eventListeners.get(event)!.add(callback as EventCallback<unknown>);

  return () => {
    eventListeners.get(event)?.delete(callback as EventCallback<unknown>);
  };
};

export const startRealtimeSimulation = () => {
  // For full SocketIO real-time support, install socket.io-client:
  //   npm install socket.io-client
  //
  // Then use:
  //   import { io } from 'socket.io-client';
  //   const socket = io();
  //   socket.on('inspection.created', (data) => { ... });
  //   socket.on('alert.created', (data) => { ... });
  //   socket.on('alert.updated', (data) => { ... });
};

export const stopRealtimeSimulation = () => {
  // Cleanup SocketIO connection here if needed
};

// ---- API functions ----

export const api = {
  // Auth
  login: async (email: string, password: string): Promise<{ token: string; user: Operator }> => {
    return request<{ token: string; user: Operator }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  // Dashboard
  getDashboardStats: async (): Promise<DashboardStats> => {
    return request<DashboardStats>('/api/dashboard/stats');
  },

  // Inspections
  getInspections: async (params?: {
    from?: string;
    to?: string;
    plate?: string;
    status?: 'Safe' | 'Unsafe';
    page?: number;
    pageSize?: number;
  }): Promise<{ data: InspectionRecord[]; total: number }> => {
    const searchParams = new URLSearchParams();
    if (params?.from) searchParams.set('from', params.from);
    if (params?.to) searchParams.set('to', params.to);
    if (params?.plate) searchParams.set('plate', params.plate);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.pageSize) searchParams.set('pageSize', String(params.pageSize));

    const qs = searchParams.toString();
    return request<{ data: InspectionRecord[]; total: number }>(
      `/api/inspections${qs ? '?' + qs : ''}`
    );
  },

  getInspection: async (id: string): Promise<InspectionRecord | null> => {
    try {
      return await request<InspectionRecord>(`/api/inspections/${id}`);
    } catch {
      return null;
    }
  },

  // Alerts
  getAlerts: async (status?: Alert['status']): Promise<Alert[]> => {
    const qs = status ? `?status=${status}` : '';
    return request<Alert[]>(`/api/alerts${qs}`);
  },

  acknowledgeAlert: async (
    alertId: string,
    operatorId: number
  ): Promise<{ operatorId: number; responseTimeMs: number }> => {
    return request<{ operatorId: number; responseTimeMs: number }>(
      `/api/alerts/${alertId}/acknowledge`,
      { method: 'PUT' }
    );
  },

  resolveAlert: async (alertId: string): Promise<void> => {
    await request<{ message: string }>(`/api/alerts/${alertId}/resolve`, {
      method: 'PUT',
    });
  },

  // Reports
  generateReport: async (config: ReportConfig): Promise<{
    chartsData: ChartDataPoint[];
    summary: { total: number; safe: number; unsafe: number; avgConfidence: number };
  }> => {
    return request('/api/reports/generate', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  },

  // Admin - Users
  getOperators: async (): Promise<Operator[]> => {
    return request<Operator[]>('/api/admin/operators');
  },

  toggleOperatorStatus: async (operatorId: number): Promise<Operator> => {
    return request<Operator>(`/api/admin/operators/${operatorId}/toggle`, {
      method: 'PUT',
    });
  },

  // Admin - Audit Logs
  getAuditLogs: async (): Promise<AuditLog[]> => {
    return request<AuditLog[]>('/api/admin/audit');
  },

  // ML - Tire Inspection
  inspectTire: async (
    imageFile: File,
    metadata?: { location?: string; cameraId?: string; licensePlate?: string }
  ): Promise<{
    inspection: InspectionRecord;
    mlResult: {
      status: string;
      confidence: number;
      defectTypes: string[];
      processingDurationMs: number;
    };
    alert?: Alert;
  }> => {
    const formData = new FormData();
    formData.append('image', imageFile);
    if (metadata?.location) formData.append('location', metadata.location);
    if (metadata?.cameraId) formData.append('cameraId', metadata.cameraId);
    if (metadata?.licensePlate) formData.append('licensePlate', metadata.licensePlate);

    return request('/api/ml/inspect', {
      method: 'POST',
      body: formData,
    });
  },

  // ML - Status
  getMlStatus: async (): Promise<{
    modelLoaded: boolean;
    modelPath: string;
    supportedDefects: string[];
    supportedFormats: string[];
  }> => {
    return request('/api/ml/status');
  },
};

export default api;
