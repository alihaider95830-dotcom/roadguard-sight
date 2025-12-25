import type { InspectionRecord, Alert, DashboardStats, Operator, AuditLog, ChartDataPoint, ReportConfig } from '@/types';
import {
  generateMockInspections,
  generateMockAlerts,
  getMockDashboardStats,
  generateInspection,
  generateAlertFromInspection,
  mockOperators,
  mockAuditLogs,
  generateTrendData,
  generateDefectDistribution,
  generateLocationStats,
} from './mockData';

// Initialize mock data store
let mockInspections = generateMockInspections(150);
let mockAlerts = generateMockAlerts(mockInspections);

// Simulated API delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Event listeners for real-time updates
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

const emitEvent = <T>(event: string, data: T) => {
  eventListeners.get(event)?.forEach((callback) => callback(data));
};

// Start real-time simulation
let simulationInterval: ReturnType<typeof setInterval> | null = null;

export const startRealtimeSimulation = () => {
  if (simulationInterval) return;
  
  simulationInterval = setInterval(() => {
    // Generate new inspection
    const newInspection = generateInspection();
    mockInspections = [newInspection, ...mockInspections].slice(0, 500);
    emitEvent('inspection.created', newInspection);
    
    // If unsafe, generate alert
    if (newInspection.status === 'Unsafe') {
      const newAlert = generateAlertFromInspection(newInspection);
      newAlert.status = 'Pending';
      newAlert.escalated = false;
      mockAlerts = [newAlert, ...mockAlerts];
      emitEvent('alert.created', newAlert);
    }
  }, 5000 + Math.random() * 5000);
};

export const stopRealtimeSimulation = () => {
  if (simulationInterval) {
    clearInterval(simulationInterval);
    simulationInterval = null;
  }
};

// API Functions
export const api = {
  // Auth
  login: async (email: string, password: string): Promise<{ token: string; user: Operator }> => {
    await delay(500);
    // Auth is handled by authStore, this is a placeholder for real API
    throw new Error('Use authStore for login');
  },

  // Dashboard
  getDashboardStats: async (): Promise<DashboardStats> => {
    await delay(300);
    return getMockDashboardStats(mockInspections);
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
    await delay(400);
    
    let filtered = [...mockInspections];
    
    if (params?.from) {
      filtered = filtered.filter((i) => new Date(i.timestamp) >= new Date(params.from!));
    }
    if (params?.to) {
      filtered = filtered.filter((i) => new Date(i.timestamp) <= new Date(params.to!));
    }
    if (params?.plate) {
      filtered = filtered.filter((i) =>
        i.licensePlate?.toLowerCase().includes(params.plate!.toLowerCase())
      );
    }
    if (params?.status) {
      filtered = filtered.filter((i) => i.status === params.status);
    }
    
    // Sort by timestamp descending
    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    const page = params?.page || 1;
    const pageSize = params?.pageSize || 20;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    
    return {
      data: filtered.slice(start, end),
      total: filtered.length,
    };
  },

  getInspection: async (id: string): Promise<InspectionRecord | null> => {
    await delay(300);
    return mockInspections.find((i) => i.inspectionId === id) || null;
  },

  // Alerts
  getAlerts: async (status?: Alert['status']): Promise<Alert[]> => {
    await delay(300);
    let filtered = [...mockAlerts];
    if (status) {
      filtered = filtered.filter((a) => a.status === status);
    }
    return filtered.sort((a, b) => new Date(b.alertDate).getTime() - new Date(a.alertDate).getTime());
  },

  acknowledgeAlert: async (
    alertId: string,
    operatorId: number
  ): Promise<{ operatorId: number; responseTimeMs: number }> => {
    await delay(300);
    
    const alert = mockAlerts.find((a) => a.alertId === alertId);
    if (!alert) throw new Error('Alert not found');
    
    const responseTimeMs = Date.now() - new Date(alert.alertDate).getTime();
    alert.status = 'Acknowledged';
    alert.operatorId = operatorId;
    alert.responseTimeMs = responseTimeMs;
    alert.escalated = false;
    
    emitEvent('alert.updated', alert);
    
    return { operatorId, responseTimeMs };
  },

  resolveAlert: async (alertId: string): Promise<void> => {
    await delay(300);
    
    const alert = mockAlerts.find((a) => a.alertId === alertId);
    if (!alert) throw new Error('Alert not found');
    
    alert.status = 'Resolved';
    emitEvent('alert.updated', alert);
  },

  // Reports
  generateReport: async (config: ReportConfig): Promise<{
    chartsData: ChartDataPoint[];
    summary: { total: number; safe: number; unsafe: number; avgConfidence: number };
  }> => {
    await delay(600);
    
    let chartsData: ChartDataPoint[];
    
    switch (config.type) {
      case 'trend':
        chartsData = generateTrendData(7);
        break;
      case 'defects':
        chartsData = generateDefectDistribution();
        break;
      case 'locations':
        chartsData = generateLocationStats();
        break;
      case 'daily':
      default:
        chartsData = generateTrendData(30);
    }
    
    const total = chartsData.reduce((sum, d) => sum + d.value, 0);
    const safe = chartsData.reduce((sum, d) => sum + (d.safe || 0), 0);
    const unsafe = chartsData.reduce((sum, d) => sum + (d.unsafe || 0), 0);
    
    return {
      chartsData,
      summary: {
        total,
        safe,
        unsafe,
        avgConfidence: 0.89,
      },
    };
  },

  // Admin - Users
  getOperators: async (): Promise<Operator[]> => {
    await delay(300);
    return [...mockOperators];
  },

  toggleOperatorStatus: async (operatorId: number): Promise<Operator> => {
    await delay(300);
    const operator = mockOperators.find((o) => o.operatorId === operatorId);
    if (!operator) throw new Error('Operator not found');
    operator.enabled = !operator.enabled;
    return { ...operator };
  },

  // Admin - Audit Logs
  getAuditLogs: async (): Promise<AuditLog[]> => {
    await delay(300);
    return [...mockAuditLogs];
  },
};

export default api;
